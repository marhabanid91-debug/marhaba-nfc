import { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { EmergencyContact, EmergencyVisibility } from "../types";
import { saveEmergencyData, uploadIdentityPhoto } from "../lib/db";

const MAX_CONTACTS = 3;

export default function EmergencyScreen() {
  const { t, lang, identities, setIdentities, activeIdentityId, setScreen, disclaimerAcknowledged, setDisclaimerAcknowledged, supabaseUser } = useApp();
  const identity = identities.find((i) => i.id === activeIdentityId) || identities[0];
  const data = identity?.emergency;

  const [form, setForm] = useState({
    name: data?.name || "",
    photo: data?.photo || "",
    birthDate: data?.birthDate || "",
    bloodType: data?.bloodType || "",
    conditions: data?.conditions || "",
    allergies: data?.allergies || "",
    medications: data?.medications || "",
    firstAidInstructions: data?.firstAidInstructions || "",
  });
  const [visibility, setVisibility] = useState<EmergencyVisibility>(
    data?.visibility || {
      birthDate: true, bloodType: true, conditions: true,
      allergies: true, medications: true, firstAidInstructions: true,
    }
  );
  const [contacts, setContacts] = useState<EmergencyContact[]>(
    (data?.emergencyContacts || []).map((c) => ({ ...c, visible: c.visible ?? true }))
  );
  const [saved, setSaved] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>(data?.photo || "");
  const [uploadError, setUploadError] = useState("");

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setPhotoPreview(localUrl);
    setUploadError("");

    if (supabaseUser && identity?.id) {
      setPhotoUploading(true);
      try {
        const url = await uploadIdentityPhoto(supabaseUser.id, identity.id, "emergency", file);
        if (url) {
          setForm((f) => ({ ...f, photo: url }));
          setPhotoPreview(url);
        } else {
          setUploadError(lang === "ar" ? "فشل رفع الصورة، تحقق من إعدادات التخزين." : "Photo upload failed — check Storage settings.");
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
    const updatedEmergency = { ...form, emergencyContacts: contacts, visibility };
    setIdentities(identities.map((id) =>
      id.id === identity?.id
        ? { ...id, emergency: updatedEmergency }
        : id
    ));
    if (identity?.id && supabaseUser) {
      saveEmergencyData(identity.id, updatedEmergency).catch(() => {});
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveAndContinue = () => { save(); setScreen("business"); };

  const addContact = () => {
    if (contacts.length >= MAX_CONTACTS) return;
    setContacts([...contacts, { name: "", phone: "", relationship: "", visible: true }]);
  };

  const updateContact = (i: number, field: keyof EmergencyContact, value: string | boolean) => {
    setContacts(contacts.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  };

  const removeContact = (i: number) => setContacts(contacts.filter((_, idx) => idx !== i));

  const toggleVisibility = (key: keyof EmergencyVisibility) => {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const identityName = identity?.emergency.name || identity?.business.name || (lang === "ar" ? "هوية جديدة" : "New Identity");

  return (
    <div className="screen fade-in">
      <div style={{ padding: "24px 20px 0" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(229,62,62,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>🚨</div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{t("emergencyData")}</h1>
            <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: 0 }}>{identityName}</p>
          </div>
        </div>

        {/* Disclaimer banner */}
        {!disclaimerAcknowledged && (
          <div style={{
            background: "rgba(229,62,62,0.08)",
            border: "1px solid rgba(229,62,62,0.25)",
            borderRadius: 12, padding: "14px 16px",
            marginBottom: 16,
          }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{t("disclaimerTitle")}</div>
                <p style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.7, margin: "0 0 10px" }}>
                  {t("disclaimerText")}
                </p>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button
                    onClick={() => setDisclaimerAcknowledged(true)}
                    style={{
                      padding: "6px 14px", borderRadius: 8,
                      background: "var(--emergency)", border: "none",
                      color: "white", fontSize: 12, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    {t("disclaimerAck")}
                  </button>
                  <button
                    onClick={() => setScreen("privacy-policy")}
                    style={{
                      background: "none", border: "none", color: "var(--primary)",
                      fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                      textDecoration: "underline",
                    }}
                  >
                    {t("disclaimerLink")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {saved && (
          <div style={{
            background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: 10, padding: "10px 14px", color: "#22c55e", fontSize: 13, marginBottom: 16,
          }}>
            ✓ {lang === "ar" ? "تم الحفظ" : "Saved successfully"}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Photo upload */}
          <div>
            <label style={{ fontSize: 13, color: "var(--muted-foreground)", display: "block", marginBottom: 6 }}>{t("photo")}</label>
            <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
            <div
              onClick={() => !photoUploading && photoInputRef.current?.click()}
              style={{
                display: "flex", alignItems: "center", gap: 14, padding: 14,
                background: "var(--card-elevated)", borderRadius: 12, border: "1px solid var(--border-strong)",
                cursor: photoUploading ? "wait" : "pointer",
              }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "rgba(229,62,62,0.12)",
                border: "1.5px dashed rgba(229,62,62,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, flexShrink: 0, overflow: "hidden",
              }}>
                {photoUploading ? (
                  <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid rgba(229,62,62,0.3)", borderTopColor: "var(--emergency)", animation: "spin 0.7s linear infinite" }} />
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

          {/* Name — always visible, no toggle */}
          <div>
            <label style={{ fontSize: 13, color: "var(--muted-foreground)", display: "block", marginBottom: 6 }}>{t("name")}</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("enterName")} />
            <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>
              {lang === "ar"
                ? "يُعرض الاسم الأول والأخير فقط في واجهة القارئ"
                : "Only first and last name shown in reader view"}
            </p>
          </div>

          {/* Date of birth with visibility toggle */}
          <FieldWithToggle
            label={t("birthDate")}
            visible={visibility.birthDate}
            onToggle={() => toggleVisibility("birthDate")}
          >
            <input
              type="date"
              value={form.birthDate}
              onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
              style={{ colorScheme: "inherit" }}
            />
          </FieldWithToggle>

          {/* Blood type */}
          <FieldWithToggle
            label={t("bloodType")}
            visible={visibility.bloodType}
            onToggle={() => toggleVisibility("bloodType")}
          >
            <select value={form.bloodType} onChange={(e) => setForm({ ...form, bloodType: e.target.value })}>
              <option value="">{t("selectBloodType")}</option>
              {bloodTypes.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
            </select>
          </FieldWithToggle>

          <FieldWithToggle label={t("conditions")} visible={visibility.conditions} onToggle={() => toggleVisibility("conditions")}>
            <textarea value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} placeholder={t("enterConditions")} rows={2} style={{ resize: "none" }} />
          </FieldWithToggle>

          <FieldWithToggle label={t("allergies")} visible={visibility.allergies} onToggle={() => toggleVisibility("allergies")} optional>
            <textarea value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} placeholder={t("enterAllergies")} rows={2} style={{ resize: "none" }} />
          </FieldWithToggle>

          <FieldWithToggle label={t("medications")} visible={visibility.medications} onToggle={() => toggleVisibility("medications")} optional>
            <textarea value={form.medications} onChange={(e) => setForm({ ...form, medications: e.target.value })} placeholder={t("enterMedications")} rows={2} style={{ resize: "none" }} />
          </FieldWithToggle>

          <FieldWithToggle label={t("firstAidInstructions")} visible={visibility.firstAidInstructions} onToggle={() => toggleVisibility("firstAidInstructions")} optional>
            <textarea value={form.firstAidInstructions} onChange={(e) => setForm({ ...form, firstAidInstructions: e.target.value })} placeholder={t("enterFirstAid")} rows={2} style={{ resize: "none" }} />
          </FieldWithToggle>

          {/* Emergency contacts */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <label style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
                {t("emergencyContacts")} ({contacts.length}/{MAX_CONTACTS})
              </label>
              <button
                onClick={addContact}
                disabled={contacts.length >= MAX_CONTACTS}
                style={{
                  padding: "4px 12px", borderRadius: 8, fontSize: 12,
                  border: `1px solid ${contacts.length >= MAX_CONTACTS ? "var(--border-strong)" : "var(--primary)"}`,
                  background: contacts.length >= MAX_CONTACTS ? "transparent" : "rgba(201,168,76,0.12)",
                  color: contacts.length >= MAX_CONTACTS ? "var(--muted-foreground)" : "var(--primary)",
                  cursor: contacts.length >= MAX_CONTACTS ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                + {t("addContact")}
              </button>
            </div>
            {contacts.length >= MAX_CONTACTS && (
              <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 8 }}>
                ⓘ {t("contactLimitReached")}
              </p>
            )}
            {contacts.map((c, i) => (
              <div key={i} className="card-elevated" style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--muted-foreground)" }}>
                      {lang === "ar" ? `جهة ${i + 1}` : `Contact ${i + 1}`}
                    </span>
                    <SmallToggle on={c.visible} onToggle={() => updateContact(i, "visible", !c.visible)} />
                  </div>
                  <button onClick={() => removeContact(i)} style={{
                    background: "rgba(229,62,62,0.1)", border: "1px solid rgba(229,62,62,0.2)",
                    borderRadius: 6, color: "var(--emergency)", cursor: "pointer",
                    fontSize: 11, padding: "3px 8px", fontFamily: "inherit",
                  }}>
                    {lang === "ar" ? "حذف" : "Remove"}
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <input value={c.name} onChange={(e) => updateContact(i, "name", e.target.value)} placeholder={t("contactName")} />
                  <input value={c.phone} onChange={(e) => updateContact(i, "phone", e.target.value)} placeholder={t("contactPhone")} type="tel" />
                  <input value={c.relationship} onChange={(e) => updateContact(i, "relationship", e.target.value)} placeholder={t("contactRelationship")} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10, paddingBottom: 20 }}>
          <button className="btn-primary" onClick={saveAndContinue}>{t("saveAndContinue")}</button>
          <button className="btn-ghost" onClick={() => setScreen("business")}>{t("skipNow")}</button>
        </div>
      </div>
    </div>
  );
}

function FieldWithToggle({ label, visible, onToggle, optional, children }: {
  label: string; visible: boolean; onToggle: () => void; optional?: boolean; children: React.ReactNode;
}) {
  const { lang } = useApp();
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: 13, color: "var(--muted-foreground)" }}>{label}</label>
          {optional && <span style={{ fontSize: 11, color: "var(--muted-foreground)", opacity: 0.6 }}>{lang === "ar" ? "اختياري" : "Optional"}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: visible ? "var(--primary)" : "var(--muted-foreground)" }}>
            {visible ? (lang === "ar" ? "ظاهر" : "Visible") : (lang === "ar" ? "مخفي" : "Hidden")}
          </span>
          <SmallToggle on={visible} onToggle={onToggle} />
        </div>
      </div>
      {children}
    </div>
  );
}

function SmallToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} style={{
      width: 36, height: 20, borderRadius: 10,
      background: on ? "var(--primary)" : "var(--border-strong)",
      position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
    }}>
      <div style={{
        position: "absolute", top: 2,
        left: on ? "calc(100% - 18px)" : 2,
        width: 16, height: 16, borderRadius: "50%",
        background: "white", transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
      }} />
    </div>
  );
}

