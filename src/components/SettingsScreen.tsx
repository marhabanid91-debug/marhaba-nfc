import { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { useAppSettings } from "../hooks/useAppSettings";
import { initSchema, getSchemaStatus } from "../lib/api";
import { uploadAvatar } from "../lib/db";

export default function SettingsScreen() {
  const { t, lang, setLang, setScreen, setUser, setAvatarUrl, user, supabaseUser, isAdmin, identities, activeIdentityId, setActiveIdentityId, darkMode, setDarkMode, deleteIdentity: ctxDelete, toggleIdentityActive: ctxToggle } = useApp();
  const { settings, saving, save, whatsappLink } = useAppSettings();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [editingSettings, setEditingSettings] = useState(false);
  const [editWa, setEditWa] = useState("");
  const [editWaAccessory, setEditWaAccessory] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editStoreLinks, setEditStoreLinks] = useState<import("../lib/api").StoreLink[]>([]);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [dbInitState, setDbInitState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [dbStatus, setDbStatus] = useState<Record<string, boolean> | null>(null);

  // Change password state
  const [showChangePw, setShowChangePw] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const identity = identities.find((i) => i.id === activeIdentityId) || identities[0];
  const identityName = identity?.emergency.name || identity?.business.name || (lang === "ar" ? "هوية جديدة" : "New Identity");

  const handleLogout = async () => {
    const { supabase: sb } = await import("../lib/supabase");
    await sb.auth.signOut().catch(() => {});
    setUser(null);
    setScreen("auth");
  };

  const deleteIdentity = ctxDelete;
  const toggleIdentityActive = ctxToggle;

  const handleChangePassword = async () => {
    setPwError("");
    if (!pwNew || !pwConfirm) {
      setPwError(lang === "ar" ? "يرجى ملء جميع الحقول." : "Please fill all fields.");
      return;
    }
    if (pwNew.length < 6) {
      setPwError(lang === "ar" ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل." : "Password must be at least 6 characters.");
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwError(lang === "ar" ? "كلمتا المرور غير متطابقتين." : "Passwords do not match.");
      return;
    }
    setPwLoading(true);
    try {
      const { supabase: sb } = await import("../lib/supabase");
      // Re-authenticate first with current password to verify identity
      if (user?.email && pwCurrent) {
        const { error: reAuthErr } = await sb.auth.signInWithPassword({ email: user.email, password: pwCurrent });
        if (reAuthErr) {
          setPwError(lang === "ar" ? "كلمة المرور الحالية غير صحيحة." : "Current password is incorrect.");
          return;
        }
      }
      const { error } = await sb.auth.updateUser({ password: pwNew });
      if (error) throw error;
      setPwSuccess(true);
      setPwCurrent(""); setPwNew(""); setPwConfirm("");
      setTimeout(() => { setPwSuccess(false); setShowChangePw(false); }, 2500);
    } catch (err: any) {
      setPwError(err?.message || (lang === "ar" ? "حدث خطأ." : "An error occurred."));
    } finally {
      setPwLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabaseUser) return;
    setAvatarError("");
    setAvatarUploading(true);
    try {
      const url = await uploadAvatar(supabaseUser.id, file);
      if (url) {
        setAvatarUrl(url);
      } else {
        setAvatarError(lang === "ar" ? "فشل رفع الصورة. تأكد من وجود bucket اسمه avatars في Supabase Storage." : "Upload failed. Make sure an 'avatars' bucket exists in Supabase Storage.");
      }
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="screen fade-in">
      <div style={{ padding: "24px 20px 0" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>{t("settings")}</h1>

        {/* Account */}
        <SectionHeader label={lang === "ar" ? "إدارة الحساب" : "Account Management"} />
        <div className="card" style={{ marginBottom: 16 }}>
          {/* Avatar row */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0" }}>
            {/* Hidden file input */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />
            {/* Avatar circle — click to pick */}
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              style={{
                position: "relative", width: 60, height: 60, borderRadius: "50%",
                border: "2px solid var(--primary)", background: "var(--card-elevated)",
                cursor: avatarUploading ? "wait" : "pointer", flexShrink: 0,
                overflow: "hidden", padding: 0,
              }}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: 26, lineHeight: "60px" }}>👤</span>
              )}
              {/* Upload overlay */}
              <div style={{
                position: "absolute", inset: 0,
                background: avatarUploading ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s",
              }}>
                {avatarUploading && (
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    animation: "spin 0.7s linear infinite",
                  }} />
                )}
              </div>
              {/* Camera badge */}
              {!avatarUploading && (
                <div style={{
                  position: "absolute", bottom: 0, right: 0,
                  width: 20, height: 20, borderRadius: "50%",
                  background: "var(--primary)", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 10,
                }}>📷</div>
              )}
            </button>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{user?.name || (lang === "ar" ? "المستخدم" : "User")}</div>
              <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>{user?.email || ""}</div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                style={{
                  marginTop: 6, padding: "3px 10px", borderRadius: 8,
                  border: "1px solid var(--border-strong)",
                  background: "transparent", color: "var(--primary)",
                  fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {avatarUploading
                  ? (lang === "ar" ? "جارٍ الرفع..." : "Uploading…")
                  : user?.avatarUrl
                    ? (lang === "ar" ? "تغيير الصورة" : "Change photo")
                    : (lang === "ar" ? "إضافة صورة" : "Add photo")}
              </button>
            </div>
          </div>

          {avatarError && (
            <div style={{
              background: "rgba(229,62,62,0.08)", border: "1px solid rgba(229,62,62,0.2)",
              borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "var(--emergency)",
              marginBottom: 8,
            }}>
              ⚠ {avatarError}
            </div>
          )}

          <div className="divider" />
          <Row
            icon="🔑"
            label={lang === "ar" ? "تغيير كلمة المرور" : "Change Password"}
            arrow={!showChangePw}
            onPress={() => { setShowChangePw(!showChangePw); setPwError(""); setPwSuccess(false); }}
          />
          {showChangePw && (
            <div style={{ paddingBottom: 8 }}>
              {pwSuccess ? (
                <div style={{
                  background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
                  borderRadius: 10, padding: "12px 14px", color: "#22c55e", fontSize: 13,
                  textAlign: "center", marginTop: 4,
                }}>
                  ✓ {lang === "ar" ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully"}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                  <PwInput
                    label={lang === "ar" ? "كلمة المرور الحالية" : "Current password"}
                    value={pwCurrent}
                    onChange={setPwCurrent}
                  />
                  <PwInput
                    label={lang === "ar" ? "كلمة المرور الجديدة" : "New password"}
                    value={pwNew}
                    onChange={setPwNew}
                  />
                  <PwInput
                    label={lang === "ar" ? "تأكيد كلمة المرور الجديدة" : "Confirm new password"}
                    value={pwConfirm}
                    onChange={setPwConfirm}
                  />
                  {pwError && (
                    <div style={{
                      background: "rgba(229,62,62,0.08)", border: "1px solid rgba(229,62,62,0.2)",
                      borderRadius: 8, padding: "8px 12px", color: "var(--emergency)", fontSize: 12,
                    }}>
                      ⚠ {pwError}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleChangePassword}
                      disabled={pwLoading}
                      style={{
                        flex: 1, padding: "10px", borderRadius: 10,
                        background: "linear-gradient(135deg,#c9a84c,#d4af37)",
                        border: "none", color: "#09090f",
                        fontWeight: 700, fontSize: 13, cursor: "pointer",
                        fontFamily: "inherit", opacity: pwLoading ? 0.6 : 1,
                      }}
                    >
                      {pwLoading ? "…" : (lang === "ar" ? "تحديث" : "Update")}
                    </button>
                    <button
                      onClick={() => { setShowChangePw(false); setPwError(""); }}
                      style={{
                        flex: 1, padding: "10px", borderRadius: 10,
                        background: "transparent", border: "1px solid var(--border-strong)",
                        color: "var(--muted-foreground)", fontSize: 13,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      {lang === "ar" ? "إلغاء" : "Cancel"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="divider" />
          <Row icon="🛡️" label={t("privacy")} arrow onPress={() => setScreen("privacy-policy")} />
        </div>

        {/* Identities */}
        <SectionHeader label={lang === "ar" ? "إدارة الهويات" : "Manage Identities"} />
        <div className="card" style={{ marginBottom: 16 }}>
          {identities.map((identity_, i) => {
            const name_ = identity_.emergency.name || identity_.business.name || (lang === "ar" ? "هوية جديدة" : "New Identity");
            return (
              <div key={identity_.id}>
                {i > 0 && <div className="divider" />}
                <div style={{ padding: "12px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div
                    onClick={() => { setActiveIdentityId(identity_.id); setScreen("emergency"); }}
                    style={{ flex: 1, cursor: "pointer" }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{name_}</div>
                    <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                      {identity_.serialNumber || (lang === "ar" ? "غير مرتبط" : "Not linked")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => toggleIdentityActive(identity_.id)}
                      style={{
                        padding: "4px 10px", borderRadius: 8, fontSize: 11,
                        border: `1px solid ${identity_.isActive ? "var(--primary)" : "var(--border-strong)"}`,
                        background: identity_.isActive ? "rgba(201,168,76,0.1)" : "transparent",
                        color: identity_.isActive ? "var(--primary)" : "var(--muted-foreground)",
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      {identity_.isActive ? t("deactivate") : t("activate")}
                    </button>
                    {identities.length > 1 && (
                      <button
                        onClick={() => deleteIdentity(identity_.id)}
                        style={{
                          padding: "4px 10px", borderRadius: 8, fontSize: 11,
                          border: "1px solid rgba(229,62,62,0.3)",
                          background: "rgba(229,62,62,0.08)",
                          color: "var(--emergency)",
                          cursor: "pointer", fontFamily: "inherit",
                        }}
                      >
                        {lang === "ar" ? "حذف" : "Delete"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Accessory */}
        <SectionHeader label={lang === "ar" ? "إدارة الإكسسوار" : "Manage Accessory"} />
        <div className="card" style={{ marginBottom: 16 }}>
          <Row icon="🔗" label={t("linkAccessory")} arrow onPress={() => setScreen("accessory")} />
          <div className="divider" />
          <Row icon="📡" label={lang === "ar" ? "تحديث بيانات القراءة دون إنترنت" : "Update Offline NFC Data"} arrow onPress={() => setScreen("offline-settings")} />
          <div className="divider" />
          <Row icon="📦" label={t("requestAccessory")} arrow onPress={() => setScreen("accessory")} />
        </div>

        {/* Preferences */}
        <SectionHeader label={lang === "ar" ? "التفضيلات" : "Preferences"} />
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 18 }}>🌐</span>
              <span style={{ fontSize: 14 }}>{t("language")}</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setLang("ar")}
                style={{
                  padding: "4px 12px", borderRadius: 8, fontSize: 12,
                  border: `1px solid ${lang === "ar" ? "var(--primary)" : "var(--border-strong)"}`,
                  background: lang === "ar" ? "rgba(201,168,76,0.12)" : "transparent",
                  color: lang === "ar" ? "var(--primary)" : "var(--muted-foreground)",
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {t("arabic")}
              </button>
              <button
                onClick={() => setLang("en")}
                style={{
                  padding: "4px 12px", borderRadius: 8, fontSize: 12,
                  border: `1px solid ${lang === "en" ? "var(--primary)" : "var(--border-strong)"}`,
                  background: lang === "en" ? "rgba(201,168,76,0.12)" : "transparent",
                  color: lang === "en" ? "var(--primary)" : "var(--muted-foreground)",
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {t("english")}
              </button>
            </div>
          </div>
          <div className="divider" />
          <div style={{ display: "flex", alignItems: "center", padding: "12px 0" }}>
            <span style={{ fontSize: 18, marginInlineEnd: 12 }}>🌙</span>
            <span style={{ fontSize: 14, flex: 1 }}>{t("darkMode")}</span>
            <Toggle on={darkMode} onToggle={() => setDarkMode(!darkMode)} />
          </div>
        </div>

        {/* Support */}
        <SectionHeader label={lang === "ar" ? "الدعم" : "Support"} />
        <div className="card" style={{ marginBottom: 16 }}>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <Row icon="💬" label={t("support")} sub={`WhatsApp: +${settings.whatsapp_number}`} arrow />
          </a>
          <div className="divider" />
          <Row icon="✉️" label={lang === "ar" ? "البريد الإلكتروني" : "Email"} sub={settings.support_email} />
          <div className="divider" />
          <Row icon="📄" label={lang === "ar" ? "سياسة الخصوصية" : "Privacy Policy"} arrow onPress={() => setScreen("privacy-policy")} />
          <div className="divider" />
          <Row icon="ℹ️" label={lang === "ar" ? "عن التطبيق" : "About"} sub="MARHABA NFC v1.0" />
        </div>

        {/* Admin sections — visible ONLY to the platform owner (is_admin = true in profiles) */}
        {isAdmin && <>{/* Admin: Database Init */}
        <SectionHeader label={lang === "ar" ? "قاعدة البيانات (مدير)" : "Database (Admin)"} />
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ padding: "4px 0" }}>
            <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: "0 0 12px" }}>
              {lang === "ar"
                ? "تهيئة جداول Supabase الـ10 (آمن للتشغيل مرات متعددة)"
                : "Initialize all 10 Supabase tables (safe to run multiple times)"}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                disabled={dbInitState === "running"}
                onClick={async () => {
                  setDbInitState("running");
                  try {
                    await initSchema();
                    const status = await getSchemaStatus();
                    setDbStatus(status.tables);
                    setDbInitState("done");
                  } catch {
                    setDbInitState("error");
                  }
                }}
                style={{
                  flex: 1, padding: "10px", borderRadius: 10,
                  background: dbInitState === "done" ? "rgba(34,197,94,0.15)" : "rgba(184,150,46,0.12)",
                  border: `1px solid ${dbInitState === "done" ? "#22c55e" : "rgba(184,150,46,0.4)"}`,
                  color: dbInitState === "done" ? "#22c55e" : "var(--primary, #c9a84c)",
                  fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                  opacity: dbInitState === "running" ? 0.6 : 1,
                }}
              >
                {dbInitState === "running" ? (lang === "ar" ? "جارٍ..." : "Running...") :
                 dbInitState === "done" ? (lang === "ar" ? "✓ تم" : "✓ Done") :
                 dbInitState === "error" ? (lang === "ar" ? "خطأ — أعد المحاولة" : "Error — Retry") :
                 (lang === "ar" ? "تهيئة الجداول" : "Initialize Tables")}
              </button>
              {dbStatus && (
                <button
                  onClick={async () => {
                    const status = await getSchemaStatus();
                    setDbStatus(status.tables);
                  }}
                  style={{
                    padding: "10px 14px", borderRadius: 10,
                    background: "transparent", border: "1px solid var(--border-strong)",
                    color: "var(--muted-foreground)", fontSize: 13,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  ↻
                </button>
              )}
            </div>
            {dbStatus && (
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                {Object.entries(dbStatus).map(([name, exists]) => (
                  <div key={name} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--muted-foreground)", fontFamily: "monospace" }}>{name}</span>
                    <span style={{ color: exists ? "#22c55e" : "var(--emergency)", fontWeight: 600 }}>
                      {exists ? "✓" : "✗"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Admin: App Settings Editor */}
        <SectionHeader label={lang === "ar" ? "إعدادات التطبيق (مدير)" : "App Settings (Admin)"} />
        <div className="card" style={{ marginBottom: 16 }}>
          {!editingSettings ? (
            <div>
              {/* Preview current values */}
              <div style={{ padding: "10px 0 6px", display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 12, color: "var(--muted-foreground)", display: "flex", gap: 8 }}>
                  <span>💬</span>
                  <span style={{ direction: "ltr" }}>+{settings.whatsapp_number}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--muted-foreground)", display: "flex", gap: 8 }}>
                  <span>✉️</span><span>{settings.support_email}</span>
                </div>
                {settings.store_links.length > 0 && (
                  <div style={{ fontSize: 12, color: "var(--muted-foreground)", display: "flex", gap: 8 }}>
                    <span>🔗</span>
                    <span>{settings.store_links.length} {lang === "ar" ? "روابط" : "links"}</span>
                  </div>
                )}
              </div>
              <div className="divider" />
              <Row icon="✏️" label={lang === "ar" ? "تعديل الإعدادات" : "Edit Settings"} arrow onPress={() => {
                setEditWa(settings.whatsapp_number);
                setEditWaAccessory(settings.whatsapp_accessory_number);
                setEditEmail(settings.support_email);
                setEditStoreLinks(settings.store_links.map((l) => ({ ...l })));
                setSettingsSaved(false);
                setSettingsError("");
                setEditingSettings(true);
              }} />
            </div>
          ) : (
            <div style={{ padding: "4px 0" }}>
              <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 14, lineHeight: 1.6 }}>
                {lang === "ar"
                  ? "هذه الإعدادات تؤثر على جميع المستخدمين. التغييرات تُحفظ مباشرة في قاعدة البيانات."
                  : "These settings affect all users. Changes are saved directly to the database."}
              </p>

              <AdminField label={lang === "ar" ? "واتساب الدعم" : "Support WhatsApp"} hint="+966XXXXXXXXX">
                <input value={editWa} onChange={(e) => setEditWa(e.target.value)} placeholder="966500000000" style={{ direction: "ltr" }} type="tel" />
              </AdminField>

              <AdminField label={lang === "ar" ? "واتساب الإكسسوارات" : "Accessories WhatsApp"} hint={lang === "ar" ? "رقم منفصل لطلبات الإكسسوار" : "Separate number for accessory orders"}>
                <input value={editWaAccessory} onChange={(e) => setEditWaAccessory(e.target.value)} placeholder="966500000000" style={{ direction: "ltr" }} type="tel" />
              </AdminField>

              <AdminField label={lang === "ar" ? "البريد الإلكتروني للدعم" : "Support Email"}>
                <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="support@marhaba.com" type="email" />
              </AdminField>

              {/* Store / external links */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <label style={{ fontSize: 12, color: "var(--muted-foreground)", fontWeight: 600 }}>
                    {lang === "ar" ? "روابط خارجية / متاجر" : "External Links / Stores"}
                  </label>
                  <button
                    onClick={() => setEditStoreLinks((prev) => [
                      ...prev,
                      { id: String(Date.now()), label_ar: "", label_en: "", url: "", icon: "🔗" },
                    ])}
                    style={{
                      padding: "4px 10px", borderRadius: 8, fontSize: 12,
                      border: "1px solid var(--primary)", background: "rgba(201,168,76,0.1)",
                      color: "var(--primary)", cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    + {lang === "ar" ? "إضافة رابط" : "Add link"}
                  </button>
                </div>

                {editStoreLinks.length === 0 && (
                  <p style={{ fontSize: 12, color: "var(--muted-foreground)", opacity: 0.7 }}>
                    {lang === "ar" ? "لا توجد روابط بعد." : "No links yet."}
                  </p>
                )}

                {editStoreLinks.map((link, idx) => (
                  <div key={link.id} style={{
                    background: "var(--card-elevated)", borderRadius: 12,
                    border: "1px solid var(--border-strong)", padding: 12,
                    marginBottom: 10, display: "flex", flexDirection: "column", gap: 8,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--muted-foreground)" }}>
                        {lang === "ar" ? `رابط ${idx + 1}` : `Link ${idx + 1}`}
                      </span>
                      <button
                        onClick={() => setEditStoreLinks((prev) => prev.filter((_, i) => i !== idx))}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--emergency)", fontSize: 16, padding: 2 }}
                      >✕</button>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        value={link.icon}
                        onChange={(e) => setEditStoreLinks((prev) => prev.map((l, i) => i === idx ? { ...l, icon: e.target.value } : l))}
                        placeholder="🔗"
                        style={{ width: 50, textAlign: "center", fontSize: 18 }}
                      />
                      <input
                        value={link.label_ar}
                        onChange={(e) => setEditStoreLinks((prev) => prev.map((l, i) => i === idx ? { ...l, label_ar: e.target.value } : l))}
                        placeholder={lang === "ar" ? "الاسم بالعربية" : "Arabic label"}
                        style={{ flex: 1 }}
                      />
                      <input
                        value={link.label_en}
                        onChange={(e) => setEditStoreLinks((prev) => prev.map((l, i) => i === idx ? { ...l, label_en: e.target.value } : l))}
                        placeholder={lang === "ar" ? "الاسم بالإنجليزية" : "English label"}
                        style={{ flex: 1 }}
                      />
                    </div>
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => setEditStoreLinks((prev) => prev.map((l, i) => i === idx ? { ...l, url: e.target.value } : l))}
                      placeholder="https://store.example.com"
                      style={{ direction: "ltr" }}
                    />
                  </div>
                ))}
              </div>

              {settingsSaved && (
                <div style={{
                  background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
                  borderRadius: 10, padding: "10px 14px", color: "#22c55e", fontSize: 13, marginBottom: 12,
                }}>
                  ✓ {lang === "ar" ? "تم الحفظ بنجاح" : "Saved successfully"}
                </div>
              )}
              {settingsError && (
                <div style={{
                  background: "rgba(229,62,62,0.08)", border: "1px solid rgba(229,62,62,0.2)",
                  borderRadius: 10, padding: "10px 14px", color: "var(--emergency)", fontSize: 12, marginBottom: 12,
                }}>
                  ⚠ {settingsError}
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={async () => {
                    setSettingsError("");
                    try {
                      await save({
                        whatsapp_number: editWa,
                        whatsapp_accessory_number: editWaAccessory,
                        support_email: editEmail,
                        store_links: editStoreLinks,
                      });
                      setSettingsSaved(true);
                      setTimeout(() => { setSettingsSaved(false); setEditingSettings(false); }, 1800);
                    } catch (e: any) {
                      setSettingsError(e?.message || (lang === "ar" ? "فشل الحفظ" : "Save failed"));
                    }
                  }}
                  disabled={saving}
                  style={{
                    flex: 1, padding: "10px", borderRadius: 10,
                    background: "linear-gradient(135deg, #c9a84c, #d4af37)",
                    border: "none", color: "#09090f",
                    fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? "…" : (lang === "ar" ? "حفظ الإعدادات" : "Save Settings")}
                </button>
                <button
                  onClick={() => { setEditingSettings(false); setSettingsError(""); }}
                  style={{
                    flex: 1, padding: "10px", borderRadius: 10,
                    background: "transparent", border: "1px solid var(--border-strong)",
                    color: "var(--muted-foreground)",
                    fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {lang === "ar" ? "إلغاء" : "Cancel"}
                </button>
              </div>
            </div>
          )}
        </div>
        </>}

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            width: "100%", padding: "14px", borderRadius: 12,
            border: "1px solid rgba(229,62,62,0.3)",
            background: "rgba(229,62,62,0.08)",
            color: "var(--emergency)", fontSize: 15, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit", marginBottom: 24,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          🚪 {t("logout")}
        </button>
      </div>
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ fontSize: 11, color: "var(--muted-foreground)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, paddingInlineStart: 4 }}>
      {label}
    </div>
  );
}

function Row({ icon, label, sub, arrow, note, onPress }: {
  icon: string; label: string; sub?: string; arrow?: boolean; note?: string; onPress?: () => void;
}) {
  return (
    <div
      onClick={onPress}
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
        cursor: onPress || arrow ? "pointer" : "default",
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>{sub}</div>}
      </div>
      {note && <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{note}</span>}
      {arrow && <span style={{ color: "var(--muted-foreground)", fontSize: 16 }}>›</span>}
    </div>
  );
}

function AdminField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <label style={{ fontSize: 12, color: "var(--muted-foreground)", fontWeight: 600 }}>{label}</label>
        {hint && <span style={{ fontSize: 11, color: "var(--muted-foreground)", opacity: 0.6 }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function PwInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label style={{ fontSize: 12, color: "var(--muted-foreground)", display: "block", marginBottom: 5 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          style={{ paddingInlineEnd: 40 }}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          style={{
            position: "absolute", insetInlineEnd: 10, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)",
            fontSize: 14, padding: 4,
          }}
        >
          {visible ? "🙈" : "👁️"}
        </button>
      </div>
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: on ? "var(--primary)" : "var(--border-strong)",
        position: "relative", cursor: "pointer",
        transition: "background 0.25s", flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", top: 3,
        left: on ? "calc(100% - 21px)" : 3,
        width: 18, height: 18, borderRadius: "50%",
        background: "white", transition: "left 0.25s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      }} />
    </div>
  );
}

