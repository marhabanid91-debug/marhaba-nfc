import { useState } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";
import { lookupSerial, createIdentity, linkSerialToIdentity, deleteIdentityFromDB } from "../lib/db";
import marhabaLogo from "../imports/marhaba-logo.png";

const norm = (s: string) => s.trim().toUpperCase().replace(/\s+/g, "");

/**
 * بوابة الرقم التسلسلي:
 *  - gateSerial موجود  → بطاقة غير مفعّلة تم مسحها: يجب إدخال الرقم المرفق أولاً.
 *  - gateSerial فارغ   → مستخدم يضيف بطاقة جديدة من داخل التطبيق.
 * بعد نجاح التحقق: إن كان الدخول مفعّلاً تظهر مباشرة صفحة إضافة هوية (دون شاشة الدخول)،
 * وإلا يُحوَّل لإنشاء حساب ويُربط الرقم بعد التسجيل.
 */
export default function SerialGateScreen() {
  const { lang, setScreen, gateSerial, setGateSerial, setAuthMode, supabaseUser } = useApp();
  const isAr = lang === "ar";
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const goHomeFresh = () => {
    window.location.replace(window.location.pathname);
  };

  const handleVerify = async () => {
    const typed = norm(code);
    if (!typed) return;
    setBusy(true); setError("");
    try {
      if (gateSerial && typed !== norm(gateSerial)) {
        setError(isAr ? "الرقم غير مطابق لهذه البطاقة" : "This number doesn't match the card");
        return;
      }
      const res = await lookupSerial(typed);
      if (res.status === "not_found") {
        setError(isAr ? "الرقم غير موجود في النظام" : "Number not found");
        return;
      }
      if (res.status === "linked") {
        setError(isAr ? "هذه البطاقة مفعّلة مسبقاً" : "This card is already activated");
        return;
      }
      const serial = res.record.serial_number;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user || supabaseUser) {
        setVerified(serial);            // → صفحة إضافة الهوية مباشرة
      } else {
        localStorage.setItem("pending_serial", serial);
        setGateSerial(null);
        setAuthMode("register");
        setScreen("auth");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    if (!verified || !name.trim()) return;
    setBusy(true); setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id || supabaseUser?.id;
      if (!uid) { setError(isAr ? "انتهت الجلسة، سجّل الدخول" : "Session expired"); return; }
      const id = await createIdentity(uid, name.trim());
      if (!id) { setError(isAr ? "تعذّر إنشاء الهوية" : "Could not create identity"); return; }
      const ok = await linkSerialToIdentity(verified, id, uid);
      if (!ok) {
        await deleteIdentityFromDB(id).catch(() => {});
        setError(isAr ? "تعذّر ربط البطاقة، قد تكون مفعّلة مسبقاً" : "Could not link the card");
        return;
      }
      goHomeFresh();
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => {
    setGateSerial(null);
    if (supabaseUser) setScreen("home"); else goHomeFresh();
  };

  return (
    <div style={{ minHeight: "100%", background: "var(--background)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", gap: 20 }}>
      <img src={marhabaLogo} alt="مرحبا NFC" style={{ height: 44, width: "auto" }} />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>{verified ? "✅" : "🔐"}</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>
          {verified ? (isAr ? "أضف هويتك" : "Add your identity") : (isAr ? "أدخل الرقم المرفق مع البطاقة" : "Enter the number included with your card")}
        </h1>
        <p style={{ color: "var(--muted-foreground)", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          {verified
            ? (isAr ? "اكتب اسم الهوية التي ستُربط بهذه البطاقة." : "Name the identity to link to this card.")
            : (isAr ? "لتفعيل بطاقة جديدة، اكتب الرقم التسلسلي المرفق معها." : "To activate a new card, type the serial number that came with it.")}
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 12 }}>
        {!verified ? (
          <>
            <input
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              placeholder="MARHABA-000"
              data-dir="ltr"
              autoFocus
              style={{ height: 56, fontSize: 18, letterSpacing: 2, textAlign: "center", fontFamily: "monospace, sans-serif", textTransform: "uppercase" }}
            />
            {error && <p style={{ color: "rgba(239,68,68,0.9)", fontSize: 13, textAlign: "center", margin: 0 }}>⚠ {error}</p>}
            <button className="btn-primary" onClick={handleVerify} disabled={busy || !code.trim()} style={{ opacity: busy || !code.trim() ? 0.5 : 1 }}>
              {busy ? "…" : (isAr ? "متابعة" : "Continue")}
            </button>
          </>
        ) : (
          <>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder={isAr ? "اسم الهوية" : "Identity name"}
              autoFocus
            />
            {error && <p style={{ color: "rgba(239,68,68,0.9)", fontSize: 13, textAlign: "center", margin: 0 }}>⚠ {error}</p>}
            <button className="btn-primary" onClick={handleCreate} disabled={busy || !name.trim()} style={{ opacity: busy || !name.trim() ? 0.5 : 1 }}>
              {busy ? "…" : (isAr ? "إضافة وتفعيل البطاقة" : "Add & activate card")}
            </button>
          </>
        )}
        <button className="btn-ghost" onClick={cancel}>{isAr ? "إلغاء" : "Cancel"}</button>
      </div>
    </div>
  );
}
