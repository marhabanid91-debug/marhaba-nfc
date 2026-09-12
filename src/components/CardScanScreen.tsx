import { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { lookupSerial, SerialRecord, linkSerialToIdentity } from "../lib/db";
import marhabaLogo from "../imports/2177178-removebg-preview__1_.png";

type Phase =
  | "input"           // waiting for serial entry
  | "checking"        // querying Supabase
  | "not_found"       // code not in serial_inventory
  | "unclaimed"       // status = available → ready to link
  | "claimed_mine"    // status = linked, identity_id = current user's identity
  | "claimed_other";  // status = linked, belongs to someone else

export default function CardScanScreen() {
  const { lang, setLang, setScreen, user, identities, activeIdentityId,
          setPendingSerial, setAuthMode, supabaseUser } = useApp();
  const isAr = lang === "ar";

  const [serial, setSerial] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [record, setRecord] = useState<SerialRecord | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleLookup = async () => {
    const trimmed = serial.trim();
    if (!trimmed) return;
    setPhase("checking");

    const result = await lookupSerial(trimmed);

    if (result.status === "not_found") {
      setPhase("not_found");
      return;
    }

    setRecord(result.record);

    if (result.status === "available") {
      setPhase("unclaimed");
    } else {
      // linked — check if it belongs to current user's identity
      const myIdentityIds = identities.map((i) => i.id);
      if (result.record.identity_id && myIdentityIds.includes(result.record.identity_id)) {
        setPhase("claimed_mine");
      } else {
        setPhase("claimed_other");
      }
    }
  };

  const handleActivate = async () => {
    if (!record) return;
    if (supabaseUser && identities.length > 0) {
      // Already signed in — link immediately
      const identityId = activeIdentityId || identities[0].id;
      await linkSerialToIdentity(record.serial_number, identityId, supabaseUser.id);
      setScreen("home");
    } else {
      // Not signed in — store serial and go to register
      setPendingSerial(record);
      setAuthMode("register");
      setScreen("auth");
    }
  };

  const handleViewProfile = () => {
    setScreen("reader-business");
  };

  const reset = () => {
    setSerial("");
    setPhase("input");
    setRecord(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div style={{
      minHeight: "100%",
      background: "var(--background)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Top bar */}
      <div style={{
        padding: "20px 20px 0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <img src={marhabaLogo} alt="مرحبا NFC" style={{ height: 36, width: "auto" }} />
        {/* Language toggle */}
        <div style={{ display: "flex", gap: 6 }}>
          {(["ar", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                padding: "5px 12px", borderRadius: 20, fontSize: 12,
                border: `1px solid ${lang === l ? "var(--primary)" : "var(--border-strong)"}`,
                background: lang === l ? "rgba(201,168,76,0.15)" : "transparent",
                color: lang === l ? "var(--primary)" : "var(--muted-foreground)",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {l === "ar" ? "ع" : "EN"}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px 48px",
        gap: 0,
      }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24,
            background: "rgba(201,168,76,0.1)",
            border: "1.5px solid rgba(201,168,76,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, margin: "0 auto 20px",
          }}>
            {phase === "checking" ? "🔍"
              : phase === "not_found" ? "❓"
              : phase === "unclaimed" ? "🎉"
              : phase === "claimed_mine" ? "✅"
              : phase === "claimed_other" ? "🔒"
              : "📟"}
          </div>
          <h1 style={{
            fontSize: 26, fontWeight: 800, margin: "0 0 10px",
            background: "linear-gradient(135deg, #f0f0f5 20%, #c9a84c)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: isAr ? 0 : -0.5,
          }}>
            {phase === "checking"      ? (isAr ? "جارٍ التحقق…" : "Checking…")
              : phase === "not_found"   ? (isAr ? "الرقم غير موجود" : "Code Not Found")
              : phase === "unclaimed"   ? (isAr ? "بطاقة جاهزة للتفعيل!" : "Card Ready to Activate!")
              : phase === "claimed_mine"  ? (isAr ? "بطاقتك المفعّلة" : "Your Active Card")
              : phase === "claimed_other" ? (isAr ? "هذه البطاقة مفعّلة مسبقاً" : "Already Activated")
              : (isAr ? "مرحباً بك في MARHABA NFC" : "Welcome to MARHABA NFC")}
          </h1>
          <p style={{ color: "var(--muted-foreground)", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
            {phase === "checking"      ? (isAr ? "نبحث عن البطاقة في قاعدة البيانات…" : "Looking up your card…")
              : phase === "not_found"   ? (isAr ? "الرقم غير موجود في النظام. تأكد من الكود وأعد المحاولة." : "This code does not exist. Check the code and try again.")
              : phase === "unclaimed"   ? (isAr ? `الكود ${record?.serial_number} صحيح وجاهز للتفعيل. سجّل حسابك للمتابعة.` : `Code ${record?.serial_number} is valid and ready. Create your account to activate it.`)
              : phase === "claimed_mine"  ? (isAr ? "هذه البطاقة مرتبطة بحسابك. انتقل لعرض ملفك الشخصي." : "This card is linked to your account.")
              : phase === "claimed_other" ? (isAr ? "هذه البطاقة مفعّلة مسبقاً لحساب آخر." : "This card has already been activated by another account.")
              : (isAr ? "أدخل الكود التسلسلي الموجود على بطاقتك أو إكسسوارك للبدء." : "Enter the serial code printed on your card or accessory to get started.")}
          </p>
        </div>

        {/* ── Two main CTA buttons — shown only in input phase ── */}
        {phase === "input" && (
          <div style={{ width: "100%", maxWidth: 380, marginBottom: 28 }} className="fade-in">
            {/* Login */}
            <button
              className="btn-primary"
              onClick={() => { setAuthMode("login"); setScreen("auth"); }}
              style={{ marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              {isAr ? "الدخول إلى المنصة" : "Sign In to Platform"}
            </button>
            {/* Register */}
            <button
              onClick={() => { setAuthMode("register"); setScreen("auth"); }}
              style={{
                width: "100%", height: 48, borderRadius: 12,
                background: "rgba(201,168,76,0.1)",
                border: "1.5px solid rgba(201,168,76,0.35)",
                color: "#c9a84c", fontSize: 15, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              {isAr ? "إنشاء هويتك الذكية" : "Create Your Smart Identity"}
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 0" }}>
              <div style={{ flex: 1, height: 1, background: "var(--border-strong)" }} />
              <span style={{ fontSize: 12, color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>
                {isAr ? "أو تحقق من كودك أدناه" : "or verify your code below"}
              </span>
              <div style={{ flex: 1, height: 1, background: "var(--border-strong)" }} />
            </div>
          </div>
        )}

        {/* Input phase */}
        {(phase === "input" || phase === "not_found") && (
          <div style={{ width: "100%", maxWidth: 380 }} className="fade-in">
            <div style={{ position: "relative", marginBottom: 12 }}>
              <input
                ref={inputRef}
                value={serial}
                onChange={(e) => { setSerial(e.target.value.toUpperCase()); if (phase === "not_found") setPhase("input"); }}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                placeholder="MRH-000001"
                style={{
                  width: "100%",
                  height: 56,
                  paddingInlineStart: 50,
                  paddingInlineEnd: serial ? 44 : 16,
                  fontSize: 18,
                  fontFamily: "monospace, sans-serif",
                  letterSpacing: 2,
                  textAlign: "center",
                  background: "var(--card)",
                  border: `2px solid ${phase === "not_found" ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 16,
                  color: "var(--foreground)",
                  textTransform: "uppercase",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                data-dir="ltr"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = phase === "not_found" ? "rgba(239,68,68,0.8)" : "#c9a84c";
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${phase === "not_found" ? "rgba(239,68,68,0.12)" : "rgba(201,168,76,0.14)"}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = phase === "not_found" ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              {/* Barcode icon */}
              <div style={{
                position: "absolute", insetInlineStart: 14, top: "50%", transform: "translateY(-50%)",
                color: "var(--muted-foreground)", pointerEvents: "none",
              }}>
                <BarcodeIcon />
              </div>
              {/* Clear */}
              {serial && (
                <button
                  onClick={() => { setSerial(""); setPhase("input"); inputRef.current?.focus(); }}
                  style={{
                    position: "absolute", insetInlineEnd: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--muted-foreground)", fontSize: 18, padding: 4, lineHeight: 1,
                  }}
                >×</button>
              )}
            </div>

            {phase === "not_found" && (
              <p style={{ color: "rgba(239,68,68,0.9)", fontSize: 12, textAlign: "center", marginBottom: 12 }}>
                ⚠ {isAr ? "الكود غير مسجّل في النظام" : "This code is not registered in the system"}
              </p>
            )}

            <button
              className="btn-primary"
              onClick={handleLookup}
              disabled={!serial.trim()}
              style={{ opacity: !serial.trim() ? 0.5 : 1, cursor: !serial.trim() ? "not-allowed" : "pointer" }}
            >
              {isAr ? "تحقق من الكود" : "Check Code"}
            </button>

          </div>
        )}

        {/* Checking spinner */}
        {phase === "checking" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }} className="fade-in">
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              border: "3px solid rgba(201,168,76,0.2)",
              borderTopColor: "#c9a84c",
              animation: "spin 0.8s linear infinite",
            }} />
            <p style={{ color: "var(--muted-foreground)", fontSize: 13 }}>
              {isAr ? "جارٍ الاستعلام عن الكود…" : "Querying database…"}
            </p>
          </div>
        )}

        {/* Unclaimed — available → link/register */}
        {phase === "unclaimed" && record && (
          <div style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 12 }} className="fade-in">
            <CardBadge record={record} isAr={isAr} />
            <button className="btn-primary" onClick={handleActivate}>
              {isAr ? "سجّل وفعّل البطاقة الآن" : "Register & Activate Now"}
            </button>
            <button className="btn-ghost" onClick={reset}>
              {isAr ? "إدخال كود آخر" : "Enter a different code"}
            </button>
          </div>
        )}

        {/* Claimed mine — belongs to this user */}
        {phase === "claimed_mine" && record && (
          <div style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 12 }} className="fade-in">
            <CardBadge record={record} isAr={isAr} owned />
            <button className="btn-primary" onClick={handleViewProfile}>
              {isAr ? "عرض ملفي الشخصي" : "View My Profile"}
            </button>
            <button className="btn-ghost" onClick={() => setScreen("home")}>
              {isAr ? "الصفحة الرئيسية" : "Go Home"}
            </button>
          </div>
        )}

        {/* Claimed by someone else */}
        {phase === "claimed_other" && (
          <div style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 12 }} className="fade-in">
            <div style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 14, padding: "16px",
              textAlign: "center",
            }}>
              <p style={{ fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.7, margin: 0 }}>
                {isAr
                  ? "هذه البطاقة مفعّلة لمستخدم آخر. إذا كانت لديك وتعتقد أن ثمة خطأ، تواصل مع الدعم."
                  : "This card is already activated. If you own it and believe this is an error, contact support."}
              </p>
            </div>
            <button className="btn-ghost" onClick={reset}>
              {isAr ? "إدخال كود آخر" : "Try another code"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Card Badge ───────────────────────────────────────────────────────────────

function CardBadge({ record, isAr, owned = false }: { record: SerialRecord; isAr: boolean; owned?: boolean }) {
  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border-strong)",
      borderRadius: 16, padding: 20, display: "flex", alignItems: "center", gap: 16,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: owned ? "rgba(34,197,94,0.12)" : "rgba(201,168,76,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24, flexShrink: 0,
      }}>
        {owned ? "🪪" : "✨"}
      </div>
      <div style={{ flex: 1 }}>
        <div data-dir="ltr" style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, letterSpacing: 1.5, color: "var(--primary)" }}>
          {record.serial_number}
        </div>
        <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 4 }}>
          {isAr
            ? (owned ? "مرتبطة بهويتك ✓" : "متاحة للتفعيل")
            : (owned ? "Linked to your identity ✓" : "Available to activate")}
        </div>
      </div>
      <div style={{
        width: 10, height: 10, borderRadius: "50%",
        background: owned ? "#22c55e" : "#f59e0b",
        boxShadow: `0 0 8px ${owned ? "rgba(34,197,94,0.5)" : "rgba(245,158,11,0.5)"}`,
      }} />
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function BarcodeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5v14M7 5v14M11 5v14M15 5v6M19 5v14M15 13v6" />
    </svg>
  );
}

