import { NextRequest } from "next/server";
import { AdminReconciliationRepository } from "@/repositories/admin-reconciliation-repository";

const escXml = (v: unknown) => String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");

const crc32 = (bytes: Uint8Array) => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const u16 = (n: number) => Uint8Array.from([n & 255, (n >>> 8) & 255]);
const u32 = (n: number) => Uint8Array.from([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]);

function zip(files: Record<string, string>) {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  const concat = (parts: Uint8Array[]) => {
    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let at = 0;
    for (const p of parts) { out.set(p, at); at += p.length; }
    return out;
  };

  for (const [name, text] of Object.entries(files)) {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(text);
    const crc = crc32(data);
    const local = concat([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), nameBytes, data,
    ]);
    chunks.push(local);
    const entry = concat([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameBytes,
    ]);
    central.push(entry);
    offset += local.length;
  }

  const centralBytes = concat(central);
  const body = concat([...chunks, centralBytes, u32(0x06054b50), u16(0), u16(0), u16(central.length), u16(central.length), u32(centralBytes.length), u32(offset), u16(0)]);
  return body;
}

function makeXlsx(rows: string[][]) {
  const sheetRows = rows.map((row, r) => `<row r="${r + 1}">${row.map((value, c) => `<c r="${String.fromCharCode(65 + Math.min(c, 25))}${r + 1}" t="inlineStr"><is><t xml:space="preserve">${escXml(value)}</t></is></c>`).join("")}</row>`).join("");
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`;
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sverka reyestri" sheetId="1" r:id="rId1"/></sheets></workbook>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`;
  const types = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`;
  return zip({"[Content_Types].xml": types, "_rels/.rels": rels, "xl/workbook.xml": workbook, "xl/_rels/workbook.xml.rels": workbookRels, "xl/worksheets/sheet1.xml": sheet});
}

export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams;
  const filters = { dateFrom: s.get("dateFrom") || undefined, dateTo: s.get("dateTo") || undefined, bank: s.get("bank") || undefined, dealer: s.get("dealer") || undefined, program: s.get("program") || undefined, purchaseType: s.get("purchaseType") || undefined, status: s.get("status") || undefined };
  const rows = await new AdminReconciliationRepository().list(filters);
  const header = ["Ariza/buyurtma", "Sana-vaqt", "Mijoz", "Telefon", "Avtomobil", "Rang", "Narx", "Boshlang‘ich to‘lov", "Kredit summasi", "Foiz", "Muddat (oy)", "Bank", "Kredit dasturi", "Diler", "Sotuv turi", "Holat", "Ariza berilgan", "OneID roziligi", "Bankka yuborilgan", "Ariza holati"];
  const body = rows.map(r => [r.orderNumber, r.createdAt, r.customerName, r.phone, r.car, r.color, String(r.price), String(r.downPayment), String(r.financedAmount), `${r.interestRate}%`, `${r.termMonths} oy`, r.bank, r.program, r.dealer, r.purchaseType, r.status, r.applicationCreatedAt, r.consentAt, r.submittedAt, r.applicationStatus].map(v => String(v ?? "—")));
  const xlsx = makeXlsx([header, ...body]);
  return new Response(xlsx as BodyInit, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": "attachment; filename=cardrive-sverka-reyestri.xlsx", "Cache-Control": "no-store" } });
}
