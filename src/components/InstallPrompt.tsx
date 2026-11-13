import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";

const KEY = "marhaba_install_dismissed";
const WEEK = 7 * 24 * 60 * 60 * 1000;

const isStandalone = () => {
  try {
    return window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
  } catch { return false; }
};
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;

const recentlyDismissed = () => {
  try {
    const t = Number(localStorage.getItem(KEY) || 0);
    return !!t && Date.now() - t < WEEK;
  } catch { return false; }
};

/** شريط علوي يعرض «تثبيت مرحبا» لأي زائر على جواله. لا يظهر في صفحة الطوارئ حتى لا يشغل من يساعد شخصاً. */
export default function InstallPrompt() {
  const { screen, lang } = useApp();
  const isAr = lang === "ar";
  const evt = useRef<any>(null);
  const [mode, setMode] = useState<"" | "android" | "ios">("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;
    let timer: any;
    const onPrompt = (e: any) => {
      e.preventDefault();
      evt.current = e;
      setMode("android");
      timer = setTimeout(() => setOpen(true), 2500);
    };
    const onInstalled = () => { setOpen(false); evt.current = null; };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (isIOS()) {
      setMode("ios");
      timer = setTimeout(() => setOpen(true), 2500);
    }
    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    setOpen(false);
    try { localStorage.setItem(KEY, String(Date.now())); } catch {}
  };

  const install = async () => {
    const e = evt.current;
    if (!e) return;
    try {
      e.prompt();
      await e.userChoice;
    } catch {}
    evt.current = null;
    setOpen(false);
  };

  if (!open || !mode || screen === "reader-emergency") return null;

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      style={{
        position: "fixed", top: 10, left: 10, right: 10, zIndex: 9999,
        background: "#14141c", border: "1.5px solid #c9a84c", borderRadius: 16,
        padding: "12px 14px", boxShadow: "0 8px 30px rgba(0,0,0,.55)",
        display: "flex", alignItems: "center", gap: 12, maxWidth: 480, margin: "0 auto",
      }}
    >
      <img src="/icon-192.png" alt="" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#c9a84c" }}>
          {isAr ? "ثبّت مرحبا على جوالك" : "Install Marhaba on your phone"}
        </div>
        <div style={{ fontSize: 12, color: "#ddd", lineHeight: 1.6 }}>
          {mode === "ios"
            ? (isAr ? "اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية»" : "Tap Share, then “Add to Home Screen”")
            : (isAr ? "وصول أسرع بدون متصفح" : "Faster access, like an app")}
        </div>
      </div>
      {mode === "android" && (
        <button onClick={install} style={{ background: "#c9a84c", color: "#0a0a10", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
          {isAr ? "تثبيت" : "Install"}
        </button>
      )}
      <button onClick={dismiss} aria-label={isAr ? "إغلاق" : "Close"} style={{ background: "transparent", color: "#aaa", border: "none", fontSize: 20, cursor: "pointer", padding: 4 }}>
        ✕
      </button>
    </div>
  );
}
