import { useEffect, useState, type ReactNode } from "react";
import { useApp } from "../context/AppContext";
import { checkSerialAvailability, activateCard, unlinkSerial } from "../lib/db";
import { supabase } from "../lib/supabase";
import MyGifts from "./MyGifts";

const SERIAL_PREFIX = "MARHABA-";

type Section = "link" | "gifts" | null;

// بطاقة قابلة للفتح: عنوان + ملخص بسطر واحد، ويظهر المحتوى عند الفتح
function Accordion({
  icon, title, summary, open, onToggle, children,
}: { icon: string; title: string; summary: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: 14, padding: 0, overflow: "hidden" }}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12, padding: 16,
          background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit",
          color: "var(--foreground)", textAlign: "start",
        }}
      >
        <span style={{ fontSize: 26 }}>{icon}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontWeight: 700, fontSize: 16 }}>{title}</span>
          <span style={{ display: "block", fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>{summary}</span>
        </span>
        <span style={{ transition: "transform .2s", transform: open ? "rotate(180deg)" : "none", color: "var(--muted-foreground)" }}>▾</span>
      </button>
      {/* يبقى المحتوى محمّلاً حتى وهو مغلق ليظهر الملخص صحيحاً */}
      <div style={{ display: open ? "block" : "none", padding: "0 16px 16px" }}>{children}</div>
    </div>
  );
}

export default function AccessoryScreen() {
  const { t, lang, identities, setIdentities, activeIdentityId, setScreen, supabaseUser, isAdmin } = useApp();
  const ar = lang === "ar";
  const [serial, setSerial] = useState(SERIAL_PREFIX);
  const [actCode, setActCode] = useState("");
  const [linked, setLinked] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [canGifts, setCanGifts] = useState(false);
  const [giftCount, setGiftCount] = useState<number | null>(null);
  // تُفتح بطاقة الربط تلقائياً إذا لم يكن هناك إكسسوار مرتبط
  const [open, setOpen] = useState<Section>(() => {
    const i = identities.find((x) => x.id === activeIdentityId) || identities[0];
    return i?.serialNumber ? null : "link";
  });
  const toggle = (s: Exclude<Section, null>) => setOpen((cur) => (cur === s ? null : s));

  // هل يحق لهذا الحساب استخدام الهدايا؟ (مدير أو مشترك ساري، تحدده قاعدة البيانات)
  useEffect(() => {
    let alive = true;
    supabase.rpc("can_use_gifts").then(({ data }) => { if (alive) setCanGifts(data === true); });
    return () => { alive = false; };
  }, [supabaseUser?.id]);

  const identity = identities.find((i) => i.id === activeIdentityId) || identities[0];
  const identityName = identity?.emergency.name || identity?.business.name || (ar ? "هوية جديدة" : "New Identity");

  const handleLink = async () => {
    setError("");
    const normalized = serial.trim().toUpperCase();
    if (normalized === SERIAL_PREFIX || !normalized) return;

    setChecking(true);
    try {
      if (!supabaseUser || !identity?.id) {
        setError(ar ? "يجب تسجيل الدخول أولاً لربط البطاقة." : "You must be signed in to link a card.");
        return;
      }
      const check = await checkSerialAvailability(normalized);
      if (!check.valid) {
        setError(ar ? "الرقم غير موجود في النظام." : "This code does not exist in the system.");
        return;
      }
      if (!check.available) {
        setError(ar ? "هذا الرقم مستخدم مسبقاً لحساب آخر." : "This code is already linked to another account.");
        return;
      }
      const ok = await activateCard(normalized, actCode, identity.id);
      if (!ok) {
        setError(ar ? "رمز التفعيل غير صحيح أو تجاوزتَ عدد المحاولات." : "Invalid activation code or too many attempts.");
        return;
      }
      {
        setIdentities(identities.map((id) =>
          id.id === identity?.id ? { ...id, serialNumber: normalized } : id
        ));
        setLinked(true);
      }
    } catch {
      setError(t("serialInvalid"));
    } finally {
      setChecking(false);
    }
  };

  const handleUnlink = async () => {
    const currentSerial = identity?.serialNumber;
    setIdentities(identities.map((id) =>
      id.id === identity?.id ? { ...id, serialNumber: null } : id
    ));
    setLinked(false);
    setSerial(SERIAL_PREFIX);
    setError("");
    if (currentSerial && identity?.id && supabaseUser) {
      await unlinkSerial(currentSerial, identity.id).catch(() => {});
    }
  };

  const hasGifts = isAdmin || canGifts;

  const linkSummary = identity?.serialNumber
    ? (ar ? `مرتبط: ${identity.serialNumber} ✓` : `Linked: ${identity.serialNumber} ✓`)
    : (ar ? "غير مرتبط — أدخل رقم الإكسسوار" : "Not linked — enter your accessory code");

  const giftsSummary = !hasGifts
    ? (ar ? "خاصية مدفوعة" : "Paid feature")
    : giftCount === null
      ? ""
      : giftCount === 0
        ? (ar ? "لا توجد هدايا بعد" : "No gifts yet")
        : (ar ? `${giftCount} ${giftCount === 1 ? "هدية" : "هدايا"}` : `${giftCount} gift${giftCount === 1 ? "" : "s"}`);

  return (
    <div className="screen fade-in">
      <div style={{ padding: "24px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(201,168,76,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>📟</div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{t("accessory")}</h1>
            <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: 0 }}>{identityName}</p>
          </div>
        </div>

        {/* ربط الإكسسوار */}
        <Accordion
          icon="🔗"
          title={ar ? "ربط الإكسسوار" : "Link accessory"}
          summary={linkSummary}
          open={open === "link"}
          onToggle={() => toggle("link")}
        >
          {!linked ? (
            <>
              <p style={{ color: "var(--muted-foreground)", fontSize: 13, lineHeight: 1.6, margin: "0 0 14px" }}>
                {t("enterSerial")}
              </p>

              {identity?.serialNumber && (
                <div style={{
                  background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "var(--primary)",
                  marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span>{ar ? `مرتبط حالياً: ${identity.serialNumber}` : `Currently linked: ${identity.serialNumber}`}</span>
                  <button onClick={handleUnlink} style={{
                    background: "rgba(229,62,62,0.1)", border: "1px solid rgba(229,62,62,0.2)",
                    borderRadius: 6, color: "var(--emergency)", cursor: "pointer",
                    fontSize: 11, padding: "3px 8px", fontFamily: "inherit",
                  }}>
                    {t("unlinkAccessory")}
                  </button>
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, color: "var(--muted-foreground)", display: "block", marginBottom: 6 }}>
                  {t("serialNumber")}
                </label>
                <input
                  value={serial}
                  onChange={(e) => {
                    // البادئة MARHABA- ثابتة، والمستخدم يكتب الرقم فقط
                    let v = e.target.value.toUpperCase();
                    if (!v.startsWith(SERIAL_PREFIX)) v = SERIAL_PREFIX + v.replace(/^M?A?R?H?A?B?A?-?/, "");
                    setSerial(v); setError("");
                  }}
                  placeholder="MARHABA-001"
                  data-dir="ltr"
                  style={{ letterSpacing: 2, textTransform: "uppercase", fontFamily: "monospace, sans-serif" }}
                  onKeyDown={(e) => e.key === "Enter" && handleLink()}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <input
                  value={actCode}
                  onChange={(e) => setActCode(e.target.value.toUpperCase())}
                  placeholder={ar ? "رمز التفعيل المرفق XXXX-XXXX-XXXX" : "Activation code XXXX-XXXX-XXXX"}
                  data-dir="ltr"
                  style={{ letterSpacing: 2, textTransform: "uppercase", fontFamily: "monospace, sans-serif" }}
                  onKeyDown={(e) => e.key === "Enter" && handleLink()}
                />
              </div>

              {error && (
                <div style={{
                  background: "rgba(229,62,62,0.1)", border: "1px solid rgba(229,62,62,0.25)",
                  borderRadius: 10, padding: "10px 14px", color: "var(--emergency)",
                  fontSize: 13, marginBottom: 14, display: "flex", alignItems: "center", gap: 8,
                }}>
                  ⚠ {error}
                </div>
              )}

              <button className="btn-primary" onClick={handleLink} style={{ opacity: checking ? 0.7 : 1 }}>
                {checking ? t("serialChecking") : t("linkBtn")}
              </button>
            </>
          ) : (
            <div className="fade-in" style={{ textAlign: "center", padding: "16px 0 0" }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
              <h3 style={{ color: "#22c55e", marginBottom: 8, fontSize: 18 }}>{t("linked")}</h3>
              <p style={{ color: "var(--muted-foreground)", fontSize: 14, marginBottom: 20 }}>
                {serial.toUpperCase()} {t("identityLinkedTo")} {identityName}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button className="btn-primary" onClick={() => setScreen("home")}>{t("backToHome")}</button>
                <button className="btn-ghost" onClick={() => { setLinked(false); setSerial(SERIAL_PREFIX); setActCode(""); }}>
                  {ar ? "ربط إكسسوار آخر" : "Link another accessory"}
                </button>
              </div>
            </div>
          )}
        </Accordion>

        {/* أعمال وهدايا: للمدير والمشتركين فقط، وغيرهم لا يرون شيئاً (معروضة في قائمة ☰) */}
        {hasGifts && (
          <Accordion
            icon="🎁"
            title={ar ? "أعمال وهدايا" : "Works & gifts"}
            summary={giftsSummary}
            open={open === "gifts"}
            onToggle={() => toggle("gifts")}
          >
            <MyGifts hideTitle onCount={setGiftCount} />
          </Accordion>
        )}
      </div>
    </div>
  );
}
