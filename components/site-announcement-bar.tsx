import {createServiceRoleClient} from "@/supabase/server";
import {getLatestUsdUzsRate} from "@/lib/cbu-exchange-rates";
import {AnnouncementTicker} from "@/components/announcement-ticker";
export async function SiteAnnouncementBar({locale}:{locale:string}){
 const db=createServiceRoleClient();const now=new Date().toISOString();
 const [{data:announcements},{data:articles},rate]=await Promise.all([
  db.from("site_announcements").select("id,kind,title_uz,title_ru,href").eq("is_active",true).or("starts_at.is.null,starts_at.lte."+now).or("ends_at.is.null,ends_at.gt."+now).order("sort_order").order("created_at",{ascending:false}).limit(12),
  db.from("news_articles").select("id,title_uz,title_ru,title_en").eq("is_published",true).order("published_at",{ascending:false,nullsFirst:false}).limit(8),
  getLatestUsdUzsRate().catch(()=>null)
 ]);
 const news=(articles??[]).map(a=>({id:"news-"+a.id,kind:"news" as const,title_uz:locale==="ru"?a.title_ru:locale==="en"?a.title_en:a.title_uz,title_ru:null,href:"/news",rate_value:null,rate_date:null}));
 return <AnnouncementTicker items={[...(announcements??[]),...news]} locale={locale} usdRate={rate?{rate:rate.rate,rateDate:rate.rateDate}:null}/>;
}
