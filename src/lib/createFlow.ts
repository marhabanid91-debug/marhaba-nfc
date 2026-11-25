export type Sec = "business" | "events" | "emergency";
const K_DONE = "create_done";
const K_ASKED = "create_asked";

export function getDone(): Sec[] {
  try { return (sessionStorage.getItem(K_DONE) || "").split(",").filter(Boolean) as Sec[]; } catch { return []; }
}
export function addDone(s: Sec) {
  try { const d = getDone(); if (!d.includes(s)) d.push(s); sessionStorage.setItem(K_DONE, d.join(",")); } catch {}
}
export function wasAsked(): boolean {
  try { return sessionStorage.getItem(K_ASKED) === "1"; } catch { return false; }
}
export function setAsked() { try { sessionStorage.setItem(K_ASKED, "1"); } catch {} }
export function clearFlow() { try { sessionStorage.removeItem(K_DONE); sessionStorage.removeItem(K_ASKED); } catch {} }

export const SECTIONS: { key: Sec; icon: string; ar: string; en: string; descAr: string; descEn: string; color: string }[] = [
  { key: "business", icon: "💼", ar: "الأعمال", en: "Business", descAr: "بطاقة أعمال بمعرض وكاتلوج وعروض وروابط", descEn: "Business card with gallery, catalog and links", color: "#c9a84c" },
  { key: "events", icon: "🎪", ar: "الفعاليات", en: "Events", descAr: "فعالية بعروض وسحوبات وتقويم وراعٍ", descEn: "Event with offers, draws and sponsors", color: "#7c8cff" },
  { key: "emergency", icon: "🛡️", ar: "الطوارئ والحماية", en: "Emergency & Protection", descAr: "بيانات الإسعاف وأرقام الأهل لمن تحب", descEn: "Medical info and family contacts", color: "#e53e3e" },
];
