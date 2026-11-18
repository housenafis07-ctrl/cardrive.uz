import { MarketplaceEntryCards } from "@/components/marketplace-entry-cards";
import { getLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Cardrive.uz — Yangi avtomobillar va Avtobozor",
  description: "Cardrive.uz: yangi avtomobillar va ikkilamchi bozordagi ishlatilgan avtomobillar.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const locale = await getLocale();
  return (
    <main className="min-h-[100svh] bg-slate-50">
      <MarketplaceEntryCards locale={locale} />
    </main>
  );
}