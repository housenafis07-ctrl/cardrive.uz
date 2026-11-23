import {createServiceRoleClient} from "@/supabase/server";
import {getLatestUsdUzsRate} from "@/lib/cbu-exchange-rates";
import {AnnouncementTicker} from "@/components/announcement-ticker";
import {newsSlug} from "@/lib/news-seo";

export async function SiteAnnouncementBar({locale}:{locale:string}){
 const db=createServiceRoleClient();const now=new Date().toISOString();
 const [{data:announcements},{data:articles,error:newsError},rate]=await Promise.all([
  db.from("site_announcements").select("id,kind,title_uz,title_ru,href").eq("is_active",true).or("starts_at.is.null,starts_at.lte."+now).or("ends_at.is.null,ends_at.gt."+now).order("sort_order").order("created_at",{ascending:false}).limit(12),
  db.from("news_articles").select("id,title_uz,title_ru,title_en,is_featured,ticker_order").eq("is_published",true).order("is_featured",{ascending:false}).order("ticker_order",{ascending:true}).order("published_at",{ascending:false,nullsFirst:false}).limit(8),
  getLatestUsdUzsRate().catch(()=>null)
 ]);
 // Migration hali qo'llanmagan Preview/rollback holatida eski ustunlar bilan ticker yangiliklarini ko'rsatishda davom etadi.
 const legacyArticles=newsError
  ? await db.from("news_articles").select("id,title_uz,title_ru,title_en,published_at").eq("is_published",true).order("published_at",{ascending:false,nullsFirst:false}).limit(8)
  : null;
 const articleRows=articles??legacyArticles?.data??[];
 const tickerAnnouncements=(announcements??[]).map(a=>({...a,rate_value:null,rate_date:null}));
 const news=articleRows.map(a=>({id:"news-"+a.id,kind:"news" as const,title_uz:locale==="ru"?a.title_ru:locale==="en"?a.title_en:a.title_uz,title_ru:null,href:"/news/"+newsSlug(a.title_uz,a.id),rate_value:null,rate_date:null}));
 return <AnnouncementTicker items={[...tickerAnnouncements,...news]} locale={locale} usdRate={rate?{rate:rate.rate,rateDate:rate.rateDate}:null}/>;
}
