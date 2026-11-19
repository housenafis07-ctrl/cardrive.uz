"use client";

import { useState, type ReactNode } from "react";

export function CollapsibleFilters({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <section>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="mb-3 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left font-black shadow-sm md:hidden"
      >
        <span>{title}</span>
        <span aria-hidden="true" className="text-lg leading-none">{open ? "−" : "+"}</span>
      </button>
      <div className={open ? "block" : "hidden md:block"}>{children}</div>
    </section>
  );
}
