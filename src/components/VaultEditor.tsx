import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { loadMyVault, saveMyVault, MyVault, VaultEditItem, VaultScope, VAULT_NAME, VAULT_HINT, docIcon } from "../lib/vault";
import { myCardToken } from "../lib/db";
import { shareLink } from "../lib/share";
import { ActiveMode } from "../types";

const MAX_ITEMS = 10;

type Item = VaultEditItem & { k: string };

const ERRORS: Record<string, string> = {
  bad_title: "أدخل عنواناً لكل رابط (حتى 60 حرفاً)",
  bad_url: "الرابط يجب أن يبدأ بـ https://",
  bad_code: "الرمز السري من 6 إلى 32 حرفاً أو رقماً",
  bad_expiry: "تاريخ الانتهاء غير صالح (الحد الأقصى 5 سنوات)",
  missing_code: "كل رابط جديد يحتاج رمزاً سرياً",
  too_many: "الحد الأقصى 10 روابط",
  forbidden: "غير مسموح",
  auth: "سجّل الدخول أولاً",
};

const todayRiyadh = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });
const toYmd = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" }) : "";

function fmtDate(iso: string | null): string {
  if (!iso) return "لم تُفتح بعد";
  try {
    return new Date(iso).toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

/** محرر «الخزنة الرقمية» للمالك: روابط خاصة لا تظهر للقارئ إلا برمز سري */
export default function VaultEditor({
  identityId, scope, accent, serial, activeMode,
}: { identityId: string; scope: VaultScope; accent: string; serial?: string | null; activeMode?: ActiveMode }) {
  const { supabaseUser, lang } = useApp();
  const ar = lang === "ar";
  const [items, setItems] = useState<Item[]>([]);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [info, setInfo] = useState<MyVault | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [shareMsg, setShareMsg] = useState("");

  const load = () =>
    loadMyVault(identityId, scope).then((v) => {
      setInfo(v);
      setItems((v?.items || []).map((it) => ({
        k: it.id, id: it.id, title: it.title, url: it.url, code: "",
        expires: toYmd(it.expires_at), oneTime: it.one_time, usedAt: it.used_at,
      })));
      setLoaded(true);
    });

  useEffect(() => {
    if (supabaseUser) load();
  }, [identityId, scope, supabaseUser?.id]);

  // قبل تشغيل SQL أو بدون حساب: لا يظهر شيء
  if (!supabaseUser || !loaded || !info) return null;

  const setItem = (i: number, patch: Partial<VaultEditItem>) =>
    setItems((prev) => prev.map((it, k) => (k === i ? { ...it, ...patch } : it)));

  async function sharePage() {
    if (!serial) return;
    setShareMsg("");
    const token = await myCardToken(serial);
    const url = token
      ? `https://marhabanid.com/?c=${encodeURIComponent(token)}`
      : `https://marhabanid.com/?serial=${encodeURIComponent(serial)}`;
    const r = await shareLink(url, ar ? "صفحتي في مرحبا" : "My Marhaba page");
    if (r === "copied") setShareMsg(ar ? "تم نسخ الرابط ✅" : "Link copied ✅");
    if (r === "failed") setShareMsg(ar ? "تعذّر المشاركة" : "Could not share");
    setTimeout(() => setShareMsg(""), 3000);
  }

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
      setMsg({ ok: true, text: "تم الحفظ ✅" });
      setOpenKey(null);
      load();
    } else {
      setMsg({ ok: false, text: ERRORS[r] || "تعذّر الحفظ" });
    }
  }

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{
      border: `1px solid ${accent}40`, background: `${accent}0d`, borderRadius: 14, padding: 14,
    }}>
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 2 }}>🔐 {ar ? VAULT_NAME.ar : VAULT_NAME.en}</div>
      <div style={{ fontSize: 11.5, color: accent, marginBottom: 6 }}>{ar ? VAULT_HINT.ar : VAULT_HINT.en}</div>
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

      {activeMode && activeMode !== scope && (
        <div style={{
          fontSize: 11.5, lineHeight: 1.7, padding: "8px 10px", borderRadius: 10, marginBottom: 10,
          background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.35)",
        }}>
          ℹ️ {ar
            ? `هويتك الآن في وضع «${activeMode === "emergency" ? "الأعمال أو الفعاليات" : activeMode === "business" ? "الطوارئ أو الفعاليات" : "الفعاليات"}»، فلن يظهر هذا القسم للقارئ إلا بعد ضبط الوضع النشط على «${scope === "emergency" ? "الطوارئ" : "الأعمال"}» (من الرئيسية ← تفاصيل الهوية).`
            : `This identity's active mode is different, so this section shows to readers only when the active mode is ${scope}.`}
        </div>
      )}

      {items.map((it, i) => {
        const isOpen = openKey === it.k;
        const expired = !!it.expires && it.expires < todayRiyadh();
        const used = !!it.id && !!it.usedAt && it.oneTime && !it.code;
        return (
        <div key={it.k} style={{
          border: `1px solid ${isOpen ? accent : "var(--border-strong)"}`, borderRadius: 12, marginBottom: 8,
          background: "var(--card)", overflow: "hidden",
        }}>
          <button
            type="button"
            onClick={() => setOpenKey(isOpen ? null : it.k)}
            aria-expanded={isOpen}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
              color: "var(--foreground)", textAlign: "start",
            }}
          >
            <span style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0, fontSize: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: `${accent}18`, border: `1px solid ${accent}40`,
            }}>{docIcon(it.title)}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {it.title.trim() || (ar ? "رابط جديد" : "New link")}
              </span>
              <span style={{ display: "block", fontSize: 11.5, marginTop: 2, color: "var(--muted-foreground)" }}>
                🔑 {it.id ? (ar ? "محمي برمز" : "Code set") : (ar ? "لم يُحفظ بعد" : "Not saved yet")}
                {it.oneTime && <> · {ar ? "مرة واحدة" : "one-time"}</>}
                {it.expires && <> · {ar ? "ينتهي" : "expires"} {it.expires}</>}
                {expired && <span style={{ color: "var(--emergency)" }}> · {ar ? "منتهي" : "expired"}</span>}
                {used && <span style={{ color: "var(--emergency)" }}> · {ar ? "استُخدم" : "used"}</span>}
              </span>
            </span>
            <span style={{ color: "var(--muted-foreground)", fontSize: 12, flexShrink: 0 }}>{isOpen ? "▲" : "▼"}</span>
          </button>

          {isOpen && (
          <div style={{ padding: "0 12px 12px" }}>
            <input
              value={it.title}
              maxLength={60}
              onChange={(e) => setItem(i, { title: e.target.value })}
              placeholder={ar ? "العنوان (مثال: السجل الطبي، السيرة الذاتية)" : "Title (e.g. Medical record, CV)"}
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
              style={{ direction: "ltr", marginBottom: 8 }}
            />
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ fontSize: 12, color: "var(--muted-foreground)", display: "flex", gap: 6, alignItems: "center" }}>
                <input type="checkbox" checked={it.oneTime} onChange={(e) => setItem(i, { oneTime: e.target.checked })} style={{ width: "auto" }} />
                {ar ? "رمز لمرة واحدة" : "One-time code"}
              </label>
              <label style={{ fontSize: 12, color: "var(--muted-foreground)", display: "flex", gap: 6, alignItems: "center" }}>
                {ar ? "ينتهي في" : "Expires"}
                <input
                  type="date"
                  value={it.expires}
                  min={todayRiyadh()}
                  onChange={(e) => setItem(i, { expires: e.target.value })}
                  style={{ width: "auto", direction: "ltr" }}
                />
                {it.expires && (
                  <button type="button" onClick={() => setItem(i, { expires: "" })} style={{
                    background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer", fontSize: 13,
                  }}>✕</button>
                )}
              </label>
            </div>
            {used && (
              <div style={{ fontSize: 11.5, color: "var(--emergency)", marginTop: 6 }}>
                {ar ? "استُخدم هذا الرمز. اكتب رمزاً جديداً ليعمل من جديد." : "This code was used. Enter a new code to reactivate."}
              </div>
            )}
            {expired && (
              <div style={{ fontSize: 11.5, color: "var(--emergency)", marginTop: 6 }}>
                {ar ? "انتهت صلاحية هذا الرابط. غيّر التاريخ ليعمل من جديد." : "This link has expired. Change the date to reactivate."}
              </div>
            )}
            <button
              type="button"
              onClick={() => { setItems((prev) => prev.filter((_, k) => k !== i)); setOpenKey(null); }}
              style={{
                marginTop: 10, padding: "6px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 12, cursor: "pointer",
                background: "rgba(229,62,62,0.1)", border: "1px solid rgba(229,62,62,0.25)", color: "var(--emergency)",
              }}
            >
              🗑 {ar ? "حذف هذا الرابط (يُطبَّق بعد الحفظ)" : "Remove (applies after saving)"}
            </button>
          </div>
          )}
        </div>
        );
      })}

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={items.length >= MAX_ITEMS}
          onClick={() => {
            const k = `n${Date.now()}`;
            setItems((p) => [...p, { k, title: "", url: "", code: "", expires: "", oneTime: false }]);
            setOpenKey(k);
          }}
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
        {busy ? (ar ? "جارٍ الحفظ…" : "Saving…") : (ar ? "حفظ" : "Save")}
      </button>
      {msg && <p style={{ fontSize: 13, margin: "8px 0 0", color: msg.ok ? "#22c55e" : "var(--emergency)" }}>{msg.text}</p>}

      {serial && items.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            onClick={sharePage}
            style={{
              width: "100%", padding: "10px 0", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
              fontWeight: 700, fontSize: 13, background: "transparent", color: accent, border: `1px solid ${accent}`,
            }}
          >
            ↗ {ar ? "مشاركة رابط صفحتي" : "Share my page link"}
          </button>
          <p style={{ fontSize: 11.5, color: "var(--muted-foreground)", lineHeight: 1.7, margin: "6px 0 0" }}>
            {ar
              ? "أرسل الرمز السري في رسالة منفصلة، ولا تضعه مع الرابط."
              : "Send the secret code in a separate message, not with the link."}
          </p>
          {shareMsg && <p style={{ fontSize: 12.5, color: "#22c55e", margin: "4px 0 0" }}>{shareMsg}</p>}
        </div>
      )}

      {items.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.8 }}>
          🔓 {ar ? "مرات الفتح الناجحة" : "Successful opens"}: <b>{info.opens}</b>
          {" · "}{ar ? "آخر فتح" : "Last open"}: {fmtDate(info.last_open)}
          {info.fails_total > 0 && <> {" · "}⚠️ {ar ? "محاولات خاطئة" : "Wrong attempts"}: <b>{info.fails_total}</b></>}
        </div>
      )}

      {info.log && info.log.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted-foreground)" }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{ar ? "آخر عمليات الفتح" : "Recent opens"}</div>
          {info.log.map((l, i) => (
            <div key={i} style={{ padding: "3px 0", lineHeight: 1.6 }}>
              • {fmtDate(l.at)}{l.titles?.length ? ` — ${l.titles.join("، ")}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
