import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { unlockVault, vaultExists, VaultScope } from "../lib/vault";

/** صندوق «الخزنة الرقمية» في صفحة القارئ: مغلق حتى إدخال الرمز، ولا يعرض أي عنوان قبله */
export default function VaultReader({ identityId, scope, color }: { identityId?: string; scope: VaultScope; color: string }) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [exists, setExists] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [lockedUntil, setLockedUntil] = useState(0);
  const [items, setItems] = useState<{ title: string; url: string }[] | null>(null);

  useEffect(() => {
    let alive = true;
    if (identityId) vaultExists(identityId, scope).then((v) => alive && setExists(v));
    return () => { alive = false; };
  }, [identityId, scope]);

  if (!identityId || !exists) return null;

  async function open() {
    if (!code.trim() || busy) return;
    setErr("");
    setBusy(true);
    const r = await unlockVault(identityId!, scope, code.trim());
    setBusy(false);
    if (r.status === "ok") {
      setItems(r.items);
      setCode("");
    } else if (r.status === "wrong") {
      setErr(ar ? `الرمز غير صحيح. المحاولات المتبقية: ${r.left}` : `Wrong code. Attempts left: ${r.left}`);
    } else if (r.status === "locked") {
      setLockedUntil(Date.now() + r.retry * 1000);
      const m = Math.max(1, Math.ceil(r.retry / 60));
      setErr(ar ? `تم إيقاف المحاولات مؤقتاً. حاول بعد ${m} دقيقة.` : `Too many attempts. Try again in ${m} min.`);
    } else {
      setErr(ar ? "تعذّر الفتح الآن، حاول لاحقاً." : "Could not open right now.");
    }
  }

  const locked = lockedUntil > Date.now();

  return (
    // data-nostat: لا تُحتسب ضغطات روابط الخزنة في إحصائيات الأعمال
    <div data-nostat="1" dir={ar ? "rtl" : "ltr"} className="card" style={{ marginTop: 12, border: `1px solid ${color}40` }}>
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>🔐 {ar ? "الخزنة الرقمية" : "Digital vault"}</div>

      {items === null ? (
        <>
          <p style={{ fontSize: 12.5, color: "var(--muted-foreground)", lineHeight: 1.7, margin: "0 0 10px" }}>
            {ar ? "معلومات خاصة لا تُعرض إلا برمز سري يعطيك إياه صاحب البطاقة." : "Private information shown only with a secret code from the card owner."}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={code}
              type="password"
              autoComplete="off"
              maxLength={64}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && open()}
              placeholder={ar ? "الرمز السري" : "Secret code"}
              style={{ direction: "ltr", flex: 1 }}
            />
            <button
              type="button"
              onClick={open}
              disabled={busy || locked || !code.trim()}
              style={{
                padding: "0 18px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit",
                background: color, color: "#fff", fontWeight: 700,
                opacity: busy || locked || !code.trim() ? 0.5 : 1,
              }}
            >
              {busy ? "…" : (ar ? "فتح" : "Open")}
            </button>
          </div>
          {err && <p style={{ fontSize: 12.5, margin: "8px 0 0", color: "var(--emergency)" }}>{err}</p>}
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          {items.map((it, i) => (
            <a
              key={i}
              href={it.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
                padding: "12px 14px", borderRadius: 12, textDecoration: "none", fontWeight: 700, fontSize: 14,
                background: `${color}12`, border: `1px solid ${color}30`, color,
              }}
            >
              <span>📄 {it.title}</span>
              <span style={{ fontSize: 12 }}>{ar ? "فتح ↗" : "Open ↗"}</span>
            </a>
          ))}
          <p style={{ fontSize: 11, color: "var(--muted-foreground)", margin: "4px 0 0" }}>
            {ar ? "أغلق الصفحة بعد الانتهاء حفاظاً على الخصوصية." : "Close the page when you are done."}
          </p>
        </div>
      )}
    </div>
  );
}
