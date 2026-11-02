import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { loadStats, MyStats, StatKind } from "../lib/stats";

const LABELS: Record<string, { ar: string; en: string }> = {
  contact: { ar: "💬 تواصل معي", en: "💬 Contact me" },
  save: { ar: "👤 حفظ جهة الاتصال", en: "👤 Save contact" },
  call: { ar: "📞 اتصال", en: "📞 Call" },
  email: { ar: "✉️ بريد", en: "✉️ Email" },
  ticket: { ar: "🎟️ التذكرة", en: "🎟️ Ticket" },
  location: { ar: "📍 الموقع", en: "📍 Location" },
  review: { ar: "⭐ تقييم قوقل", en: "⭐ Google review" },
  link: { ar: "🔗 روابط أخرى", en: "🔗 Other links" },
  follow: { ar: "💛 تابع المُهدي", en: "💛 Follow" },
  catalog: { ar: "📖 الكتالوج", en: "📖 Catalog" },
  "social:instagram": { ar: "📸 Instagram", en: "📸 Instagram" },
  "social:tiktok": { ar: "🎵 TikTok", en: "🎵 TikTok" },
  "social:snapchat": { ar: "👻 Snapchat", en: "👻 Snapchat" },
  "social:linkedin": { ar: "💼 LinkedIn", en: "💼 LinkedIn" },
  "social:x": { ar: "🐦 X", en: "🐦 X" },
  "social:facebook": { ar: "👥 Facebook", en: "👥 Facebook" },
  "social:youtube": { ar: "▶️ YouTube", en: "▶️ YouTube" },
  "social:whatsapp": { ar: "💬 WhatsApp", en: "💬 WhatsApp" },
};

function fmtDate(iso: string | null, ar: boolean): string {
  if (!iso) return ar ? "لا يوجد بعد" : "None yet";
  try {
    return new Date(iso).toLocaleString(ar ? "ar-SA" : "en-US", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

/** صندوق الإحصائيات للمالك: الفتح، الأجهزة، آخر فتح، آخر ٧ أيام، الضغطات */
export default function StatsBox({
  kind, target, labels,
}: { kind: StatKind; target: string; labels?: Record<string, string> }) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [s, setS] = useState<MyStats | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoaded(false);
    loadStats(kind, target).then((r) => {
      if (alive) {
        setS(r);
        setLoaded(true);
      }
    });
    return () => { alive = false; };
  }, [kind, target]);

  if (!loaded || !s) return null; // قبل تشغيل SQL أو لغير المالك: لا يظهر شيء

  const max = Math.max(1, ...s.days.map((d) => d.n));
  const clicks = Object.entries(s.clicks || {})
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  const nameOf = (k: string) =>
    labels?.[k] || LABELS[k]?.[ar ? "ar" : "en"] || k.replace(/^social:/, "");

  return (
    <div
      dir={ar ? "rtl" : "ltr"}
      style={{
        background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14,
        padding: 14, margin: "0 0 14px",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
        📊 {ar ? "الإحصائيات" : "Statistics"}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1, textAlign: "center", background: "var(--card-elevated, rgba(255,255,255,0.04))", borderRadius: 10, padding: "8px 4px" }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{s.opens}</div>
          <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{ar ? "مرة فتح" : "opens"}</div>
        </div>
        <div style={{ flex: 1, textAlign: "center", background: "var(--card-elevated, rgba(255,255,255,0.04))", borderRadius: 10, padding: "8px 4px" }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{s.devices}</div>
          <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{ar ? "جهاز مختلف" : "devices"}</div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 8 }}>
        {ar ? "آخر فتح: " : "Last open: "}{fmtDate(s.last_open, ar)}
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 54, marginBottom: 4 }} aria-label={ar ? "آخر ٧ أيام" : "Last 7 days"}>
        {s.days.map((d) => (
          <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
            {d.n > 0 && <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{d.n}</span>}
            <div
              style={{
                width: "100%", borderRadius: 4, background: "var(--primary)",
                height: d.n > 0 ? `${Math.max(8, (d.n / max) * 40)}px` : 3,
                opacity: d.n > 0 ? 1 : 0.25,
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, color: "var(--muted-foreground)", textAlign: "center", marginBottom: clicks.length ? 12 : 0 }}>
        {ar ? "آخر ٧ أيام" : "Last 7 days"}
      </div>

      {clicks.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{ar ? "الضغطات" : "Clicks"}</div>
          {clicks.map(([k, n]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
              <span>{nameOf(k)}</span>
              <span style={{ fontWeight: 700 }}>{n}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
