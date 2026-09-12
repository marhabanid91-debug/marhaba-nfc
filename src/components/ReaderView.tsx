import { useState } from "react";
import { useApp } from "../context/AppContext";
import { ActiveMode } from "../types";
import marhabaLogo from "../imports/2177178-removebg-preview__1_.png";

// Hardcoded so the link is always valid even before useAppSettings loads
const WA_ACCESSORY_LINK = "https://wa.me/966500816798?text=" + encodeURIComponent("أرغب في طلب اكسسوار لمنصة Marhaba NFC");

const modeColors: Record<ActiveMode, string> = {
  emergency: "#e53e3e",
  business: "#c9a84c",
  events: "#9b59b6",
};

function truncateName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 4) return `${parts[0]} ${parts[parts.length - 1]}`;
  return parts.slice(0, 2).join(" ") || fullName;
}

function downloadVCard(fields: {
  name?: string;
  phone?: string;
  email?: string;
  website?: string;
  company?: string;
  jobTitle?: string;
  note?: string;
}) {
  const fn = fields.name || "";
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${fn}`,
    `N:${fn};;;;`,
    fields.phone ? `TEL;TYPE=CELL:${fields.phone}` : "",
    fields.email ? `EMAIL:${fields.email}` : "",
    fields.website ? `URL:${fields.website}` : "",
    fields.company ? `ORG:${fields.company}` : "",
    fields.jobTitle ? `TITLE:${fields.jobTitle}` : "",
    fields.note ? `NOTE:${fields.note}` : "",
    "END:VCARD",
  ].filter(Boolean);

  const blob = new Blob([lines.join("\r\n")], { type: "text/vcard" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fn || "contact"}.vcf`;
  a.click();
  URL.revokeObjectURL(url);
}

function SaveContactBtn({ onClick, lang }: { onClick: () => void; lang: string }) {
  const [saved, setSaved] = useState(false);
  return (
    <button
      onClick={() => { onClick(); setSaved(true); setTimeout(() => setSaved(false), 2500); }}
      style={{
        width: "100%", padding: "13px", borderRadius: 12, marginTop: 12,
        background: saved ? "rgba(37,211,102,0.15)" : "var(--card)",
        border: `1px solid ${saved ? "#25D366" : "var(--border-color, rgba(255,255,255,0.1))"}`,
        color: saved ? "#25D366" : "var(--text-primary, var(--foreground))",
        fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        transition: "all 0.25s",
      }}
    >
      {saved ? "✓" : "👤"} {saved
        ? (lang === "ar" ? "تم الحفظ!" : "Saved!")
        : (lang === "ar" ? "حفظ جهة الاتصال" : "Save Contact")}
    </button>
  );
}

export default function ReaderView({ mode }: { mode: ActiveMode }) {
  const { identities, activeIdentityId, setScreen, lang } = useApp();
  const identity = identities.find((i) => i.id === activeIdentityId) || identities[0];
  const color = modeColors[mode];
  const appUrl = "https://marhaba.com";

  return (
    <div style={{ minHeight: "100%", background: "var(--background)" }}>
      {/* Header bar */}
      <div style={{
        padding: "12px 20px", display: "flex",
        justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid var(--border)",
      }}>
        <button onClick={() => setScreen("home")} style={{
          background: "none", border: "none", color: "var(--muted-foreground)",
          cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6,
          fontFamily: "inherit",
        }}>
          {lang === "ar" ? "→ رجوع" : "← Back"}
        </button>
        <img src={marhabaLogo} alt="مرحبا NFC" style={{ width: 40, height: "auto" }} />
        <div style={{
          padding: "4px 12px", borderRadius: 20,
          background: `${color}18`, border: `1px solid ${color}40`,
          color, fontSize: 10, fontWeight: 700, letterSpacing: 1,
        }}>
          {lang === "ar" ? "معاينة" : "PREVIEW"}
        </div>
      </div>

      <div style={{ padding: "0 20px 100px" }}>
        {mode === "emergency" && <EmergencyReader identity={identity} color={color} />}
        {mode === "business" && <BusinessReader identity={identity} color={color} />}
        {mode === "events" && <EventsReader identity={identity} color={color} />}

        {/* CTA — two buttons */}
        <div style={{
          marginTop: 32, padding: 24, borderRadius: 18,
          background: "var(--card)", border: "1px solid rgba(201,168,76,0.2)",
          textAlign: "center",
        }}>
          <img src={marhabaLogo} alt="مرحبا NFC" style={{ width: 72, height: "auto", margin: "0 auto 12px", display: "block" }} />
          <div className="gold-gradient" style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>
            {lang === "ar" ? "هل تريد إنشاء هويتك الذكية؟" : "Want to create your smart identity?"}
          </div>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 18, lineHeight: 1.6 }}>
            {lang === "ar" ? "تواصل معنا للحصول على الإكسسوار." : "Contact us to get your accessory."}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <a
              href={appUrl}
              style={{
                display: "block", padding: "13px", borderRadius: 12,
                background: "linear-gradient(135deg, #c9a84c, #d4af37)",
                color: "#09090f", fontWeight: 700, fontSize: 14,
                textDecoration: "none", textAlign: "center",
              }}
            >
              {lang === "ar" ? "إنشاء هويتك الذكية" : "Create Your Smart Identity"}
            </a>
            <a
              href={WA_ACCESSORY_LINK}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "13px", borderRadius: 12,
                background: "#25D366", color: "white",
                fontWeight: 700, fontSize: 14,
                textDecoration: "none", textAlign: "center",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              {lang === "ar" ? "طلب قطعتك" : "Request Your Accessory"}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function SOSButton({ contacts, lang }: { contacts: any[]; lang: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const handleSOS = () => {
    const firstVisible = contacts.find((c) => c.visible && c.phone);
    if (!firstVisible) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }
    setStatus("loading");
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
        const msg = encodeURIComponent(`🚨 SOS - طلب مساعدة طارئة\nالموقع الحالي: ${mapsUrl}`);
        const phone = firstVisible.phone.replace(/[^0-9+]/g, "");
        window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
        setStatus("idle");
      },
      () => {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    );
  };

  return (
    <button
      onClick={handleSOS}
      style={{
        width: "100%", padding: "14px", borderRadius: 12, marginTop: 16,
        background: status === "loading" ? "rgba(229,62,62,0.3)" : "var(--emergency)",
        border: "none", color: "white", fontWeight: 700, fontSize: 14,
        cursor: "pointer", fontFamily: "inherit",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        animation: status === "loading" ? "pulse 1s infinite" : "none",
      }}
    >
      🆘 {status === "loading"
        ? (lang === "ar" ? "جارٍ تحديد الموقع..." : "Getting location...")
        : status === "error"
        ? (lang === "ar" ? "لا توجد جهة طوارئ ظاهرة" : "No visible emergency contact")
        : (lang === "ar" ? "إرسال الموقع الحالي لجهات الطوارئ (SOS)" : "Send Location to Emergency Contacts (SOS)")}
    </button>
  );
}

function EmergencyReader({ identity, color }: { identity: any; color: string }) {
  const { lang } = useApp();
  const d = identity?.emergency;
  const noData = lang === "ar" ? "لا توجد بيانات حالياً" : "No data available";
  const vis = d?.visibility || {};
  const displayName = d?.name ? truncateName(d.name) : noData;
  const visibleContacts = d?.emergencyContacts?.filter((c: any) => c.visible !== false) || [];

  return (
    <div className="fade-in">
      <div style={{
        background: `linear-gradient(135deg, ${color}22, ${color}08)`,
        border: `1px solid ${color}30`, borderRadius: 18, padding: 24, margin: "20px 0", textAlign: "center",
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%", margin: "0 auto 14px",
          background: `${color}20`, border: `2px solid ${color}50`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36,
        }}>🚨</div>
        <h2 style={{ fontWeight: 800, fontSize: 22, margin: "0 0 4px" }}>{displayName}</h2>
        <div style={{ fontSize: 13, color, fontWeight: 600 }}>
          {lang === "ar" ? "بطاقة الطوارئ" : "Emergency Card"}
        </div>
        {identity?.serialNumber && (
          <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 6 }}>{identity.serialNumber}</div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {vis.bloodType !== false && d?.bloodType && (
          <InfoTile icon="🩸" label={lang === "ar" ? "فصيلة الدم" : "Blood Type"} value={d.bloodType} color={color} />
        )}
        {vis.birthDate !== false && d?.birthDate && (
          <InfoTile icon="🎂" label={lang === "ar" ? "تاريخ الميلاد" : "Date of Birth"} value={d.birthDate} color={color} />
        )}
      </div>

      {vis.conditions !== false && d?.conditions && (
        <InfoCard icon="🏥" label={lang === "ar" ? "الحالات الصحية" : "Medical Conditions"} value={d.conditions} />
      )}
      {vis.allergies !== false && d?.allergies && (
        <InfoCard icon="⚠️" label={lang === "ar" ? "الحساسية" : "Allergies"} value={d.allergies} />
      )}
      {vis.medications !== false && d?.medications && (
        <InfoCard icon="💊" label={lang === "ar" ? "الأدوية" : "Medications"} value={d.medications} />
      )}
      {vis.firstAidInstructions !== false && d?.firstAidInstructions && (
        <InfoCard icon="🩺" label={lang === "ar" ? "الإسعافات الأولية" : "First Aid"} value={d.firstAidInstructions} />
      )}

      {visibleContacts.length > 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 12 }}>
            📞 {lang === "ar" ? "جهات اتصال الطوارئ" : "Emergency Contacts"}
          </div>
          {visibleContacts.map((c: any, i: number) => (
            <div key={i} style={{ marginBottom: i < visibleContacts.length - 1 ? 12 : 0 }}>
              <div style={{ fontWeight: 600 }}>{c.name || noData}</div>
              <a href={`tel:${c.phone}`} style={{ color, fontSize: 15, fontWeight: 700, textDecoration: "none", display: "block" }}>{c.phone}</a>
              {c.relationship && <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{c.relationship}</div>}
            </div>
          ))}
        </div>
      )}

      {!d?.name && !d?.bloodType && (
        <div style={{ textAlign: "center", padding: "24px", color: "var(--muted-foreground)" }}>{noData}</div>
      )}

      <SOSButton contacts={d?.emergencyContacts || []} lang={lang} />

      {/* Save Contact */}
      {d?.name && (
        <SaveContactBtn
          lang={lang}
          onClick={() => downloadVCard({
            name: d.name,
            phone: visibleContacts[0]?.phone,
            note: [d.conditions, d.allergies, d.medications].filter(Boolean).join(" | "),
          })}
        />
      )}
    </div>
  );
}

function BusinessReader({ identity, color }: { identity: any; color: string }) {
  const { lang } = useApp();
  const d = identity?.business;
  const noData = lang === "ar" ? "لا توجد بيانات حالياً" : "No data available";

  return (
    <div className="fade-in">
      <div style={{
        background: `linear-gradient(135deg, ${color}22, ${color}08)`,
        border: `1px solid ${color}30`, borderRadius: 18, padding: 24, margin: "20px 0", textAlign: "center",
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%", margin: "0 auto 14px",
          background: `${color}20`, border: `2px solid ${color}50`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36,
        }}>💼</div>
        <h2 style={{ fontWeight: 800, fontSize: 22, margin: "0 0 4px" }}>{d?.name || noData}</h2>
        {d?.jobTitle && <div style={{ fontSize: 14, color, fontWeight: 600, marginBottom: 4 }}>{d.jobTitle}</div>}
        {d?.company && <div style={{ fontSize: 13, color: "var(--muted-foreground)" }}>{d.company}</div>}
      </div>

      {d?.bio && <InfoCard icon="📝" label={lang === "ar" ? "نبذة" : "About"} value={d.bio} />}

      {(d?.phone || d?.email || d?.website || d?.location) && (
        <div className="card" style={{ marginTop: 12 }}>
          {d?.phone && <ContactRow icon="📞" value={d.phone} href={`tel:${d.phone}`} />}
          {d?.email && <ContactRow icon="✉️" value={d.email} href={`mailto:${d.email}`} />}
          {d?.website && <ContactRow icon="🌐" value={d.website} href={d.website} />}
          {d?.location && <ContactRow icon="📍" value={d.location} />}
        </div>
      )}

      {!d?.name && !d?.phone && (
        <div style={{ textAlign: "center", padding: 24, color: "var(--muted-foreground)" }}>{noData}</div>
      )}

      {d?.socialLinks && Object.entries(d.socialLinks).filter(([, v]) => v).length > 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 12 }}>
            {lang === "ar" ? "وسائل التواصل الاجتماعي" : "Social Media"}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(d.socialLinks).filter(([, v]) => v).map(([k, v]) => (
              <a key={k} href={String(v)} target="_blank" rel="noopener noreferrer" style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 12,
                background: `${color}12`, border: `1px solid ${color}30`, color,
                textDecoration: "none", fontWeight: 600,
              }}>
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Save Contact */}
      {d?.name && (
        <SaveContactBtn
          lang={lang}
          onClick={() => downloadVCard({
            name: d.name,
            phone: d.phone,
            email: d.email,
            website: d.website,
            company: d.company,
            jobTitle: d.jobTitle,
          })}
        />
      )}
    </div>
  );
}

function EventsReader({ identity, color }: { identity: any; color: string }) {
  const { lang } = useApp();
  const d = identity?.events;
  const noData = lang === "ar" ? "لا توجد بيانات حالياً" : "No data available";

  const statusLabels: Record<string, { ar: string; en: string }> = {
    sponsor: { ar: "رعاية", en: "Sponsor" },
    participant: { ar: "مشاركة", en: "Participant" },
    visitor: { ar: "زائر", en: "Visitor" },
  };

  return (
    <div className="fade-in">
      <div style={{
        background: `linear-gradient(135deg, ${color}22, ${color}08)`,
        border: `1px solid ${color}30`, borderRadius: 18, padding: 24, margin: "20px 0", textAlign: "center",
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%", margin: "0 auto 14px",
          background: `${color}20`, border: `2px solid ${color}50`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36,
        }}>🎪</div>
        <h2 style={{ fontWeight: 800, fontSize: 22, margin: "0 0 4px" }}>{d?.name || noData}</h2>
        {d?.status && (
          <div style={{
            display: "inline-block", padding: "4px 14px", borderRadius: 20, marginTop: 8,
            background: `${color}20`, border: `1px solid ${color}40`, color, fontSize: 13, fontWeight: 700,
          }}>
            {lang === "ar" ? statusLabels[d.status]?.ar : statusLabels[d.status]?.en}
          </div>
        )}
      </div>

      {d?.bio && <InfoCard icon="📝" label={lang === "ar" ? "نبذة" : "About"} value={d.bio} />}

      {(d?.eventName || d?.eventLocation) && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 8 }}>
            🎪 {lang === "ar" ? "الفعالية" : "Event"}
          </div>
          {d?.eventName && <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.eventName}</div>}
          {d?.eventLocation && <div style={{ fontSize: 13, color: "var(--muted-foreground)" }}>📍 {d.eventLocation}</div>}
          {d?.ticketLink && (
            <a href={d.ticketLink} style={{
              display: "inline-block", marginTop: 10, padding: "7px 16px", borderRadius: 10,
              background: `${color}18`, border: `1px solid ${color}30`, color, fontSize: 13,
              textDecoration: "none", fontWeight: 600,
            }}>
              🎟️ {lang === "ar" ? "التذكرة" : "Ticket"}
            </a>
          )}
        </div>
      )}

      {!d?.name && !d?.eventName && (
        <div style={{ textAlign: "center", padding: 24, color: "var(--muted-foreground)" }}>{noData}</div>
      )}

      {d?.socialLinks && Object.entries(d.socialLinks).filter(([, v]) => v).length > 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(d.socialLinks).filter(([, v]) => v).map(([k, v]) => (
              <a key={k} href={String(v)} target="_blank" rel="noopener noreferrer" style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 12,
                background: `${color}12`, border: `1px solid ${color}30`, color,
                textDecoration: "none", fontWeight: 600,
              }}>
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Save Contact */}
      {d?.name && (
        <SaveContactBtn
          lang={lang}
          onClick={() => downloadVCard({
            name: d.name,
            note: [d.eventName, d.eventLocation, d.status].filter(Boolean).join(" — "),
          })}
        />
      )}
    </div>
  );
}

function InfoTile({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div style={{
      background: "var(--card-elevated)", borderRadius: 14, padding: "14px",
      border: `1px solid ${color}20`, textAlign: "center",
    }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 16, color }}>{value}</div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 6 }}>{icon} {label}</div>
      <div style={{ fontSize: 14, lineHeight: 1.6 }}>{value}</div>
    </div>
  );
}

function ContactRow({ icon, value, href }: { icon: string; value: string; href?: string }) {
  const content = (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 14 }}>{value}</span>
    </div>
  );
  return href ? (
    <a href={href} style={{ textDecoration: "none", color: "var(--foreground)", display: "block" }}>{content}</a>
  ) : content;
}

