import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { ActiveMode } from "../types";
import ShareModal from "./ShareModal";
import { renameIdentity } from "../lib/db";
import { modeConfig, identityDisplayName } from "./HomeScreen";

const editSections = [
  { screen: "business" as const, icon: "💼", ar: "بيانات الأعمال", en: "Business Data", color: "var(--business)" },
  { screen: "emergency" as const, icon: "🚨", ar: "بيانات الطوارئ", en: "Emergency Data", color: "var(--emergency)" },
  { screen: "events" as const, icon: "🎪", ar: "بيانات الفعاليات", en: "Events Data", color: "var(--events)" },
];

function NavArrow({ rtl }: { rtl: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ transform: rtl ? "rotate(180deg)" : "none", flexShrink: 0 }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

const rowBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10, width: "100%",
  padding: "12px", borderRadius: 12, cursor: "pointer", textAlign: "start",
  border: "1px solid var(--border-strong)", background: "var(--card)",
  fontFamily: "inherit", fontSize: 14, color: "var(--foreground)",
};

const sectionTitle: React.CSSProperties = {
  fontSize: 12, color: "var(--muted-foreground)", fontWeight: 700, margin: "22px 0 8px",
};

/** صفحة تفاصيل الهوية: كل ما يخص هوية واحدة في مكان واحد */
export default function IdentityDetailScreen() {
  const {
    lang, identities, setIdentities, activeIdentityId, setActiveIdentityId, setScreen,
    setReaderPreviewMode, updateIdentityMode, supabaseUser,
  } = useApp();
  const isAr = lang === "ar";
  const identity = identities.find((i) => i.id === activeIdentityId);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!identity) setScreen("home");
  }, [identity]);

  useEffect(() => {
    if (editing) setTimeout(() => inputRef.current?.focus(), 60);
  }, [editing]);

  if (!identity) return null;

  const name = identityDisplayName(identity, isAr);
  const mode = modeConfig[identity.activeMode];
  const linked = !!identity.serialNumber;

  const startEdit = () => { setEditName(name); setEditing(true); };

  const saveName = async () => {
    const n = editName.trim();
    if (!n || n === name) { setEditing(false); return; }
    setSaving(true);
    setIdentities(identities.map((id) =>
      id.id !== identity.id ? id : {
        ...id,
        emergency: { ...id.emergency, name: n },
        business: { ...id.business, name: n },
        events: { ...id.events, name: n },
      }
    ));
    if (supabaseUser) await renameIdentity(identity.id, n).catch(() => {});
    setSaving(false);
    setEditing(false);
  };

  const toggleActive = () =>
    setIdentities(identities.map((id) => (id.id === identity.id ? { ...id, isActive: !id.isActive } : id)));

  const goEdit = (screen: "business" | "emergency" | "events") => {
    setActiveIdentityId(identity.id);
    setScreen(screen);
  };

  const preview = () => {
    setActiveIdentityId(identity.id);
    setReaderPreviewMode(identity.activeMode);
    setScreen(`reader-${identity.activeMode}` as any);
  };

  return (
    <div className="screen fade-in">
      <div style={{ padding: "20px 20px 0" }}>
        {/* رجوع */}
        <button
          onClick={() => setScreen("home")}
          style={{
            background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer",
            fontSize: 13, fontFamily: "inherit", padding: 0, marginBottom: 14,
          }}
        >
          {isAr ? "→ هوياتي" : "← My identities"}
        </button>

        {/* الرأس: الاسم والرقم */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: 18,
          background: `color-mix(in srgb, ${mode.color} 8%, var(--card))`,
          border: `1px solid color-mix(in srgb, ${mode.color} 30%, transparent)`,
        }}>
          <div style={{
            width: 56, height: 56, flexShrink: 0, borderRadius: "50%", fontSize: 24, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `color-mix(in srgb, ${mode.color} 16%, transparent)`,
            border: `1.5px solid color-mix(in srgb, ${mode.color} 45%, transparent)`,
          }}>
            {name.charAt(0) || "?"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editing ? (
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  ref={inputRef}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditing(false); }}
                  style={{ flex: 1, minWidth: 0, height: 36 }}
                />
                <button onClick={saveName} disabled={saving} style={{
                  padding: "0 12px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit",
                  background: "var(--primary)", color: "#000", fontWeight: 700,
                }}>{saving ? "…" : "✓"}</button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontWeight: 800, fontSize: 18, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {name}
                </div>
                <button onClick={startEdit} aria-label={isAr ? "تعديل الاسم" : "Edit name"} style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0, cursor: "pointer",
                  background: "var(--card-elevated)", border: "1px solid var(--border-strong)",
                  color: "var(--muted-foreground)", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              </div>
            )}
            <div style={{
              fontSize: 13, marginTop: 4, display: "flex", alignItems: "center", gap: 6,
              color: linked ? "#22c55e" : "var(--muted-foreground)",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: linked ? "#22c55e" : "var(--border-strong)" }} />
              <span dir="ltr">{linked ? identity.serialNumber : (isAr ? "غير مرتبطة بعد" : "Not linked yet")}</span>
            </div>
          </div>
        </div>

        {/* الوضع النشط */}
        <div style={sectionTitle}>{isAr ? "الوضع النشط (ما يظهر عند مسح البطاقة)" : "Active mode (what a scan shows)"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {(["business", "emergency", "events"] as ActiveMode[]).map((m) => {
            const cfg = modeConfig[m];
            const on = identity.activeMode === m;
            return (
              <button
                key={m}
                onClick={() => updateIdentityMode(identity.id, m)}
                aria-pressed={on}
                style={{
                  padding: "12px 4px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  fontSize: 12, fontWeight: on ? 700 : 500,
                  color: on ? cfg.color : "var(--muted-foreground)",
                  background: on ? `color-mix(in srgb, ${cfg.color} 14%, transparent)` : "var(--card)",
                  border: `1.5px solid ${on ? cfg.color : "var(--border-strong)"}`,
                }}
              >
                <span style={{ fontSize: 20 }}>{cfg.icon}</span>
                {isAr ? cfg.label.ar : cfg.label.en}
              </button>
            );
          })}
        </div>

        {/* بيانات الهوية */}
        <div style={sectionTitle}>{isAr ? "بيانات الهوية" : "Identity data"}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {editSections.map((sec) => (
            <button key={sec.screen} onClick={() => goEdit(sec.screen)} style={rowBtn}>
              <span style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0, fontSize: 17,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: `color-mix(in srgb, ${sec.color} 14%, transparent)`,
                border: `1px solid color-mix(in srgb, ${sec.color} 30%, transparent)`,
              }}>{sec.icon}</span>
              <span style={{ flex: 1, fontWeight: 600 }}>{isAr ? `تعديل ${sec.ar}` : `Edit ${sec.en}`}</span>
              <NavArrow rtl={isAr} />
            </button>
          ))}
        </div>

        {/* البطاقة */}
        <div style={sectionTitle}>{isAr ? "البطاقة" : "Card"}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={() => { setActiveIdentityId(identity.id); setScreen("accessory"); }}
            style={{
              ...rowBtn,
              background: linked ? "var(--card)" : "rgba(201,168,76,0.08)",
              border: linked ? "1px solid var(--border-strong)" : "1px solid rgba(201,168,76,0.35)",
            }}
          >
            <span style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0, fontSize: 17,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: linked ? "rgba(34,197,94,0.12)" : "rgba(201,168,76,0.16)",
            }}>📡</span>
            <span style={{ flex: 1, fontWeight: 600, color: linked ? "var(--foreground)" : "#c9a84c" }}>
              {linked ? (isAr ? "إدارة بطاقة NFC" : "Manage NFC card") : (isAr ? "ربط بطاقة NFC" : "Link NFC card")}
            </span>
            <NavArrow rtl={isAr} />
          </button>

          <div style={{ display: "grid", gridTemplateColumns: linked ? "1fr 1fr" : "1fr", gap: 8 }}>
            <button onClick={preview} style={{ ...rowBtn, justifyContent: "center", fontSize: 13 }}>
              👁️ {isAr ? "معاينة صفحة القارئ" : "Preview reader page"}
            </button>
            {linked && (
              <button onClick={() => setShowQr(true)} style={{ ...rowBtn, justifyContent: "center", fontSize: 13, color: "var(--primary)" }}>
                ▦ QR
              </button>
            )}
          </div>
        </div>

        {/* التفعيل */}
        <div style={sectionTitle}>{isAr ? "حالة الهوية" : "Status"}</div>
        <button onClick={toggleActive} style={{ ...rowBtn, justifyContent: "space-between" }}>
          <span style={{ fontWeight: 600 }}>
            {identity.isActive ? (isAr ? "الهوية مفعّلة" : "Identity is active") : (isAr ? "الهوية غير مفعّلة" : "Identity is inactive")}
          </span>
          <span style={{
            padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
            color: identity.isActive ? "var(--primary)" : "var(--muted-foreground)",
            border: `1px solid ${identity.isActive ? "var(--primary)" : "var(--border-strong)"}`,
            background: identity.isActive ? "rgba(201,168,76,0.15)" : "transparent",
          }}>
            {identity.isActive ? (isAr ? "إيقاف" : "Turn off") : (isAr ? "تفعيل" : "Turn on")}
          </span>
        </button>
        <div style={{ height: 28 }} />
      </div>

      {showQr && identity.serialNumber && (
        <ShareModal
          identityName={name}
          serialNumber={identity.serialNumber}
          identity={identity}
          onClose={() => setShowQr(false)}
        />
      )}
    </div>
  );
}
