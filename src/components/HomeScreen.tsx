import { useState } from "react";
import { useApp } from "../context/AppContext";
import marhabaLogo from "../imports/marhaba-logo.png";
import { ActiveMode, Identity } from "../types";

export const modeConfig: Record<ActiveMode, { icon: string; color: string; label: { ar: string; en: string } }> = {
  business: { icon: "💼", color: "var(--business)", label: { ar: "الأعمال", en: "Business" } },
  emergency: { icon: "🚨", color: "var(--emergency)", label: { ar: "الطوارئ", en: "Emergency" } },
  events: { icon: "🎪", color: "var(--events)", label: { ar: "الفعاليات", en: "Events" } },
};

export function identityDisplayName(identity: Identity, isAr: boolean): string {
  return (
    identity.emergency.name || identity.business.name || identity.events.name ||
    (isAr ? "هوية جديدة" : "New Identity")
  );
}

/** بطاقة مصغّرة: الاسم + رقم البطاقة إن كانت مرتبطة. الضغط يفتح صفحة التفاصيل */
function IdentityRow({ identity, onOpen }: { identity: Identity; onOpen: (identity: Identity) => void }) {
  const { lang } = useApp();
  const isAr = lang === "ar";
  const mode = modeConfig[identity.activeMode];
  const name = identityDisplayName(identity, isAr);
  const linked = !!identity.serialNumber;

  return (
    <button
      onClick={() => onOpen(identity)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 12, textAlign: "start",
        padding: "12px 14px", marginBottom: 10, borderRadius: 16, cursor: "pointer", fontFamily: "inherit",
        background: "var(--card)", color: "var(--foreground)",
        border: `1px solid ${identity.isActive ? `color-mix(in srgb, ${mode.color} 30%, transparent)` : "var(--border)"}`,
        opacity: identity.isActive ? 1 : 0.6,
      }}
    >
      <div style={{
        width: 44, height: 44, flexShrink: 0, borderRadius: "50%", fontSize: 18, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: `color-mix(in srgb, ${mode.color} 14%, transparent)`,
        border: `1.5px solid color-mix(in srgb, ${mode.color} 40%, transparent)`,
      }}>
        {name.charAt(0) || "?"}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {name}
        </div>
        <div style={{
          fontSize: 12, marginTop: 3, display: "flex", alignItems: "center", gap: 6,
          color: linked ? "#22c55e" : "var(--muted-foreground)",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: linked ? "#22c55e" : "var(--border-strong)" }} />
          <span dir="ltr">{linked ? identity.serialNumber : (isAr ? "غير مرتبطة بعد" : "Not linked yet")}</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, color: mode.color,
          background: `color-mix(in srgb, ${mode.color} 12%, transparent)`,
        }}>
          {mode.icon} {isAr ? mode.label.ar : mode.label.en}
        </span>
        {!identity.isActive && (
          <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{isAr ? "غير مفعّلة" : "Inactive"}</span>
        )}
      </div>

      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        style={{ transform: isAr ? "rotate(180deg)" : "none", flexShrink: 0, color: "var(--muted-foreground)" }}>
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
}

export default function HomeScreen() {
  const { t, lang, identities, setScreen, setActiveIdentityId, setGateSerial } = useApp();
  const isAr = lang === "ar";
  const [query, setQuery] = useState("");

  const openIdentity = (identity: Identity) => {
    setActiveIdentityId(identity.id);
    setScreen("identity-detail");
  };

  const q = query.trim().toLowerCase();
  const shown = q
    ? identities.filter((i) =>
        `${identityDisplayName(i, isAr)} ${i.serialNumber || ""}`.toLowerCase().includes(q))
    : identities;

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
            width: 40, height: 40, borderRadius: "50%",
            background: "var(--card-elevated)", border: "1px solid var(--border-strong)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          }}>
            👤
          </div>
        </div>

        {/* Add identity button */}
        <button
          className="btn-primary"
          onClick={() => { setGateSerial(null); setScreen("serial-gate" as any); }}
          style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {t("addIdentity")}
        </button>

        {identities.length > 5 && (
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isAr ? "ابحث بالاسم أو رقم البطاقة" : "Search by name or card number"}
            style={{ marginBottom: 14 }}
          />
        )}

        {/* Identity cards */}
        {shown.map((identity) => (
          <IdentityRow key={identity.id} identity={identity} onOpen={openIdentity} />
        ))}

        {identities.length > 0 && shown.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--muted-foreground)", padding: 24, fontSize: 13 }}>
            {isAr ? "لا نتائج مطابقة" : "No matches"}
          </p>
        )}

        {identities.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--muted-foreground)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🪪</div>
            <p>{isAr ? "لا توجد هويات بعد. أضف هويتك الأولى." : "No identities yet. Add your first one."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
