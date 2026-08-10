import { Header, Footer } from "@/components/site-chrome";
import { CatalogSkeleton } from "@/components/catalog-ui";
export default function Loading() { return <><Header/><main className="mx-auto max-w-7xl px-5 py-10"><div className="mb-8 h-12 w-64 animate-pulse rounded bg-slate-200"/><CatalogSkeleton/></main><Footer/></>; }
