import { NextResponse } from "next/server";
import { syncNewsFeeds } from "@/lib/news-aggregator";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET;
 if(!secret)return NextResponse.json({ok:false,error:"CRON_SECRET is not configured"},{status:503});
 if(request.headers.get("authorization")!==`Bearer ${secret}`)return NextResponse.json({ok:false,error:"Unauthorized"},{status:401});
 try{return NextResponse.json({ok:true,...await syncNewsFeeds()})}
 catch(error){console.error("[cron:news] sync failed",error);return NextResponse.json({ok:false,error:error instanceof Error?error.message:"Unknown news sync error"},{status:502})}
}
