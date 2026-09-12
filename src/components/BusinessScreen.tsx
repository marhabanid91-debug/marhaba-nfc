import { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { SocialLinks } from "../types";
import { saveBusinessData, uploadIdentityPhoto } from "../lib/db";

// Platform config: prefix used to construct full URL from a handle/path
const socialPlatforms: { key: keyof SocialLinks; label: string; icon: string; prefix: string; placeholder: string }[] = [
  { key: "instagram", label: "Instagram", icon: "📸", prefix: "https://instagram.com/", placeholder: "https://instagram.com/username" },
  { key: "linkedin",  label: "LinkedIn",  icon: "💼", prefix: "https://linkedin.com/in/", placeholder: "https://linkedin.com/in/username" },
  { key: "twitter",   label: "X (Twitter)", icon: "🐦", prefix: "https://x.com/", placeholder: "https://x.com/username" },
  { key: "facebook",  label: "Facebook", icon: "👥", prefix: "https://facebook.com/", placeholder: "https://facebook.com/username" },
  { key: "youtube",   label: "YouTube",  icon: "▶️", prefix: "https://youtube.com/@", placeholder: "https://youtube.com/@channel" },
  { key: "snapchat",  label: "Snapchat", icon: "👻", prefix: "https://snapchat.com/add/", placeholder: "https://snapchat.com/add/username" },
  { key: "whatsapp",  label: "WhatsApp", icon: "💬", prefix: "https://wa.me/", placeholder: "https://wa.me/966500000000" },
  { key: "website",   label: "Website",  icon: "🌐", prefix: "https://", placeholder: "https://yoursite.com" },
];

// Normalise: if user typed a bare handle without http, prepend the platform prefix.
function normaliseUrl(raw: string, prefix: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `${prefix}${v.replace(/^@/, "")}`;
}

export default function BusinessScreen() {
  const { t, lang, identities, setIdentities, activeIdentityId, setScreen, supabaseUser } = useApp();
  const identity = identities.find((i) => i.id === activeIdentityId) || identities[0];
  const data = identity?.business;

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>(data?.photo || "");

  const [form, setForm] = useState({
    name: data?.name || "",
    photo: data?.photo || "",
    jobTitle: data?.jobTitle || "",
    company: data?.company || "",
    bio: data?.bio || "",
    phone: data?.phone || "",
    email: data?.email || "",
    website: data?.website || "",
    location: data?.location || "",
  });
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(data?.socialLinks || {});
  const [saved, setSaved] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPhotoPreview(localUrl);
    setUploadError("");

    if (supabaseUser && identity?.id) {
      setPhotoUploading(true);
      try {
        const url = await uploadIdentityPhoto(supabaseUser.id, identity.id, "business", file);
        if (url) {
          setForm((f) => ({ ...f, photo: url }));
          setPhotoPreview(url);
        } else {
          setUploadError(lang === "ar" ? "فشل رفع الصورة" : "Photo upload failed");
        }
      } finally {
        setPhotoUploading(false);
      }
    } else {
      // Offline: keep blob URL as placeholder (won't persist across sessions)
      setForm((f) => ({ ...f, photo: localUrl }));
    }
    e.target.value = "";
  };

  const save = () => {
    // Normalise all social URLs before saving
    const normLinks: SocialLinks = {};
    for (const p of socialPlatforms) {
      const raw = (socialLinks as any)[p.key] || "";
      if (raw) (normLinks as any)[p.key] = normaliseUrl(raw, p.prefix);
    }
    const updatedBusiness = { ...form, socialLinks: normLinks };
    setIdentities(identities.map((id) =>
      id.id === identity?.id ? { ...id, business: updatedBusiness } : id
    ));
    if (identity?.id && supabaseUser) {
      saveBusinessData(identity.id, updatedBusiness).catch(() => {});
    }
    setSocialLinks(normLinks);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const identityName = identity?.emergency.name || identity?.business.name || (lang === "ar" ? "هوية جديدة" : "New Identity");

  return (
    <div className="screen fade-in">
      <div style={{ padding: "24px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(201,168,76,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>💼</div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{t("businessData")}</h1>
            <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: 0 }}>{identityName}</p>
          </div>
        </div>

        {saved && (
          <div style={{
            background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: 10, padding: "10px 14px", color: "#22c55e", fontSize: 13, marginBottom: 16,
          }}>
            ✓ {lang === "ar" ? "تم الحفظ بنجاح" : "Saved successfully"}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Photo upload */}
          <div>
            <label style={{ fontSize: 13, color: "var(--muted-foreground)", display: "block", marginBottom: 6 }}>{t("photo")}</label>
            <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
            <div
              onClick={() => photoInputRef.current?.click()}
              style={{
                display: "flex", alignItems: "center", gap: 14, padding: 14,
                background: "var(--card-elevated)", borderRadius: 12, border: "1px solid var(--border-strong)",
                cursor: photoUploading ? "wait" : "pointer",
              }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "rgba(201,168,76,0.12)",
                border: "1.5px dashed rgba(201,168,76,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, flexShrink: 0, overflow: "hidden",
              }}>
                {photoUploading ? (
                  <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid rgba(201,168,76,0.3)", borderTopColor: "#c9a84c", animation: "spin 0.7s linear infinite" }} />
                ) : photoPreview ? (
                  <img src={photoPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : "👤"}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {photoUploading
                    ? (lang === "ar" ? "جارٍ الرفع..." : "Uploading…")
                    : photoPreview
                      ? (lang === "ar" ? "تغيير الصورة" : "Change photo")
                      : (lang === "ar" ? "اختر صورة" : "Choose photo")}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
                  {lang === "ar" ? "JPG أو PNG — حجم أقصى 5MB" : "JPG or PNG — max 5 MB"}
                </div>
              </div>
            </div>
            {uploadError && (
              <p style={{ color: "var(--emergency)", fontSize: 12, marginTop: 6 }}>⚠ {uploadError}</p>
            )}
          </div>

          <F label={t("name")} value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder={t("enterName")} />
          <F label={t("jobTitle")} value={form.jobTitle} onChange={(v) => setForm({ ...form, jobTitle: v })} placeholder={t("enterJobTitle")} />
          <F label={t("company")} value={form.company} onChange={(v) => setForm({ ...form, company: v })} placeholder={t("enterCompany")} />
          <F label={t("bio")} value={form.bio} onChange={(v) => setForm({ ...form, bio: v })} placeholder={t("enterBio")} multiline optional />
          <F label={t("phone")} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder={t("enterPhone")} type="tel" optional />
          <F label={t("email")} value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder={t("enterEmail")} type="email" optional />
          <F label={t("website")} value={form.website} onChange={(v) => setForm({ ...form, website: v })} placeholder="https://yoursite.com" type="url" optional />
          <F label={t("location")} value={form.location} onChange={(v) => setForm({ ...form, location: v })} placeholder={t("enterLocation")} optional />

          {/* Social links — type=url with smart prefix */}
          <div>
            <label style={{ fontSize: 13, color: "var(--muted-foreground)", display: "block", marginBottom: 4 }}>
              {t("socialLinks")} <span style={{ fontSize: 11, opacity: 0.6 }}>— {lang === "ar" ? "اختياري" : "Optional"}</span>
            </label>
            <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 10 }}>
              {lang === "ar" ? "أدخل الرابط كاملاً أو اسم المستخدم فقط" : "Enter the full URL or just the username"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {socialPlatforms.map((p) => (
                <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 24, textAlign: "center", fontSize: 16, flexShrink: 0 }}>{p.icon}</span>
                  <input
                    type="url"
                    inputMode="url"
                    value={(socialLinks as any)[p.key] || ""}
                    onChange={(e) => setSocialLinks({ ...socialLinks, [p.key]: e.target.value })}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v) setSocialLinks((prev) => ({ ...prev, [p.key]: normaliseUrl(v, p.prefix) }));
                    }}
                    placeholder={p.placeholder}
                    style={{ flex: 1, direction: "ltr" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10, paddingBottom: 20 }}>
          <button className="btn-primary" onClick={() => { save(); setScreen("events"); }}>{t("saveAndContinue")}</button>
          <button className="btn-ghost" onClick={() => setScreen("events")}>{t("skipNow")}</button>
        </div>
      </div>
    </div>
  );
}

function F({ label, value, onChange, placeholder, multiline, optional, type }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; optional?: boolean; type?: string;
}) {
  const { lang } = useApp();
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <label style={{ fontSize: 13, color: "var(--muted-foreground)" }}>{label}</label>
        {optional && <span style={{ fontSize: 11, color: "var(--muted-foreground)", opacity: 0.6 }}>{lang === "ar" ? "اختياري" : "Optional"}</span>}
      </div>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ resize: "none" }} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type || "text"} />
      )}
    </div>
  );
}

