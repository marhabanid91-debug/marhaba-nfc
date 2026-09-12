import { useState } from "react";
import { useApp } from "../context/AppContext";
import { checkSerialAvailability, linkSerialToIdentity, unlinkSerial } from "../lib/db";
import { supabase } from "../lib/supabase";

// Single source of truth for the WhatsApp accessory link — never changes at runtime
const WA_LINK = "https://wa.me/966500816798?text=%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%B7%D9%84%D8%A8%20%D8%A7%D9%83%D8%B3%D8%B3%D9%88%D8%A7%D8%B1%20%D9%84%D9%85%D9%86%D8%B5%D8%A9%20Marhaba%20NFC";

const accessoryTypes = [
  { id: "nfc-card", icon: "🪪", labelAr: "بطاقة NFC", labelEn: "NFC Card" },
  { id: "resin-card", icon: "💳", labelAr: "بطاقة ريزن", labelEn: "Resin Card" },
  { id: "resin-medal", icon: "🏅", labelAr: "ميدالية ريزن", labelEn: "Resin Medal" },
  { id: "bracelet", icon: "⌚", labelAr: "سوار", labelEn: "Bracelet" },
];

export default function AccessoryScreen() {
  const { t, lang, identities, setIdentities, activeIdentityId, setScreen, supabaseUser } = useApp();
  const [tab, setTab] = useState<"link" | "request">("link");
  const [serial, setSerial] = useState("");
  const [linked, setLinked] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const identity = identities.find((i) => i.id === activeIdentityId) || identities[0];
  const identityName = identity?.emergency.name || identity?.business.name || (lang === "ar" ? "هوية جديدة" : "New Identity");

  const handleLink = async () => {
    setError("");
    const normalized = serial.trim().toUpperCase();
    if (!normalized) return;

    setChecking(true);
    try {
      if (!supabaseUser || !identity?.id) {
        setError(lang === "ar" ? "يجب تسجيل الدخول أولاً لربط البطاقة." : "You must be signed in to link a card.");
        return;
      }
      const check = await checkSerialAvailability(normalized);
      if (!check.valid) {
        setError(lang === "ar" ? "الرقم غير موجود في النظام." : "This code does not exist in the system.");
        return;
      }
      if (!check.available) {
        setError(lang === "ar" ? "هذا الرقم مستخدم مسبقاً لحساب آخر." : "This code is already linked to another account.");
        return;
      }
      const ok = await linkSerialToIdentity(normalized, identity.id, supabaseUser.id);
      if (!ok) {
        setError(lang === "ar" ? "هذا الرقم مستخدم مسبقاً لحساب آخر." : "This code is already linked to another account.");
        return;
      }
      {
        setIdentities(identities.map((id) =>
          id.id === identity?.id ? { ...id, serialNumber: normalized } : id
        ));
        setLinked(true);
      }
    } catch {
      setError(t("serialInvalid"));
    } finally {
      setChecking(false);
    }
  };

  const handleUnlink = async () => {
    const currentSerial = identity?.serialNumber;
    setIdentities(identities.map((id) =>
      id.id === identity?.id ? { ...id, serialNumber: null } : id
    ));
    setLinked(false);
    setSerial("");
    setError("");
    if (currentSerial && identity?.id && supabaseUser) {
      await unlinkSerial(currentSerial, identity.id).catch(() => {});
    }
  };

  return (
    <div className="screen fade-in">
      <div style={{ padding: "24px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(201,168,76,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>📟</div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{t("accessory")}</h1>
            <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: 0 }}>{identityName}</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", background: "var(--card)", borderRadius: 12, padding: 4, marginBottom: 24,
          border: "1px solid var(--border)",
        }}>
          {(["link", "request"] as const).map((tab_) => (
            <button key={tab_} onClick={() => setTab(tab_)} style={{
              flex: 1, padding: "10px", borderRadius: 9, border: "none",
              background: tab === tab_ ? "var(--card-elevated)" : "transparent",
              color: tab === tab_ ? "var(--foreground)" : "var(--muted-foreground)",
              fontWeight: tab === tab_ ? 600 : 400,
              fontSize: 14, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
            }}>
              {tab_ === "link" ? t("linkAccessory") : t("requestAccessory")}
            </button>
          ))}
        </div>

        {/* Link tab */}
        {tab === "link" && (
          <div className="fade-in">
            {!linked ? (
              <>
                <div className="card" style={{ marginBottom: 20, textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🔗</div>
                  <p style={{ color: "var(--muted-foreground)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                    {t("enterSerial")}
                  </p>
                </div>

                {identity?.serialNumber && (
                  <div style={{
                    background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)",
                    borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "var(--primary)",
                    marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span>{lang === "ar" ? `مرتبط حالياً: ${identity.serialNumber}` : `Currently linked: ${identity.serialNumber}`}</span>
                    <button onClick={handleUnlink} style={{
                      background: "rgba(229,62,62,0.1)", border: "1px solid rgba(229,62,62,0.2)",
                      borderRadius: 6, color: "var(--emergency)", cursor: "pointer",
                      fontSize: 11, padding: "3px 8px", fontFamily: "inherit",
                    }}>
                      {t("unlinkAccessory")}
                    </button>
                  </div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, color: "var(--muted-foreground)", display: "block", marginBottom: 6 }}>
                    {t("serialNumber")}
                  </label>
                  <input
                    value={serial}
                    onChange={(e) => { setSerial(e.target.value); setError(""); }}
                    placeholder="MRH-XXXXXX"
                    data-dir="ltr"
                    style={{ letterSpacing: 2, textTransform: "uppercase", fontFamily: "monospace, sans-serif" }}
                    onKeyDown={(e) => e.key === "Enter" && handleLink()}
                  />
                </div>

                {error && (
                  <div style={{
                    background: "rgba(229,62,62,0.1)", border: "1px solid rgba(229,62,62,0.25)",
                    borderRadius: 10, padding: "10px 14px", color: "var(--emergency)",
                    fontSize: 13, marginBottom: 14, display: "flex", alignItems: "center", gap: 8,
                  }}>
                    ⚠ {error}
                  </div>
                )}

                <button className="btn-primary" onClick={handleLink} style={{ opacity: checking ? 0.7 : 1 }}>
                  {checking ? t("serialChecking") : t("linkBtn")}
                </button>
              </>
            ) : (
              <div className="fade-in" style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
                <h3 style={{ color: "#22c55e", marginBottom: 8, fontSize: 18 }}>{t("linked")}</h3>
                <p style={{ color: "var(--muted-foreground)", fontSize: 14, marginBottom: 24 }}>
                  {serial.toUpperCase()} {t("identityLinkedTo")} {identityName}
                </p>
                <div style={{
                  background: "var(--card-elevated)", borderRadius: 14,
                  padding: "16px", marginBottom: 24, border: "1px solid var(--border-strong)",
                  display: "inline-block", textAlign: "center",
                }}>
                  <div data-dir="ltr" style={{ fontFamily: "monospace", fontSize: 20, color: "var(--primary)", fontWeight: 700, letterSpacing: 2 }}>
                    {serial.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>
                    marhaba.com/id/{serial.toUpperCase()}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button className="btn-primary" onClick={() => setScreen("home")}>{t("backToHome")}</button>
                  <button className="btn-ghost" onClick={() => { setLinked(false); setSerial(""); }}>
                    {lang === "ar" ? "ربط إكسسوار آخر" : "Link another accessory"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Request tab */}
        {tab === "request" && (
          <div className="fade-in">
            {!requested ? (
              <>
                <p style={{ color: "var(--muted-foreground)", fontSize: 14, marginBottom: 20 }}>
                  {lang === "ar" ? "اختر نوع الإكسسوار المناسب لك (اختياري)" : "Choose the right accessory for you (optional)"}
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                  {accessoryTypes.map((type) => (
                    <button key={type.id} onClick={() => setSelectedType(selectedType === type.id ? null : type.id)} style={{
                      padding: "20px 12px", borderRadius: 16,
                      border: `1.5px solid ${selectedType === type.id ? "var(--primary)" : "var(--border-strong)"}`,
                      background: selectedType === type.id ? "rgba(201,168,76,0.1)" : "var(--card-elevated)",
                      cursor: "pointer", fontFamily: "inherit",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                      transition: "all 0.2s",
                    }}>
                      <span style={{ fontSize: 36 }}>{type.icon}</span>
                      <span style={{
                        fontSize: 13, fontWeight: selectedType === type.id ? 700 : 500,
                        color: selectedType === type.id ? "var(--primary)" : "var(--foreground)",
                      }}>
                        {lang === "ar" ? type.labelAr : type.labelEn}
                      </span>
                      {selectedType === type.id && <span style={{ fontSize: 11, color: "var(--primary)" }}>✓</span>}
                    </button>
                  ))}
                </div>

                <div style={{
                  background: "var(--card)", borderRadius: 14, padding: 16,
                  border: "1px solid var(--border)", marginBottom: 20,
                }}>
                  <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: 0, lineHeight: 1.7 }}>
                    {lang === "ar"
                      ? "سيتواصل معك فريق مرحباً عبر واتساب لإتمام الطلب وتسليم الإكسسوار."
                      : "The Marhaba team will contact you on WhatsApp to complete your order and deliver your accessory."}
                  </p>
                </div>

                {/* WhatsApp CTA — always clickable */}
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={async () => {
                    if (supabaseUser && selectedType) {
                      try {
                        await supabase.from("accessory_requests").insert({
                          user_id: supabaseUser.id,
                          identity_id: identity?.id ?? null,
                          accessory_type: selectedType,
                          status: "pending",
                        });
                      } catch { /* non-blocking */ }
                    }
                    setRequested(true);
                  }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "14px", borderRadius: 12,
                    background: "#25D366", color: "white",
                    fontWeight: 700, fontSize: 14, textDecoration: "none",
                    border: "none", cursor: "pointer",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  {lang === "ar" ? "تواصل عبر واتساب" : "Contact via WhatsApp"}
                </a>
              </>
            ) : (
              <div className="fade-in" style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📨</div>
                <h3 style={{ color: "var(--primary)", marginBottom: 8 }}>
                  {lang === "ar" ? "تم التوجيه إلى واتساب!" : "Redirected to WhatsApp!"}
                </h3>
                <p style={{ color: "var(--muted-foreground)", fontSize: 14, marginBottom: 24 }}>
                  {lang === "ar"
                    ? "سيتواصل معك الفريق في أقرب وقت ممكن."
                    : "The team will contact you as soon as possible."}
                </p>
                <button className="btn-primary" onClick={() => setScreen("home")}>{t("backToHome")}</button>
                <button className="btn-ghost" onClick={() => { setRequested(false); setSelectedType(null); }}>
                  {lang === "ar" ? "طلب آخر" : "Another request"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

