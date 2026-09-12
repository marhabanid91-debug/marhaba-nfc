import { useState } from "react";
import { useApp } from "../context/AppContext";
import { OfflineSettings } from "../types";
import { saveOfflinePreferences } from "../lib/db";

type OfflineKey = keyof OfflineSettings;

const offlineFields: { key: OfflineKey; labelAr: string; labelEn: string }[] = [
  { key: "name", labelAr: "الاسم", labelEn: "Name" },
  { key: "contactPhone", labelAr: "رقم التواصل", labelEn: "Contact Phone" },
  { key: "emergencyPhone", labelAr: "رقم الطوارئ", labelEn: "Emergency Phone" },
];

export default function OfflineSettingsScreen() {
  const { lang, identities, setIdentities, activeIdentityId, setScreen, supabaseUser } = useApp();
  const identity = identities.find((i) => i.id === activeIdentityId) || identities[0];
  const [settings, setSettings] = useState<OfflineSettings>(
    identity?.offlineSettings || { name: true, contactPhone: false, emergencyPhone: true }
  );
  const [showUpdate, setShowUpdate] = useState(false);
  const [updated, setUpdated] = useState(false);

  const toggle = (key: OfflineKey) => setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  const save = () => {
    setIdentities(identities.map((id) =>
      id.id === identity?.id ? { ...id, offlineSettings: settings } : id
    ));
    if (identity?.id && supabaseUser) {
      saveOfflinePreferences(identity.id, settings).catch(() => {});
    }
  };

  const handleUpdate = () => {
    save();
    setShowUpdate(true);
    setTimeout(() => { setShowUpdate(false); setUpdated(true); }, 2500);
  };

  return (
    <div className="screen fade-in">
      <div style={{ padding: "24px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <button onClick={() => setScreen("settings")} style={{
            background: "none", border: "none", color: "var(--muted-foreground)",
            cursor: "pointer", fontSize: 20, padding: 0,
          }}>
            {lang === "ar" ? "→" : "←"}
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
            {lang === "ar" ? "بيانات القراءة دون إنترنت" : "Offline NFC Data"}
          </h1>
        </div>

        <p style={{ color: "var(--muted-foreground)", fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>
          {lang === "ar"
            ? "اختر المعلومات التي تريد أن تكون متاحة حتى عند عدم توفر الإنترنت"
            : "Choose the information available even without internet"}
        </p>

        <div className="card" style={{ marginBottom: 20 }}>
          {offlineFields.map((field, i) => (
            <div key={field.key}>
              <div onClick={() => toggle(field.key)} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "13px 0", cursor: "pointer",
              }}>
                <span style={{ fontSize: 14 }}>{lang === "ar" ? field.labelAr : field.labelEn}</span>
                <Toggle on={settings[field.key]} onToggle={() => toggle(field.key)} />
              </div>
              {i < offlineFields.length - 1 && <div className="divider" />}
            </div>
          ))}
        </div>

        <div style={{
          background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: 12, padding: "14px 16px", marginBottom: 24,
        }}>
          <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: 0, lineHeight: 1.7 }}>
            {lang === "ar"
              ? "💡 بيانات عدم الاتصال نسخة مختصرة للطوارئ فقط. عند توفر الإنترنت يحصل القارئ على البيانات الكاملة من المنصة."
              : "💡 Offline data is a compact emergency copy only. When connected, the reader gets complete data from the platform."}
          </p>
        </div>

        {updated ? (
          <div style={{
            background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: 12, padding: "16px", textAlign: "center", marginBottom: 16,
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <p style={{ color: "#22c55e", fontSize: 14, margin: 0 }}>
              {lang === "ar" ? "تم تحديث بيانات NFC بنجاح" : "NFC data updated successfully"}
            </p>
          </div>
        ) : showUpdate ? (
          <div style={{
            background: "var(--card-elevated)", border: "1px solid var(--border-strong)",
            borderRadius: 12, padding: "20px", textAlign: "center", marginBottom: 16,
          }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📱</div>
            <p style={{ fontSize: 14, marginBottom: 12 }}>
              {lang === "ar" ? "قرّب الإكسسوار من هاتفك لتحديث البيانات" : "Hold your accessory near your phone to update data"}
            </p>
            <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: "50%", background: "var(--primary)",
                }} />
              ))}
            </div>
          </div>
        ) : (
          <button className="btn-primary" onClick={handleUpdate}>
            {lang === "ar" ? "تحديث بيانات القراءة دون إنترنت" : "Update Offline NFC Data"}
          </button>
        )}
      </div>
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div onClick={(e) => { e.stopPropagation(); onToggle(); }} style={{
      width: 44, height: 24, borderRadius: 12,
      background: on ? "var(--primary)" : "var(--border-strong)",
      position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
    }}>
      <div style={{
        position: "absolute", top: 3,
        left: on ? "calc(100% - 21px)" : 3,
        width: 18, height: 18, borderRadius: "50%",
        background: "white", transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
      }} />
    </div>
  );
}

