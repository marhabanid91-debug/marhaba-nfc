import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { checkSerialAvailability, activateCard, unlinkSerial } from "../lib/db";
import { supabase } from "../lib/supabase";
import MyGifts from "./MyGifts";

const WA_NUMBER = "966500816798";
const SERIAL_PREFIX = "MARHABA-";

export default function AccessoryScreen() {
  const { t, lang, identities, setIdentities, activeIdentityId, setScreen, supabaseUser, isAdmin } = useApp();
  const [serial, setSerial] = useState(SERIAL_PREFIX);
  const [actCode, setActCode] = useState("");
  const [linked, setLinked] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [canGifts, setCanGifts] = useState(false);

  // هل يحق لهذا الحساب استخدام الهدايا؟ (مدير أو مشترك ساري، تحدده قاعدة البيانات)
  useEffect(() => {
    let alive = true;
    supabase.rpc("can_use_gifts").then(({ data }) => { if (alive) setCanGifts(data === true); });
    return () => { alive = false; };
  }, [supabaseUser?.id]);

  const identity = identities.find((i) => i.id === activeIdentityId) || identities[0];
  const identityName = identity?.emergency.name || identity?.business.name || (lang === "ar" ? "هوية جديدة" : "New Identity");

  const handleLink = async () => {
    setError("");
    const normalized = serial.trim().toUpperCase();
    if (normalized === SERIAL_PREFIX || !normalized) return;

    setChecking(true);
    try {
      if (!supabaseUser || !identity?.id) {
        setError(lang === "ar" ? "يجب تسجيل الدخول أولاً لربط البطاقة." : "You must be signed in to link a card.");
        return;
      }
      const check = await checkSerialAvailability(normalized);
      if (!check.valid) {
        setError(lang === "ar" ? "الرقم غير موجود في النظام." : "This code does not exist in the system.");
        return;
      }
      if (!check.available) {
        setError(lang === "ar" ? "هذا الرقم مستخدم مسبقاً لحساب آخر." : "This code is already linked to another account.");
        return;
      }
      const ok = await activateCard(normalized, actCode, identity.id);
      if (!ok) {
        setError(lang === "ar" ? "رمز التفعيل غير صحيح أو تجاوزتَ عدد المحاولات." : "Invalid activation code or too many attempts.");
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

        {/* Link tab */}
        {(
          <div className="fade-in">
            {!linked ? (
              <>
                <div className="card" style={{ marginBottom: 20, textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🔗</div>
                  <p style={{ color: "var(--muted-foreground)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                    {t("enterSerial")}
                  </p>
                </div>

                {identity?.serialNumber && (
                  <div style={{
                    background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)",
                    borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "var(--primary)",
                    marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span>{lang === "ar" ? `مرتبط حالياً: ${identity.serialNumber}` : `Currently linked: ${identity.serialNumber}`}</span>
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
                    placeholder={lang === "ar" ? "رمز التفعيل المرفق XXXX-XXXX-XXXX" : "Activation code XXXX-XXXX-XXXX"}
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
              <div className="fade-in" style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
                <h3 style={{ color: "#22c55e", marginBottom: 8, fontSize: 18 }}>{t("linked")}</h3>
                <p style={{ color: "var(--muted-foreground)", fontSize: 14, marginBottom: 24 }}>
                  {serial.toUpperCase()} {t("identityLinkedTo")} {identityName}
                </p>
                <div style={{
                  background: "var(--card-elevated)", borderRadius: 14,
                  padding: "16px", marginBottom: 24, border: "1px solid var(--border-strong)",
                  display: "inline-block", textAlign: "center",
                }}>
                  <div data-dir="ltr" style={{ fontFamily: "monospace", fontSize: 20, color: "var(--primary)", fontWeight: 700, letterSpacing: 2 }}>
                    {serial.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>
                    marhaba.com/id/{serial.toUpperCase()}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button className="btn-primary" onClick={() => setScreen("home")}>{t("backToHome")}</button>
                  <button className="btn-ghost" onClick={() => { setLinked(false); setSerial(SERIAL_PREFIX); setActCode(""); }}>
                    {lang === "ar" ? "ربط إكسسوار آخر" : "Link another accessory"}
                  </button>
                </div>
              </div>
            )}
            {/* الهدايا: للمدير والمشتركين فقط، وغيرهم يرون بطاقة طلب التفعيل */}
            {(isAdmin || canGifts) ? (
              <MyGifts />
            ) : (
              <div className="card" style={{ marginTop: 16, textAlign: "center" }}>
                <div style={{ fontSize: 28 }}>🎁</div>
                <div style={{ fontWeight: 700, margin: "6px 0" }}>
                  {lang === "ar" ? "أعمال وهدايا — خاصية مدفوعة" : "Works & gifts — paid feature"}
                </div>
                <div style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.8 }}>
                  {lang === "ar" ? "اطلب التفعيل وسنفعّلها لحسابك بعد التواصل." : "Request activation and we will enable it for your account."}
                </div>
                <a
                  className="btn-primary"
                  style={{ display: "block", marginTop: 12, textDecoration: "none" }}
                  href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
                    `أرغب بتفعيل خاصية أعمال وهدايا لحسابي${(supabaseUser as any)?.email ? ` (${(supabaseUser as any).email})` : ""}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {lang === "ar" ? "💬 اطلب التفعيل عبر واتساب" : "💬 Request activation on WhatsApp"}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

