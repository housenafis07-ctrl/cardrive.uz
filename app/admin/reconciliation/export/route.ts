import { NextRequest } from "next/server";
import { AdminReconciliationRepository } from "@/repositories/admin-reconciliation-repository";

const esc=(v:unknown)=>`"${String(v??"").replaceAll('"','""')}"`;
export async function GET(req:NextRequest){
  const s=req.nextUrl.searchParams; const filters={dateFrom:s.get("dateFrom")||undefined,dateTo:s.get("dateTo")||undefined,bank:s.get("bank")||undefined,dealer:s.get("dealer")||undefined,program:s.get("program")||undefined,purchaseType:s.get("purchaseType")||undefined,status:s.get("status")||undefined};
  const rows=await new AdminReconciliationRepository().list(filters);
  const header=["Ariza/buyurtma","Sana-vaqt","Mijoz","Telefon","Avtomobil","Rang","Narx","Boshlang‘ich to‘lov","Kredit summasi","Foiz","Muddat (oy)","Bank","Kredit dasturi","Diler","Sotuv turi","Holat","Ariza berilgan","OneID roziligi","Bankka yuborilgan","Ariza holati"];
  const body=rows.map(r=>[r.orderNumber,r.createdAt,r.customerName,r.phone,r.car,r.color,r.price,r.downPayment,r.financedAmount,r.interestRate,r.termMonths,r.bank,r.program,r.dealer,r.purchaseType,r.status,r.applicationCreatedAt,r.consentAt,r.submittedAt,r.applicationStatus].map(esc).join(","));
  const csv="\ufeff"+[header.map(esc).join(","),...body].join("\r\n");
  return new Response(csv,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":"attachment; filename=cardrive-sverka-reyestri.csv"}});
}
