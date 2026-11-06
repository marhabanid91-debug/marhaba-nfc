import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { loadMyVault, saveMyVault, MyVault, VaultEditItem, VaultScope } from "../lib/vault";

const MAX_ITEMS = 10;

const ERRORS: Record<string, string> = {
  bad_title: "أدخل عنواناً لكل رابط (حتى 60 حرفاً)",
  bad_url: "الرابط يجب أن يبدأ بـ https://",
  bad_code: "الرمز السري من 6 إلى 32 حرفاً أو رقماً",
  missing_code: "كل رابط جديد يحتاج رمزاً سرياً",
  too_many: "الحد الأقصى 10 روابط",
  forbidden: "غير مسموح",
  auth: "سجّل الدخول أولاً",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "لم تُفتح بعد";
  try {
    return new Date(iso).toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

/** محرر «الخزنة الرقمية» للمالك: روابط خاصة لا تظهر للقارئ إلا برمز سري */
export default function VaultEditor({ identityId, scope, accent }: { identityId: string; scope: VaultScope; accent: string }) {
  const { supabaseUser, lang } = useApp();
  const ar = lang === "ar";
  const [items, setItems] = useState<VaultEditItem[]>([]);
  const [info, setInfo] = useState<MyVault | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  const load = () =>
    loadMyVault(identityId, scope).then((v) => {
      setInfo(v);
      setItems((v?.items || []).map((it) => ({ id: it.id, title: it.title, url: it.url, code: "" })));
      setLoaded(true);
    });

  useEffect(() => {
    if (supabaseUser) load();
  }, [identityId, scope, supabaseUser?.id]);

  // قبل تشغيل SQL أو بدون حساب: لا يظهر شيء
  if (!supabaseUser || !loaded || !info) return null;

  const setItem = (i: number, patch: Partial<VaultEditItem>) =>
    setItems((prev) => prev.map((it, k) => (k === i ? { ...it, ...patch } : it)));

  async function save() {
    setMsg(null);
    for (const it of items) {
      if (!it.title.trim()) return setMsg({ ok: false, text: ERRORS.bad_title });
      if (!/^https:\/\/\S+$/i.test(it.url.trim())) return setMsg({ ok: false, text: ERRORS.bad_url });
      if (!it.id && !it.code) return setMsg({ ok: false, text: ERRORS.missing_code });
      if (it.code && (it.code.length < 6 || it.code.length > 32)) return setMsg({ ok: false, text: ERRORS.bad_code });
    }
    setBusy(true);
    const r = await saveMyVault(identityId, scope, items);
    setBusy(false);
    if (r === "ok") {
      setMsg({ ok: true, text: "تم حفظ الخزنة ✅" });
      load();
    } else {
      setMsg({ ok: false, text: ERRORS[r] || "تعذّر الحفظ" });
    }
  }

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{
      border: `1px solid ${accent}40`, background: `${accent}0d`, borderRadius: 14, padding: 14,
    }}>
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>🔐 {ar ? "الخزنة الرقمية" : "Digital vault"}</div>
      <p style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.7, margin: "0 0 10px" }}>
        {ar
          ? "أضف روابط لمستنداتك الخاصة (سجل طبي، أكاديمي، وظيفي…). لا تظهر لمن يمسح البطاقة إلا بعد إدخال الرمز السري الذي تعطيه له. يمكنك وضع رمز مختلف لكل رابط."
          : "Add links to your private documents. Whoever scans the card sees them only after entering the secret code you give them. Each link can have its own code."}
      </p>
      <div style={{
        fontSize: 11.5, lineHeight: 1.7, padding: "8px 10px", borderRadius: 10, marginBottom: 12,
        background: "rgba(229,62,62,0.08)", border: "1px solid rgba(229,62,62,0.25)",
      }}>
        ⚠️ {ar
          ? "الرمز يحمي صفحتك فقط، لا الملف نفسه. اجعل الملف في Drive خاصاً أو مشاركاً بشكل محدود، وإلا فمن يملك رابطه المباشر يفتحه دون رمز. لا نخزّن ملفاتك، روابطها فقط."
          : "The code protects your page, not the file itself. Keep the file private in your drive; anyone with its direct link can open it without a code. We store links only, never your files."}
      </div>

      {items.map((it, i) => (
        <div key={it.id || `n${i}`} style={{ border: "1px dashed var(--border-strong)", borderRadius: 10, padding: 10, marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{ar ? `رابط ${i + 1}` : `Link ${i + 1}`}</span>
            <button
              type="button"
              onClick={() => setItems((prev) => prev.filter((_, k) => k !== i))}
              aria-label={ar ? "حذف" : "Remove"}
              style={{ background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer", fontSize: 16 }}
            >✕</button>
          </div>
          <input
            value={it.title}
            maxLength={60}
            onChange={(e) => setItem(i, { title: e.target.value })}
            placeholder={ar ? "العنوان (مثال: السجل الطبي)" : "Title (e.g. Medical record)"}
            style={{ marginBottom: 6 }}
          />
          <input
            value={it.url}
            type="url"
            inputMode="url"
            onChange={(e) => setItem(i, { url: e.target.value })}
            placeholder="https://drive.google.com/…"
            style={{ direction: "ltr", marginBottom: 6 }}
          />
          <input
            value={it.code}
            type={show ? "text" : "password"}
            maxLength={32}
            autoComplete="new-password"
            onChange={(e) => setItem(i, { code: e.target.value })}
            placeholder={it.id
              ? (ar ? "اتركه فارغاً للإبقاء على الرمز الحالي" : "Leave empty to keep current code")
              : (ar ? "رمز سري (6 أحرف أو أرقام على الأقل)" : "Secret code (min 6 characters)")}
            style={{ direction: "ltr" }}
          />
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={items.length >= MAX_ITEMS}
          onClick={() => setItems((p) => [...p, { title: "", url: "", code: "" }])}
          style={{
            padding: "8px 14px", borderRadius: 10, fontFamily: "inherit", fontSize: 13, cursor: "pointer",
            background: "transparent", border: `1px dashed ${accent}`, color: accent, fontWeight: 600,
            opacity: items.length >= MAX_ITEMS ? 0.5 : 1,
          }}
        >
          ➕ {ar ? "إضافة رابط" : "Add link"} ({items.length}/{MAX_ITEMS})
        </button>
        <label style={{ fontSize: 12, color: "var(--muted-foreground)", display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} style={{ width: "auto" }} />
          {ar ? "إظهار الرموز" : "Show codes"}
        </label>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={busy}
        style={{
          marginTop: 12, padding: "10px 18px", borderRadius: 10, border: "none", cursor: "pointer",
          background: accent, color: "#fff", fontWeight: 700, fontFamily: "inherit", opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? (ar ? "جارٍ الحفظ…" : "Saving…") : (ar ? "حفظ الخزنة" : "Save vault")}
      </button>
      {msg && <p style={{ fontSize: 13, margin: "8px 0 0", color: msg.ok ? "#22c55e" : "var(--emergency)" }}>{msg.text}</p>}

      {items.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.8 }}>
          🔓 {ar ? "مرات الفتح الناجحة" : "Successful opens"}: <b>{info.opens}</b>
          {" · "}{ar ? "آخر فتح" : "Last open"}: {fmtDate(info.last_open)}
          {info.fails_total > 0 && <> {" · "}⚠️ {ar ? "محاولات خاطئة" : "Wrong attempts"}: <b>{info.fails_total}</b></>}
        </div>
      )}
    </div>
  );
}
