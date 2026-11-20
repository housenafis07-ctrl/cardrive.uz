import { createServiceRoleClient } from "@/supabase/server";
import { getLatestUsdUzsRate } from "@/lib/cbu-exchange-rates";
import { AnnouncementTicker } from "@/components/announcement-ticker";
export async function SiteAnnouncementBar({ locale }: { locale: string }) {
 const client=createServiceRoleClient(); const now=new Date().toISOString();
 const [{data},rate]=await Promise.all([
  client.from("site_announcements").select("id,kind,title_uz,title_ru,href,rate_value,rate_date").eq("is_active",true).or("starts_at.is.null,starts_at.lte."+now).or("ends_at.is.null,ends_at.gt."+now).order("sort_order").order("created_at",{ascending:false}).limit(20),
  getLatestUsdUzsRate().catch(()=>null)
 ]);
 return <AnnouncementTicker items={data??[]} locale={locale} usdRate={rate?{rate:rate.rate,rateDate:rate.rateDate}:null}/>;
}
