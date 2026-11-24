"use client";

import { useEffect, useState } from "react";

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type TelegramWebApp = {
  initData?: string;
  version?: string;
  isVersionAtLeast?: (version: string) => boolean;
  checkHomeScreenStatus?: (callback?: (status: string) => void) => void;
  addToHomeScreen?: () => void;
  onEvent?: (event: string, callback: () => void) => void;
  offEvent?: (event: string, callback: () => void) => void;
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

const DISMISS_KEY = "cardrive-home-install-dismissed-until";
const INSTALLED_KEY = "cardrive-pwa-installed";

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function wasDismissed() {
  try {
    return Number(window.localStorage.getItem(DISMISS_KEY) ?? 0) > Date.now();
  } catch {
    return false;
  }
}

export function HomeScreenInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredInstallPrompt | null>(null);
  const [mode, setMode] = useState<"pwa" | "ios" | "telegram" | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isStandalone()) {
      try { window.localStorage.setItem(INSTALLED_KEY, "1"); } catch {}
      return;
    }
    if (wasDismissed()) return;

    let active = true;
    let fallbackTimer: number | undefined;
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const telegram = window.Telegram?.WebApp;
    const inTelegram = Boolean(telegram?.initData);

    const onTelegramAdded = () => {
      if (!active) return;
      setMode(null);
      setMessage("Cardrive telefon bosh ekraniga qo‘shildi.");
      try { window.localStorage.setItem(INSTALLED_KEY, "1"); } catch {}
    };

    if (inTelegram && telegram?.addToHomeScreen && telegram.isVersionAtLeast?.("8.0")) {
      telegram.onEvent?.("homeScreenAdded", onTelegramAdded);
      telegram.checkHomeScreenStatus?.((status) => {
        if (!active) return;
        if (status === "missed" || status === "unknown") {
          setMode("telegram");
        }
      });
    } else if (isIOS) {
      setMode("ios");
    } else {
      fallbackTimer = window.setTimeout(() => {
        if (active && /Android|Mobile/i.test(ua) && !deferredPrompt) setMode("pwa");
      }, 3500);
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      if (!active || inTelegram) return;
      setDeferredPrompt(event as DeferredInstallPrompt);
      setMode("pwa");
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
    };
    const onInstalled = () => {
      if (!active) return;
      setDeferredPrompt(null);
      setMode(null);
      setMessage("Cardrive ilovasi o‘rnatildi.");
      try { window.localStorage.setItem(INSTALLED_KEY, "1"); } catch {}
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      active = false;
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      telegram?.offEvent?.("homeScreenAdded", onTelegramAdded);
    };
  }, []);

  function dismiss() {
    setMode(null);
    try { window.localStorage.setItem(DISMISS_KEY, String(Date.now() + 14 * 24 * 60 * 60 * 1000)); } catch {}
  }

  async function installPwa() {
    if (!deferredPrompt) {
      setMessage("Brauzer menyusidan “Ilovani o‘rnatish” yoki “Bosh ekranga qo‘shish” bandini tanlang.");
      return;
    }
    setBusy(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") setMode(null);
      setDeferredPrompt(null);
    } catch {
      setMessage("O‘rnatish oynasini ochib bo‘lmadi. Brauzer menyusidan qayta urinib ko‘ring.");
    } finally {
      setBusy(false);
    }
  }

  function installTelegram() {
    const webApp = window.Telegram?.WebApp;
    if (!webApp?.addToHomeScreen) {
      setMessage("Telegram ilovasini yangilang yoki brauzer orqali o‘rnatish usulidan foydalaning.");
      return;
    }
    webApp.addToHomeScreen();
  }

  if (!mode && !message) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/55 p-4 sm:items-center" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="home-install-title" className="w-full max-w-sm rounded-3xl border border-white/70 bg-white p-6 shadow-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-2xl font-black text-white shadow-lg">C</div>
        <h2 id="home-install-title" className="text-center text-xl font-black text-slate-950">Cardrive’ni ilova kabi ishlating</h2>
        <p className="mt-2 text-center text-sm leading-6 text-slate-600">
          {message || (mode === "telegram"
            ? "Cardrive’ni Telegram orqali telefon bosh ekraniga qo‘shing."
            : mode === "ios"
              ? "Cardrive ikonkasini bosh ekranga qo‘shish uchun quyidagi amallarni bajaring."
              : "Saytni telefoningiz bosh ekraniga qo‘shing va keyingi safar ilova kabi oching.")}
        </p>
        {mode === "ios" ? (
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700">
            <li>Safari brauzerida “Ulashish” tugmasini bosing.</li>
            <li>“Bosh ekranga qo‘shish” bandini tanlang.</li>
            <li>Yuqoridan “Qo‘shish”ni bosing.</li>
          </ol>
        ) : null}
        {mode === "pwa" && !message ? (
          <p className="mt-3 text-center text-xs text-slate-500">Android: “O‘rnatish” tugmasini tasdiqlang. Agar tugma chiqmasa, brauzer menyusidan “Ilovani o‘rnatish”ni tanlang.</p>
        ) : null}
        <div className="mt-5 grid gap-2">
          {mode === "telegram" ? (
            <button type="button" onClick={installTelegram} className="w-full rounded-xl bg-[#229ED9] px-4 py-3 text-sm font-bold text-white">Telegram orqali bosh ekranga qo‘shish</button>
          ) : mode === "pwa" ? (
            <button type="button" onClick={installPwa} disabled={busy} className="w-full rounded-xl bg-[#0877F9] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? "Kutilmoqda…" : "Cardrive’ni o‘rnatish"}</button>
          ) : null}
          {message ? <button type="button" onClick={() => setMessage("")} className="w-full rounded-xl bg-[#0877F9] px-4 py-3 text-sm font-bold text-white">Yopish</button> : (
            <button type="button" onClick={dismiss} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">Hozir emas</button>
          )}
        </div>
      </section>
    </div>
  );
}
