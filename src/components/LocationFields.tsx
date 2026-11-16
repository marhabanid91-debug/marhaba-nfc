import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";

// موقع واحد: اسم يختاره المستخدم + (رابط خريطة أو عنوان وطني/رمز بريدي)
import type { LocationItem } from "../types";
export type { LocationItem };

export const MAX_LOCATIONS = 3;

const isUrl = (v: string) => /^https?:\/\//i.test(v) || /^(www\.|maps\.app\.goo\.gl|goo\.gl\/maps|google\.[a-z.]+\/maps)/i.test(v);

export function locationHref(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (isUrl(v)) return /^https?:\/\//i.test(v) ? v : `https://${v}`;
  return `https://www.google.com/maps/search/${encodeURIComponent(v)}`;
}

export function cleanLocations(list: LocationItem[] = []): LocationItem[] {
  return list
    .map((l) => ({ name: (l.name || "").trim(), value: (l.value || "").trim(), visible: l.visible !== false }))
    .filter((l) => l.value)
    .slice(0, MAX_LOCATIONS)
    .map((l) => (isUrl(l.value) ? l : { ...l, value: l.value.toUpperCase() }));
}

// ── حقول الإدخال ──
// يبدأ بموقع واحد، وزر ➕ يضيف موقعاً ثانياً ثم ثالثاً (حتى 3)
export function LocationFields({ value, onChange }: { value: LocationItem[]; onChange: (v: LocationItem[]) => void }) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const defaults = ar ? ["البيت", "العمل", "المدرسة"] : ["Home", "Work", "School"];
  const empty = (): LocationItem => ({ name: "", value: "", visible: true });
  const slots: LocationItem[] = Array.from({ length: MAX_LOCATIONS }, (_, i) => value[i] || empty());

  const filled = value.filter((v) => v && (v.value || "").trim()).length;
  const [count, setCount] = useState(Math.min(MAX_LOCATIONS, Math.max(1, filled)));
  // إذا وصلت بيانات محفوظة بعد فتح الشاشة نعرض كل المواقع المحفوظة
  useEffect(() => {
    setCount((c) => Math.min(MAX_LOCATIONS, Math.max(c, filled)));
  }, [filled]);

  const update = (i: number, patch: Partial<LocationItem>) => {
    onChange(slots.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  const remove = (i: number) => {
    const next = slots.filter((_, idx) => idx !== i);
    next.push(empty());
    onChange(next);
    setCount((c) => Math.max(1, c - 1));
  };

  const addLabel = count === 1
    ? (ar ? "إضافة موقع ثانٍ" : "Add a second location")
    : (ar ? "إضافة موقع ثالث" : "Add a third location");

  return (
    <div>
      <label style={{ fontSize: 13, color: "var(--muted-foreground)", display: "block", marginBottom: 4 }}>
        📍 {ar ? "الموقع" : "Location"}{" "}
        <span style={{ fontSize: 11, opacity: 0.6 }}>— {ar ? "اختياري، ويمكن إضافة حتى 3 مواقع" : "optional, up to 3 locations"}</span>
      </label>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
        {slots.slice(0, count).map((s, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                style={{ flex: 1 }}
                value={s.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder={`${ar ? "اسم الموقع" : "Location name"} (${defaults[i]})`}
                maxLength={30}
              />
              <button
                type="button"
                onClick={() => update(i, { visible: !s.visible })}
                aria-pressed={s.visible}
                title={s.visible ? (ar ? "ظاهر في القارئ" : "Visible") : (ar ? "مخفي" : "Hidden")}
                style={{
                  flexShrink: 0, width: 46, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
                  position: "relative", background: s.visible ? "#16a34a" : "#9ca3af", transition: "background .2s",
                }}
              >
                <span style={{
                  position: "absolute", top: 3, left: s.visible ? 23 : 3, width: 20, height: 20,
                  borderRadius: "50%", background: "#fff", transition: "left .2s",
                }} />
              </button>
              {count > 1 && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={ar ? "حذف الموقع" : "Remove location"}
                  style={{ flexShrink: 0, background: "transparent", border: "none", color: "var(--emergency)", fontSize: 18, cursor: "pointer", padding: 4 }}
                >
                  ✕
                </button>
              )}
            </div>
            <input
              value={s.value}
              onChange={(e) => update(i, { value: e.target.value })}
              placeholder={ar ? "رابط الموقع أو العنوان الوطني (مثل RRRD2929)" : "Map link or national address (e.g. RRRD2929)"}
              style={{ direction: "ltr" }}
            />
          </div>
        ))}
        {count < MAX_LOCATIONS && (
          <button
            type="button"
            onClick={() => setCount((c) => Math.min(MAX_LOCATIONS, c + 1))}
            style={{
              background: "transparent", border: "1.5px dashed rgba(201,168,76,0.6)", borderRadius: 12,
              color: "var(--primary)", padding: "10px 12px", fontSize: 14, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            ➕ {addLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// ── العرض في شاشة القارئ ──
export function LocationCard({ locations }: { locations?: LocationItem[] }) {
  const { lang } = useApp();
  const list = (locations || []).filter((l) => l.value && l.visible !== false);
  if (list.length === 0) return null;
  const ar = lang === "ar";
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 6 }}>📍 {ar ? "المواقع" : "Locations"}</div>
      {list.map((l, i) => (
        <a
          key={i}
          href={locationHref(l.value)}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none", color: "var(--foreground)", display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}
        >
          <span style={{ fontSize: 16 }}>🗺️</span>
          <span style={{ fontSize: 14, flex: 1 }}>{l.name || (ar ? "الموقع" : "Location")}</span>
          <span style={{ fontSize: 12, opacity: 0.6 }}>{ar ? "فتح في الخريطة" : "Open in maps"}</span>
        </a>
      ))}
    </div>
  );
}
