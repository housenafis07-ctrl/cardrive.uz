import { Header, Footer } from "@/components/site-chrome";
import { SavedVehiclesPage } from "@/components/vehicle-favorites";
import { getLocale } from "@/lib/locale";

export const metadata = { title: "Saqlangan avtomobillar | Cardrive.uz" };
export default async function SavedCarsPage() {
  const locale = await getLocale();
  return <><Header/><SavedVehiclesPage locale={locale}/><Footer/></>;
}
