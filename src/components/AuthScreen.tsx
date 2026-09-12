import { useState } from "react";
import { useApp } from "../context/AppContext";
import marhabaLogo from "../imports/2177178-removebg-preview__1_.png";
import { supabase } from "../lib/supabase";

export default function AuthScreen() {
  const { t, setScreen, lang, setLang, authMode, setAuthMode } = useApp();
  const [mode, setMode] = useState<"login" | "register">(authMode);

  const switchMode = (m: "login" | "register") => {
    setMode(m);
    setAuthMode(m);
  };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (mode === "register" && !agreedToTerms) {
      setTermsError(true);
      return;
    }
    setTermsError(false);

    if (!email || !password) {
      setError(lang === "ar" ? "يرجى إدخال البريد الإلكتروني وكلمة المرور." : "Please enter email and password.");
      return;
    }

    if (mode === "register" && password !== confirm) {
      setError(lang === "ar" ? "كلمتا المرور غير متطابقتين." : "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name || email.split("@")[0] },
          },
        });
        if (signUpError) throw signUpError;
        setShowVerification(true);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        // AppContext onAuthStateChange will handle navigation
      }
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("Invalid login credentials") || msg.includes("invalid_credentials")) {
        setError(lang === "ar" ? "البريد أو كلمة المرور غير صحيحة." : "Invalid email or password.");
      } else if (msg.includes("Email not confirmed")) {
        setError(lang === "ar" ? "يرجى تأكيد بريدك أولاً." : "Please confirm your email first.");
        setShowVerification(true);
      } else if (msg.includes("User already registered")) {
        setError(lang === "ar" ? "هذا البريد مسجّل بالفعل. جرّب تسجيل الدخول." : "Email already registered. Try signing in.");
      } else {
        setError(msg || (lang === "ar" ? "حدث خطأ غير متوقع." : "An unexpected error occurred."));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: "select_account" },
      },
    });
    if (oauthError) {
      // 403 usually means this redirect URL is not added in Supabase:
      // Dashboard → Authentication → URL Configuration → Redirect URLs
      const msg = oauthError.message.includes("403")
        ? (lang === "ar"
            ? "خطأ في إعداد Google — يرجى التواصل مع الدعم."
            : "Google auth config error — please contact support.")
        : oauthError.message;
      setError(msg);
      setLoading(false);
    }
    // Navigation handled by onAuthStateChange after redirect
  };

  const handleResend = async () => {
    const { error: resendError } = await supabase.auth.resend({ type: "signup", email });
    if (!resendError) {
      setVerificationSent(true);
      setTimeout(() => setVerificationSent(false), 4000);
    }
  };

  if (showVerification) {
    return (
      <div className="screen fade-in" style={{ paddingBottom: 0 }}>
        <div style={{ padding: "60px 24px 32px", textAlign: "center" }}>
          <img src={marhabaLogo} alt="مرحبا NFC" style={{ width: 90, height: "auto", margin: "0 auto 28px", display: "block" }} />
          <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
          <h2 style={{ fontWeight: 800, marginBottom: 10 }}>{t("verifyEmail")}</h2>
          <p style={{ color: "var(--muted-foreground)", fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
            {lang === "ar"
              ? `تم إرسال رابط التأكيد إلى ${email}. افتح الرابط للتحقق من حسابك.`
              : `A verification link was sent to ${email}. Open it to confirm your account.`}
          </p>
          {verificationSent && (
            <div style={{
              background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
              borderRadius: 10, padding: "10px 14px", color: "#22c55e", fontSize: 13, marginBottom: 16,
            }}>
              ✓ {t("verificationSent")}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button className="btn-secondary" onClick={handleResend}>{t("resendVerification")}</button>
            <button className="btn-ghost" onClick={() => setShowVerification(false)}>
              {lang === "ar" ? "رجوع" : "Back"}
            </button>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 20, lineHeight: 1.6 }}>
            {lang === "ar"
              ? "بعد التأكيد، أغلق هذه الصفحة وأعد فتح التطبيق أو اضغط «رجوع» وسجّل دخولك."
              : "After confirming, close this page and sign in again."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen fade-in" style={{ paddingBottom: 0 }}>
      <div style={{ padding: "40px 24px 32px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src={marhabaLogo} alt="مرحبا NFC Logo" style={{ width: 120, height: "auto", margin: "0 auto 12px", display: "block" }} />
          <div style={{ color: "var(--muted-foreground)", fontSize: 14, marginTop: 4 }}>
            {mode === "login" ? t("welcomeBack") : t("welcome")}
          </div>
        </div>

        {/* Language toggle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24, gap: 8 }}>
          {(["ar", "en"] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)} style={{
              padding: "6px 16px", borderRadius: 20,
              border: `1px solid ${lang === l ? "var(--primary)" : "var(--border-strong)"}`,
              background: lang === l ? "rgba(201,168,76,0.15)" : "transparent",
              color: lang === l ? "var(--primary)" : "var(--muted-foreground)",
              fontSize: 13, cursor: "pointer", fontFamily: "inherit",
            }}>
              {l === "ar" ? "العربية" : "English"}
            </button>
          ))}
        </div>

        {/* Mode tabs */}
        <div style={{
          display: "flex", background: "var(--card)", borderRadius: 12, padding: 4, marginBottom: 24,
          border: "1px solid var(--border)",
        }}>
          {(["login", "register"] as const).map((m) => (
            <button key={m} onClick={() => { switchMode(m); setTermsError(false); setError(""); }} style={{
              flex: 1, padding: "10px", borderRadius: 9, border: "none",
              background: mode === m ? "var(--card-elevated)" : "transparent",
              color: mode === m ? "var(--foreground)" : "var(--muted-foreground)",
              fontWeight: mode === m ? 600 : 400,
              fontSize: 14, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
            }}>
              {m === "login" ? t("login") : t("register")}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            background: "rgba(229,62,62,0.1)", border: "1px solid rgba(229,62,62,0.3)",
            borderRadius: 10, padding: "10px 14px", color: "var(--emergency)",
            fontSize: 13, marginBottom: 16,
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "register" && (
            <div>
              <label style={{ fontSize: 13, color: "var(--muted-foreground)", display: "block", marginBottom: 6 }}>{t("name")}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("enterName")} />
            </div>
          )}
          <div>
            <label style={{ fontSize: 13, color: "var(--muted-foreground)", display: "block", marginBottom: 6 }}>{t("email")}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--muted-foreground)", display: "block", marginBottom: 6 }}>{t("password")}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {mode === "register" && (
            <div>
              <label style={{ fontSize: 13, color: "var(--muted-foreground)", display: "block", marginBottom: 6 }}>{t("confirmPassword")}</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
            </div>
          )}
        </div>

        {/* Terms checkbox */}
        {mode === "register" && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              {/* Standalone checkbox — clicking ONLY toggles agreement */}
              <div
                role="checkbox"
                aria-checked={agreedToTerms}
                tabIndex={0}
                onClick={() => { setAgreedToTerms(!agreedToTerms); setTermsError(false); }}
                onKeyDown={(e) => e.key === " " && (setAgreedToTerms(!agreedToTerms), setTermsError(false))}
                style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 2,
                  border: `2px solid ${termsError ? "var(--emergency)" : agreedToTerms ? "var(--primary)" : "var(--border-strong)"}`,
                  background: agreedToTerms ? "var(--primary)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.2s",
                }}
              >
                {agreedToTerms && <span style={{ color: "#09090f", fontSize: 12, fontWeight: 700, lineHeight: 1 }}>✓</span>}
              </div>
              {/* Text label — privacy link opens in new tab, does NOT affect checkbox */}
              <span style={{ fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.6 }}>
                {t("agreeToTerms")}{" "}
                <a
                  href="#privacy-policy"
                  onClick={(e) => { e.preventDefault(); setScreen("privacy-policy"); }}
                  style={{
                    color: "var(--primary)", textDecoration: "underline",
                    fontFamily: "inherit", fontSize: 13, cursor: "pointer",
                  }}
                >
                  {t("privacyAndTerms")}
                </a>
              </span>
            </div>
            {termsError && (
              <p style={{ color: "var(--emergency)", fontSize: 12, marginTop: 6, marginRight: 30 }}>
                ⚠ {t("termsRequired")}
              </p>
            )}
          </div>
        )}

        {/* Submit */}
        <div style={{ marginTop: 20 }}>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading || (mode === "register" && !agreedToTerms)}
            style={{ opacity: loading || (mode === "register" && !agreedToTerms) ? 0.5 : 1, cursor: (mode === "register" && !agreedToTerms) ? "not-allowed" : "pointer" }}
          >
            {loading
              ? (lang === "ar" ? "جارٍ..." : "Loading...")
              : mode === "login" ? t("login") : t("createAccount")}
          </button>
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ color: "var(--muted-foreground)", fontSize: 12 }}>{t("orContinueWith")}</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        {/* Google */}
        <button className="btn-secondary" onClick={handleGoogle} disabled={loading}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, opacity: loading ? 0.6 : 1 }}>
          <GoogleIcon />
          {t("signInWithGoogle")}
        </button>

        {/* Switch mode */}
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--muted-foreground)" }}>
          {mode === "login" ? t("noAccount") : t("hasAccount")}{" "}
          <button onClick={() => { switchMode(mode === "login" ? "register" : "login"); setError(""); }}
            style={{ color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}>
            {mode === "login" ? t("createAccount") : t("login")}
          </button>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

