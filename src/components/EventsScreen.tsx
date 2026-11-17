import StatsBox from "./StatsBox";
import FlowHeader, { useFlow } from "./FlowHeader";
import { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { EventStatus, SocialLinks, LocationItem } from "../types";
import { LocationFields, cleanLocations } from "./LocationFields";
import { saveEventsData, uploadIdentityPhoto } from "../lib/db";
import { loadMyGifts, MyGift } from "../lib/gift";

const linkFields: { key: keyof SocialLinks; label: string; icon: string; placeholder: string }[] = [
  { key: "marhaba",  label: "رابط مرحباً",     icon: "👋", placeholder: "https://marhabanid.com/…" },
  { key: "linkedin", label: "لينكدإن",         icon: "💼", placeholder: "https://linkedin.com/in/…" },
  { key: "works",    label: "معرض الأعمال",    icon: "🖼️", placeholder: "رابط معرض الأعمال: https://…" },
  { key: "catalog",  label: "الكتالوج",        icon: "📖", placeholder: "رابط الكتالوج: https://…" },
];

// يستخرج رقم الهدية GIFT-… سواء كُتب الرقم أو لُصق الرابط كاملاً
export function parseGiftSerial(raw: string): string {
  const m = (raw || "").match(/GIFT-[A-Z0-9-]+/i);
  return m ? m[0].toUpperCase() : "";
}

function normaliseUrl(raw: string, prefix: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `${prefix}${v.replace(/^@/, "")}`;
}

export default function EventsScreen() {
  const { t, lang, identities, setIdentities, activeIdentityId, setScreen, supabaseUser } = useApp();
  const { creating, after, finish } = useFlow();
  const identity = identities.find((i) => i.id === activeIdentityId) || identities[0];
  const data = identity?.events;

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>(data?.photo || "");
  const [uploadError, setUploadError] = useState("");

  const [form, setForm] = useState({
    name: data?.name || "",
    photo: data?.photo || "",
    bio: data?.bio || "",
    eventName: data?.eventName || "",
    eventLocation: data?.eventLocation || "",
    status: data?.status || ("" as EventStatus),
    ticketLink: data?.ticketLink || "",
  });
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(data?.socialLinks || {});
  const [locations, setLocations] = useState<LocationItem[]>(data?.locations || []);
  const [saved, setSaved] = useState(false);
  const [myGifts, setMyGifts] = useState<MyGift[]>([]);
  useEffect(() => { loadMyGifts().then(setMyGifts); }, []);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setPhotoPreview(localUrl);
    setUploadError("");

    if (supabaseUser && identity?.id) {
      setPhotoUploading(true);
      try {
        const url = await uploadIdentityPhoto(supabaseUser.id, identity.id, "events", file);
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
      setForm((f) => ({ ...f, photo: localUrl }));
    }
    e.target.value = "";
  };

  const save = () => {
    // نُبقي البيانات الاجتماعية القديمة مخزّنة (لا تُعرض) حتى لا تضيع
    const normLinks: SocialLinks = { ...(data?.socialLinks || {}) };
    for (const p of linkFields) {
      delete (normLinks as any)[p.key];
      const raw = (socialLinks as any)[p.key] || "";
      if (raw) (normLinks as any)[p.key] = normaliseUrl(raw, "https://");
    }
    const gs = parseGiftSerial(socialLinks.giftSerial || "");
    if (gs) normLinks.giftSerial = gs; else delete normLinks.giftSerial;
    const sp = (socialLinks.sponsorName || "").trim();
    if (sp) normLinks.sponsorName = sp; else delete normLinks.sponsorName;
    if (socialLinks.eventDate) normLinks.eventDate = socialLinks.eventDate; else delete normLinks.eventDate;
    const updatedEvents = { ...form, socialLinks: normLinks, locations: cleanLocations(locations) };
    setIdentities(identities.map((id) =>
      id.id === identity?.id ? { ...id, events: updatedEvents } : id
    ));
    if (identity?.id && supabaseUser) {
      saveEventsData(identity.id, updatedEvents).catch(() => {});
    }
    setSocialLinks(normLinks);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const identityName = identity?.emergency.name || identity?.business.name || identity?.events.name || (lang === "ar" ? "هوية جديدة" : "New Identity");

  const statusOptions: { value: EventStatus; labelAr: string; labelEn: string }[] = [
    { value: "sponsor",     labelAr: "رعاية",  labelEn: "Sponsor" },
    { value: "participant", labelAr: "مشاركة", labelEn: "Participant" },
    { value: "visitor",     labelAr: "زائر",   labelEn: "Visitor" },
  ];

  return (
    <div className="screen fade-in">
      <div style={{ padding: "24px 20px 0" }}>
        <FlowHeader current="events" />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(155,89,182,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>🎪</div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{t("eventsData")}</h1>
            <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: 0 }}>{identityName}</p>
          </div>
        </div>

        {identity?.id && <StatsBox kind="events" target={identity.id} />}

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
                background: "rgba(155,89,182,0.12)",
                border: "1.5px dashed rgba(155,89,182,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, flexShrink: 0, overflow: "hidden",
              }}>
                {photoUploading ? (
                  <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid rgba(155,89,182,0.3)", borderTopColor: "#9b59b6", animation: "spin 0.7s linear infinite" }} />
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
            {uploadError && <p style={{ color: "var(--emergency)", fontSize: 12, marginTop: 6 }}>⚠ {uploadError}</p>}
          </div>

          <F label={t("name")} value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder={t("enterName")} />
          <F label={t("bio")} value={form.bio} onChange={(v) => setForm({ ...form, bio: v })} placeholder={t("enterBio")} multiline optional />
          <F label={t("eventName")} value={form.eventName} onChange={(v) => setForm({ ...form, eventName: v })} placeholder={t("enterEventName")} />
          <F label={t("eventLocation")} value={form.eventLocation} onChange={(v) => setForm({ ...form, eventLocation: v })} placeholder={t("enterEventLocation")} optional />

          {/* Status chips */}
          <div>
            <label style={{ fontSize: 13, color: "var(--muted-foreground)", display: "block", marginBottom: 8 }}>{t("eventStatus")}</label>
            <div style={{ display: "flex", gap: 8 }}>
              {statusOptions.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setForm({ ...form, status: form.status === s.value ? "" : s.value })}
                  style={{
                    flex: 1, padding: "10px 4px", borderRadius: 10,
                    border: `1px solid ${form.status === s.value ? "rgba(155,89,182,0.5)" : "var(--border-strong)"}`,
                    background: form.status === s.value ? "rgba(155,89,182,0.15)" : "var(--card-elevated)",
                    color: form.status === s.value ? "var(--events)" : "var(--muted-foreground)",
                    fontSize: 13, fontWeight: form.status === s.value ? 600 : 400,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {lang === "ar" ? s.labelAr : s.labelEn}
                </button>
              ))}
            </div>
          </div>

          <F label={t("ticketLink")} value={form.ticketLink} onChange={(v) => setForm({ ...form, ticketLink: v })} placeholder="https://tickets.com/event" type="url" optional />

          {/* المواقع (حتى 3) */}
          <LocationFields value={locations} onChange={setLocations} />

          {/* موعد الفعالية والراعي */}
          <div>
            <label style={{ fontSize: 13, color: "var(--muted-foreground)", display: "block", marginBottom: 6 }}>
              📅 {lang === "ar" ? "تاريخ الفعالية" : "Event date"} <span style={{ fontSize: 11, opacity: 0.6 }}>— {lang === "ar" ? "اختياري، يُظهر زر «أضف للتقويم»" : "Optional"}</span>
            </label>
            <input type="date" value={socialLinks.eventDate || ""} onChange={(e) => setSocialLinks({ ...socialLinks, eventDate: e.target.value })} style={{ direction: "ltr" }} />
          </div>
          <F label={lang === "ar" ? "برعاية" : "Sponsored by"} value={socialLinks.sponsorName || ""} onChange={(v) => setSocialLinks({ ...socialLinks, sponsorName: v })} placeholder={lang === "ar" ? "اسم الراعي (يظهر أعلى البطاقة)" : "Sponsor name"} optional />

          {/* الروابط */}
          <div>
            <label style={{ fontSize: 13, color: "var(--muted-foreground)", display: "block", marginBottom: 4 }}>
              {lang === "ar" ? "الروابط" : "Links"} <span style={{ fontSize: 11, opacity: 0.6 }}>— {lang === "ar" ? "اختياري" : "Optional"}</span>
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {linkFields.map((p) => (
                <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 28, textAlign: "center", fontSize: 18, flexShrink: 0 }}>{p.icon}</span>
                  <input
                    type="url"
                    inputMode="url"
                    value={(socialLinks as any)[p.key] || ""}
                    onChange={(e) => setSocialLinks({ ...socialLinks, [p.key]: e.target.value })}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v) setSocialLinks((prev) => ({ ...prev, [p.key]: normaliseUrl(v, "https://") }));
                    }}
                    placeholder={`${p.label}: ${p.placeholder}`}
                    style={{ flex: 1, direction: "ltr" }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* صفحة السحوبات والعروض */}
          <div>
            <label style={{ fontSize: 13, color: "var(--muted-foreground)", display: "block", marginBottom: 4 }}>
              🎉 {lang === "ar" ? "صفحة السحوبات والعروض" : "Draws & offers page"} <span style={{ fontSize: 11, opacity: 0.6 }}>— {lang === "ar" ? "اختياري" : "Optional"}</span>
            </label>
            <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 8 }}>
              {lang === "ar" ? "تظهر في بطاقة الفعالية بكل أزرارها: المشاركة والتواصل الفوري. وأي تعديل عليها يظهر هنا تلقائياً." : "Shown on the event card with all its buttons."}
            </p>
            {myGifts.length > 0 && (
              <select
                value={myGifts.some((g) => g.serial.toUpperCase() === (socialLinks.giftSerial || "").toUpperCase()) ? socialLinks.giftSerial : ""}
                onChange={(e) => setSocialLinks({ ...socialLinks, giftSerial: e.target.value })}
                style={{ width: "100%", marginBottom: 8 }}
              >
                <option value="">{lang === "ar" ? "— اختر من هداياك —" : "— Choose from your gifts —"}</option>
                {myGifts.map((g) => (
                  <option key={g.serial} value={g.serial}>{g.gift_title ? `${g.gift_title} (${g.serial})` : g.serial}</option>
                ))}
              </select>
            )}
            <input
              value={socialLinks.giftSerial || ""}
              onChange={(e) => setSocialLinks({ ...socialLinks, giftSerial: e.target.value })}
              placeholder={lang === "ar" ? "أو الصق رقم الهدية / رابطها: GIFT-…" : "Or paste gift code / link: GIFT-…"}
              style={{ direction: "ltr" }}
            />
          </div>
        </div>

        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10, paddingBottom: 20 }}>
          <button className="btn-primary" onClick={() => { save(); after("done"); }}>{creating ? (lang === "ar" ? "حفظ وإنهاء ✓" : "Save & finish ✓") : (lang === "ar" ? "حفظ ورجوع" : "Save & back")}</button>
          {creating && <button className="btn-ghost" onClick={finish}>{lang === "ar" ? "تخطّي وإنهاء" : "Skip & finish"}</button>}
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
