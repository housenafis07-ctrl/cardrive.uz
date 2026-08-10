"use client";
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="mx-auto max-w-xl p-12"><h1 className="text-2xl font-bold">Something went wrong</h1><button className="mt-4 rounded bg-slate-900 px-4 py-2 text-white" onClick={reset}>Try again</button></main>; }
