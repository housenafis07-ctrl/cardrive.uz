import { getLocale } from "@/lib/locale";

export default async function ForbiddenPage() {
  const locale=await getLocale();
  const ru=locale==="ru";
  return <main className="mx-auto max-w-xl p-12"><h1 className="text-2xl font-bold">{ru?"Доступ запрещён":"Kirish taqiqlangan"}</h1><p className="mt-2 text-slate-600">{ru?"У вас нет разрешения на доступ к этому разделу.":"Sizda ushbu bo‘limga kirish uchun ruxsat yo‘q."}</p></main>;
}
