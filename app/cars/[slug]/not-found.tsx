import Link from "next/link";
import { Header, Footer } from "@/components/site-chrome";
export default function NotFound() { return <><Header/><main className="mx-auto max-w-xl px-5 py-24 text-center"><p className="text-sm font-bold text-amber-600">404</p><h1 className="mt-2 text-3xl font-black">Avtomobil topilmadi</h1><Link href="/cars" className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 font-bold text-white">Katalogga qaytish</Link></main><Footer/></>; }
