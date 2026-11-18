import Link from "next/link";
import type { Locale } from "@/lib/i18n";

export function MarketplaceEntryCards({ locale }: { locale: Locale }) {
  const ru = locale === "ru";
  return (
    <section className="marketplace-home mx-auto flex min-h-[100svh] w-full max-w-[1440px] items-center px-4 py-8 sm:px-8 lg:px-10">
      <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:gap-7">
        <Link
          href="/cars"
          aria-label={ru ? "Новые автомобили" : "Yangi avtomobillar"}
          className="marketplace-card marketplace-card--new group"
        >
          <img
            src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1500&q=88"
            alt=""
            aria-hidden="true"
            className="marketplace-card__car marketplace-card__car--new"
            loading="eager"
            fetchPriority="high"
          />
          <span className="marketplace-card__light marketplace-card__light--blue" aria-hidden="true" />
          <span className="marketplace-card__content">
            <span className="marketplace-card__eyebrow">{ru ? "CARDRIVE · OFFICIAL" : "CARDRIVE · RASMIY DILERLAR"}</span>
            <span className="marketplace-card__title">{ru ? "Новые автомобили" : "Yangi avtomobillar"}</span>
            <span className="marketplace-cta marketplace-cta--blue">
              <span>{ru ? "Перейти" : "Kirish"}</span>
              <span aria-hidden="true" className="text-lg transition-transform duration-300 group-hover:translate-x-1">→</span>
            </span>
          </span>
          <span className="marketplace-card__index" aria-hidden="true">01</span>
        </Link>
        <Link
          href="/avtobozor"
          aria-label={ru ? "Авторынок — подержанные автомобили" : "Avtobozor — ikkilamchi avtomobillar bozori"}
          className="marketplace-card marketplace-card--used group"
        >
          <img
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1500&q=88"
            alt=""
            aria-hidden="true"
            className="marketplace-card__car marketplace-card__car--used"
            loading="eager"
          />
          <span className="marketplace-card__light marketplace-card__light--green" aria-hidden="true" />
          <span className="marketplace-card__content">
            <span className="marketplace-card__eyebrow">{ru ? "CARDRIVE · ВТОРИЧНЫЙ РЫНОК" : "CARDRIVE · IKKILAMCHI BOZOR"}</span>
            <span className="marketplace-card__title">{ru ? "Авторынок" : "Avtobozor"}</span>
            <span className="marketplace-cta marketplace-cta--green">
              <span>{ru ? "Перейти" : "Kirish"}</span>
              <span aria-hidden="true" className="text-lg transition-transform duration-300 group-hover:translate-x-1">→</span>
            </span>
          </span>
          <span className="marketplace-card__index" aria-hidden="true">02</span>
        </Link>
      </div>
    </section>
  );
}