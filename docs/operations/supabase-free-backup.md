# Cardrive Free-tier Supabase backup

This workflow provides an encrypted, off-project logical backup while Cardrive remains on Supabase Free. It does not enable Supabase-managed daily backups or PITR.

## GitHub Actions secrets required

Add these repository Actions secrets before enabling the workflow:

- `SUPABASE_DB_URL`: Cardrive Production database connection string. Prefer the Supabase Session Pooler URI if the runner/network cannot use IPv6. Store the password only in this secret.
- `SUPABASE_SERVICE_ROLE_KEY`: Cardrive server-side service-role key. Never add it to repository files or frontend environment variables.
- `BACKUP_ENCRYPTION_PASSPHRASE`: a long, randomly generated passphrase (at least 32 random bytes). Keep a separate copy in an offline password manager; without it the artifacts cannot be decrypted.

Workflow: `.github/workflows/supabase-free-backup.yml`

Runs daily at 02:00 UTC and on manual dispatch. The encrypted archive is retained as a private GitHub Actions artifact for 14 days. GitHub artifact storage/retention quotas still apply; monitor the Actions storage quota.

## Backup contents and limitations

- PostgreSQL roles, application schema, and application data via the pinned Supabase CLI `db dump`.
- Auth user records and identity metadata via the Auth Admin list-users API.
- Files in the `car-images` Storage bucket, plus bucket metadata.
- Archive is encrypted with GPG AES-256 before upload.

Important limitations:

- The CLI dump excludes Supabase-managed `auth` and `storage` schemas. The Auth export is an identity/metadata inventory only; it does not export password hashes, active sessions, MFA secrets, provider credentials, or all Auth service configuration. Users may need to reauthenticate or reset passwords after a recovery.
- Storage objects are downloaded separately. Review `storage/manifest.json` after a run and compare object count with the live bucket.
- Supabase Edge Functions, Auth provider settings, SMTP settings, secrets, API keys, DNS/custom domains, and Vercel environment variables are not included. Keep a separate secure inventory of configuration, never plaintext secrets in Git.
- GitHub Actions artifacts are a short-retention recovery copy, not a substitute for independent long-term object storage or Supabase-managed physical backups. For stronger resilience, periodically copy the encrypted archive to an independently controlled storage provider.

## Restore outline

1. Download the encrypted artifact from the private repository's Actions run.
2. Verify it with `sha256sum -c SHA256SUMS`.
3. Decrypt using the offline passphrase: `gpg --decrypt --output cardrive-backup.tar.gz cardrive-*.tar.gz.gpg`.
4. Extract into an isolated restore target first; never restore directly over Production as an initial test.
5. Restore roles/schema/data using the Supabase CLI/psql procedure appropriate to the target project.
6. Recreate Auth users through a controlled import or password-reset flow; do not assume metadata JSON is a drop-in Auth restore.
7. Upload Storage files and restore bucket settings after checking object paths and public/private access.
8. Verify row counts, RLS, functions, triggers, Auth login, and image URLs before considering cutover.

## Operational checks

- Run the workflow manually after adding secrets.
- Confirm the artifact exists, decrypts, and contains SQL files, Auth metadata, and the Storage manifest.
- Perform a restore drill to a separate isolated project before relying on this backup for disaster recovery.
