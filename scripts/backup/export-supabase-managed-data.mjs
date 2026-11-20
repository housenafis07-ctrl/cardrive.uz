import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const root = process.env.BACKUP_DIR;

if (!url || !serviceKey || !root) {
  throw new Error("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and BACKUP_DIR are required");
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function writeJson(relativePath, value) {
  const destination = path.join(root, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, JSON.stringify(value, null, 2), { mode: 0o600 });
}

function safeDestination(relativePath) {
  const destination = path.resolve(root, relativePath);
  if (destination !== root && !destination.startsWith(root + path.sep)) {
    throw new Error("Refusing to write outside backup directory");
  }
  return destination;
}

async function exportAuthUsers() {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw new Error(`Auth user export failed: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }

  await writeJson("auth/users-metadata.json", {
    exportedAt: new Date().toISOString(),
    projectUrl: url,
    userCount: users.length,
    note: "Admin API export for identity inventory and metadata recovery. Password hashes, active sessions and provider secrets are not exported; users may need to reauthenticate or reset passwords.",
    users,
  });
  console.log(`Exported ${users.length} Auth user records (metadata only; no password hashes/sessions).`);
}

async function listAll(bucketName, pathPrefix = "") {
  const all = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage.from(bucketName).list(pathPrefix, {
      limit: 1000,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(`Storage list failed at ${pathPrefix || "/"}: ${error.message}`);
    all.push(...data);
    if (data.length < 1000) break;
  }
  return all;
}

async function exportStorage() {
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) throw new Error(`Storage bucket export failed: ${bucketError.message}`);

  await writeJson("storage/buckets.json", buckets);

  for (const bucket of buckets) {
    let downloaded = 0;

    async function walk(folder = "") {
      const entries = await listAll(bucket.name, folder);
      for (const entry of entries) {
        const objectPath = folder ? `${folder}/${entry.name}` : entry.name;
        if (entry.id == null) {
          await walk(objectPath);
          continue;
        }

        const { data, error } = await supabase.storage.from(bucket.name).download(objectPath);
        if (error) throw new Error(`Storage download failed for ${bucket.name}/${objectPath}: ${error.message}`);

        const relativePath = path.posix.join("storage", bucket.name, objectPath);
        const destination = safeDestination(relativePath);
        await mkdir(path.dirname(destination), { recursive: true });
        await writeFile(destination, Buffer.from(await data.arrayBuffer()), { mode: 0o600 });
        downloaded += 1;
      }
    }

    await walk();
    await writeJson(`storage/manifests/${bucket.name}.json`, {
      bucket: bucket.name,
      exportedAt: new Date().toISOString(),
      objectCount: downloaded,
      public: bucket.public,
    });
    console.log(`Downloaded ${downloaded} objects from storage bucket ${bucket.name}.`);
  }
}

await mkdir(root, { recursive: true, mode: 0o700 });
await exportAuthUsers();
await exportStorage();
