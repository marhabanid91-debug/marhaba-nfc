import { useState } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";
import { verifyActivation, createIdentity, activateCard, deleteIdentityFromDB } from "../lib/db";
import marhabaLogo from "../imports/marhaba-logo.png";

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
    const typed = code.trim();
    if (!typed) return;
    setBusy(true); setError("");
    try {
      const serial = await verifyActivation(gateSerial, typed);
      if (!serial) {
        setError(isAr ? "رمز التفعيل غير صحيح، أو البطاقة مفعّلة، أو تجاوزتَ عدد المحاولات (أعيدي المحاولة بعد قليل)" : "Invalid activation code, card already activated, or too many attempts");
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user || supabaseUser) {
        setVerified(serial);            // → صفحة إضافة الهوية مباشرة
      } else {
        localStorage.setItem("pending_serial", serial);
        localStorage.setItem("pending_code", code.trim());
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
      const ok = await activateCard(verified, code, id);
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
          {verified ? (isAr ? "أضف هويتك" : "Add your identity") : (isAr ? "أدخل رمز التفعيل المرفق مع البطاقة" : "Enter the activation code included with your card")}
        </h1>
        <p style={{ color: "var(--muted-foreground)", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          {verified
            ? (isAr ? "اكتب اسم الهوية التي ستُربط بهذه البطاقة." : "Name the identity to link to this card.")
            : (isAr ? "لتفعيل بطاقة جديدة، اكتب رمز التفعيل المطبوع على الورقة المرفقة معها." : "To activate a new card, type the activation code printed on the insert that came with it.")}
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 12 }}>
        {!verified ? (
          <>
            <input
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              placeholder="XXXX-XXXX-XXXX"
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
