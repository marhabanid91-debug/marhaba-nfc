import { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import marhabaLogo from "../imports/2177178-removebg-preview__1_.png";
import { ActiveMode, Identity } from "../types";
import ShareModal from "./ShareModal";
import { renameIdentity } from "../lib/db";

const modeConfig = {
  business: { icon: "💼", color: "var(--business)", label: { ar: "الأعمال", en: "Business" } },
  emergency: { icon: "🚨", color: "var(--emergency)", label: { ar: "الطوارئ", en: "Emergency" } },
  events: { icon: "🎪", color: "var(--events)", label: { ar: "الفعاليات", en: "Events" } },
};

const editSections = [
  { screen: "business"  as const, icon: "💼", ar: "بيانات الأعمال",   en: "Business Data",   color: "var(--business)"  },
  { screen: "emergency" as const, icon: "🚨", ar: "بيانات الطوارئ",   en: "Emergency Data",  color: "var(--emergency)" },
  { screen: "events"    as const, icon: "🎪", ar: "بيانات الفعاليات", en: "Events Data",     color: "var(--events)"    },
];

function NavArrow({ rtl }: { rtl: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ transform: rtl ? "rotate(180deg)" : "none", flexShrink: 0 }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IdentityCard({ identity, onModeChange, onPreview, onShare }: {
  identity: Identity;
  onModeChange: (id: string, mode: ActiveMode) => void;
  onPreview: (identity: Identity) => void;
  onShare: (identity: Identity) => void;
}) {
  const { t, lang, setIdentities, identities, supabaseUser, setScreen, setActiveIdentityId } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const mode = modeConfig[identity.activeMode];
  const isAr = lang === "ar";
  const identityName = identity.emergency.name || identity.business.name || identity.events.name || (isAr ? "هوية جديدة" : "New Identity");

  useEffect(() => {
    if (editing) {
      setEditName(identityName);
      setTimeout(() => editInputRef.current?.focus(), 60);
    }
  }, [editing]);

  const handleSaveName = async () => {
    const name = editName.trim();
    if (!name || name === identityName) { setEditing(false); return; }
    setSaving(true);
    setIdentities(identities.map((id) =>
      id.id !== identity.id ? id : {
        ...id,
        emergency: { ...id.emergency, name },
        business:  { ...id.business,  name },
        events:    { ...id.events,    name },
      }
    ));
    if (supabaseUser) await renameIdentity(identity.id, name).catch(() => {});
    setSaving(false);
    setEditing(false);
  };

  const handleGoEdit = (screen: "business" | "emergency" | "events") => {
    setActiveIdentityId(identity.id);
    setScreen(screen);
  };

  const handleGoAccessory = () => {
    setActiveIdentityId(identity.id);
    setScreen("accessory");
  };

  const toggleActive = () => {
    setIdentities(identities.map(id =>
      id.id === identity.id ? { ...id, isActive: !id.isActive } : id
    ));
  };

  const btnBase: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 10,
    padding: "11px 12px", borderRadius: 10, width: "100%",
    border: "1px solid var(--border-strong)",
    background: "var(--card)", cursor: "pointer",
    fontFamily: "inherit", fontSize: 13, textAlign: "start",
    color: "var(--foreground)", transition: "background 0.15s",
  };

  return (
    <div style={{
      background: editing ? "rgba(201,168,76,0.06)" : "var(--card)",
      borderRadius: 18,
      border: editing
        ? "2px solid #c9a84c"
        : `1px solid ${identity.isActive ? `${mode.color}30` : "var(--border)"}`,
      marginBottom: 16,
      transition: "border-color 0.25s, background 0.25s, box-shadow 0.25s",
      boxShadow: editing ? "0 0 0 3px rgba(201,168,76,0.14)" : "none",
    }}>
      {/* Top accent bar */}
      <div style={{
        height: 3,
        borderRadius: "16px 16px 0 0",
        background: editing
          ? "linear-gradient(90deg, #c9a84c, #e5c76b)"
          : identity.isActive
            ? `linear-gradient(90deg, ${mode.color}, ${mode.color}80)`
            : "var(--border)",
        transition: "background 0.25s",
      }} />

      <div style={{ padding: "16px" }}>
        {/* ── Header row ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
            {/* Avatar */}
            <div style={{
              width: 46, height: 46, flexShrink: 0, borderRadius: "50%",
              background: editing ? "rgba(201,168,76,0.18)" : `${mode.color}18`,
              border: `1.5px solid ${editing ? "#c9a84c80" : `${mode.color}40`}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, transition: "background 0.25s, border-color 0.25s",
            }}>
              {identityName.charAt(0) || "?"}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Name row — view or inline-edit */}
              {editing ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    ref={editInputRef}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditing(false); }}
                    style={{
                      flex: 1, height: 34, padding: "0 10px",
                      fontSize: 14, fontWeight: 600, borderRadius: 8,
                      border: "1.5px solid var(--primary)",
                      background: "var(--input-bg)", color: "var(--foreground)",
                      outline: "none", minWidth: 0,
                    }}
                  />
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {identityName}
                  </div>
                  {/* ✏️ Edit trigger */}
                  <button
                    onClick={() => setEditing(true)}
                    title={isAr ? "تعديل الهوية" : "Edit identity"}
                    style={{
                      width: 26, height: 26, borderRadius: 6,
                      background: "var(--card-elevated)", border: "1px solid var(--border-strong)",
                      color: "var(--muted-foreground)", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      cursor: "pointer", flexShrink: 0,
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
              )}
              <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>
                {identity.serialNumber ? identity.serialNumber : (isAr ? "غير مرتبط" : "Not linked")}
              </div>
            </div>
          </div>

          {/* Active toggle */}
          <button
            onClick={toggleActive}
            style={{
              padding: "5px 12px", borderRadius: 20,
              border: `1px solid ${identity.isActive ? "var(--primary)" : "var(--border-strong)"}`,
              background: identity.isActive ? "rgba(201,168,76,0.15)" : "transparent",
              color: identity.isActive ? "var(--primary)" : "var(--muted-foreground)",
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              flexShrink: 0,
            }}
          >
            {identity.isActive ? t("active") : t("inactive")}
          </button>
        </div>

        {/* ── Comprehensive edit panel ── */}
        {editing && (
          <div className="fade-in" style={{ marginBottom: 14 }}>
            {/* Golden divider */}
            <div style={{ height: 1, background: "rgba(201,168,76,0.3)", margin: "0 0 14px" }} />

            {/* Section label */}
            <div style={{ fontSize: 11, color: "#c9a84c", fontWeight: 700, letterSpacing: 0, textTransform: "uppercase", marginBottom: 10 }}>
              {isAr ? "تعديل بيانات الهوية" : "Edit Identity Data"}
            </div>

            {/* Three data section buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
              {editSections.map((sec) => (
                <button key={sec.screen} onClick={() => handleGoEdit(sec.screen)} style={{ ...btnBase }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: `color-mix(in srgb, ${sec.color} 14%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${sec.color} 30%, transparent)`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                  }}>
                    {sec.icon}
                  </span>
                  <span style={{ flex: 1, fontWeight: 600, color: "var(--foreground)" }}>
                    {isAr ? sec.ar : sec.en}
                  </span>
                  <NavArrow rtl={isAr} />
                </button>
              ))}

              {/* NFC linking button — prominent if not yet linked */}
              <button
                onClick={handleGoAccessory}
                style={{
                  ...btnBase,
                  background: identity.serialNumber ? "var(--card)" : "rgba(201,168,76,0.08)",
                  border: identity.serialNumber ? "1px solid var(--border-strong)" : "1px solid rgba(201,168,76,0.35)",
                }}
              >
                <span style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: identity.serialNumber ? "rgba(34,197,94,0.12)" : "rgba(201,168,76,0.16)",
                  border: `1px solid ${identity.serialNumber ? "rgba(34,197,94,0.3)" : "rgba(201,168,76,0.35)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                }}>
                  📡
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: identity.serialNumber ? "var(--foreground)" : "#c9a84c" }}>
                    {isAr
                      ? (identity.serialNumber ? "إدارة بطاقة NFC" : "ربط بطاقة NFC")
                      : (identity.serialNumber ? "Manage NFC Card" : "Link NFC Card")}
                  </div>
                  {identity.serialNumber && (
                    <div style={{ fontSize: 11, color: "#22c55e", marginTop: 1 }} data-dir="ltr">
                      {identity.serialNumber}
                    </div>
                  )}
                </div>
                <NavArrow rtl={isAr} />
              </button>
            </div>

            {/* Golden divider */}
            <div style={{ height: 1, background: "rgba(201,168,76,0.2)", margin: "0 0 12px" }} />

            {/* إكمال + إلغاء */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
              <button
                onClick={handleSaveName}
                disabled={saving}
                style={{
                  height: 40, borderRadius: 10,
                  background: "linear-gradient(135deg,#c9a84c,#d4af37)",
                  border: "none", color: "#09090f",
                  fontSize: 14, fontWeight: 700,
                  cursor: saving ? "default" : "pointer",
                  opacity: saving ? 0.7 : 1, fontFamily: "inherit",
                }}
              >
                {saving ? "…" : (isAr ? "✓ إكمال وحفظ" : "✓ Save & Done")}
              </button>
              <button
                onClick={() => setEditing(false)}
                style={{
                  height: 40, width: 40, borderRadius: 10,
                  background: "var(--card-elevated)", border: "1px solid var(--border-strong)",
                  color: "var(--muted-foreground)", fontSize: 18, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* ── Status row (hidden while editing to save space) ── */}
        {!editing && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 4 }}>{t("activeMode")}</div>
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 12px", borderRadius: 8,
                    border: `1px solid ${mode.color}40`,
                    background: `${mode.color}12`, color: mode.color,
                    fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  <span>{mode.icon}</span>
                  <span>{isAr ? mode.label.ar : mode.label.en}</span>
                  <span style={{ fontSize: 10 }}>▼</span>
                </button>
                {dropdownOpen && (
                  <>
                    {/* invisible backdrop to close on outside click */}
                    <div
                      onClick={() => setDropdownOpen(false)}
                      style={{ position: "fixed", inset: 0, zIndex: 9 }}
                    />
                    <div style={{
                      position: "absolute", top: "calc(100% + 6px)",
                      [isAr ? "right" : "left"]: 0,
                      background: "var(--card-elevated)", border: "1px solid var(--border-strong)",
                      borderRadius: 10, overflow: "hidden", zIndex: 20,
                      minWidth: 170, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    }}>
                      {(["business", "emergency", "events"] as ActiveMode[]).map((m) => {
                        const cfg = modeConfig[m];
                        return (
                          <button
                            key={m}
                            onClick={() => { onModeChange(identity.id, m); setDropdownOpen(false); }}
                            style={{
                              display: "flex", alignItems: "center", gap: 10,
                              padding: "12px 14px", width: "100%",
                              background: identity.activeMode === m ? `${cfg.color}14` : "transparent",
                              border: "none",
                              color: identity.activeMode === m ? cfg.color : "var(--foreground)",
                              fontSize: 14, cursor: "pointer", fontFamily: "inherit",
                              fontWeight: identity.activeMode === m ? 700 : 400, textAlign: "start",
                            }}
                          >
                            <span>{cfg.icon}</span>
                            <span>{isAr ? cfg.label.ar : cfg.label.en}</span>
                            {identity.activeMode === m && <span style={{ marginInlineStart: "auto", fontSize: 12 }}>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div style={{ textAlign: isAr ? "left" : "right" }}>
              <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 4 }}>NFC</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: identity.serialNumber ? "#22c55e" : "var(--muted-foreground)", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: identity.serialNumber ? "#22c55e" : "var(--border-strong)", display: "inline-block" }} />
                {identity.serialNumber ? t("serialLinked") : t("serialNotLinked")}
              </div>
            </div>
          </div>
        )}

        {/* ── Action buttons (hidden while editing) ── */}
        {!editing && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button
              onClick={() => onPreview(identity)}
              style={{
                padding: "9px", borderRadius: 10,
                background: "var(--card-elevated)", border: "1px solid var(--border-strong)",
                color: "var(--muted-foreground)", fontSize: 13, cursor: "pointer",
                fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              {t("previewReader")}
            </button>
            {identity.serialNumber && (
              <button
                onClick={() => onShare(identity)}
                style={{
                  padding: "9px", borderRadius: 10,
                  background: "rgba(184,150,46,0.1)", border: "1px solid rgba(184,150,46,0.3)",
                  color: "var(--primary, #c9a84c)", fontSize: 13, cursor: "pointer",
                  fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                QR
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomeScreen() {
  const { t, lang, identities, updateIdentityMode, setScreen, setReaderPreviewMode, setActiveIdentityId, addIdentity } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [shareIdentity, setShareIdentity] = useState<Identity | null>(null);

  const handlePreview = (identity: Identity) => {
    setActiveIdentityId(identity.id);
    setReaderPreviewMode(identity.activeMode);
    setScreen(`reader-${identity.activeMode}` as any);
  };

  const handleAddIdentity = () => {
    if (newName.trim()) {
      addIdentity(newName.trim());
      setNewName("");
      setShowAddModal(false);
    }
  };

  return (
    <div className="screen fade-in">
      <div style={{ padding: "24px 20px 0" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={marhabaLogo} alt="مرحبا NFC" style={{ width: 44, height: "auto" }} />
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{t("homeTitle")}</h1>
          </div>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "var(--card-elevated)",
            border: "1px solid var(--border-strong)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}>
            👤
          </div>
        </div>

        {/* Add identity button */}
        <button
          className="btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {t("addIdentity")}
        </button>

        {/* Identity cards */}
        {identities.map((identity) => (
          <IdentityCard
            key={identity.id}
            identity={identity}
            onModeChange={updateIdentityMode}
            onPreview={handlePreview}
            onShare={setShareIdentity}
          />
        ))}

        {identities.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--muted-foreground)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🪪</div>
            <p>{lang === "ar" ? "لا توجد هويات بعد. أضف هويتك الأولى." : "No identities yet. Add your first one."}</p>
          </div>
        )}
      </div>

      {/* QR Share Modal */}
      {shareIdentity && shareIdentity.serialNumber && (
        <ShareModal
          identityName={
            shareIdentity.emergency.name ||
            shareIdentity.business.name ||
            shareIdentity.events.name ||
            (lang === "ar" ? "هويتي" : "My Identity")
          }
          serialNumber={shareIdentity.serialNumber}
          onClose={() => setShareIdentity(null)}
        />
      )}

      {/* Add Identity Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          zIndex: 200,
        }} onClick={() => setShowAddModal(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 430,
              background: "var(--card-elevated)",
              borderRadius: "20px 20px 0 0",
              padding: "24px 20px 40px",
              border: "1px solid var(--border-strong)",
            }}
          >
            <div style={{ width: 36, height: 4, background: "var(--border-strong)", borderRadius: 2, margin: "0 auto 20px" }} />
            <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>{t("addIdentity")}</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: "var(--muted-foreground)", display: "block", marginBottom: 6 }}>
                {t("identityName")}
              </label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("enterIdentityName")}
                onKeyDown={(e) => e.key === "Enter" && handleAddIdentity()}
                autoFocus
              />
            </div>
            <button className="btn-primary" onClick={handleAddIdentity}>{t("addIdentity")}</button>
            <button className="btn-ghost" onClick={() => setShowAddModal(false)}>{lang === "ar" ? "إلغاء" : "Cancel"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

