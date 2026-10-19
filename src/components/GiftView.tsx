import { useEffect, useState } from "react";
import { getGiftBySerial, toEmbed, GiftPublic } from "../lib/gift";
import marhabaLogo from "../imports/marhaba-logo.png";

// صفحة الهدية التي يراها من يمسح بطاقة الهدية
export default function GiftView() {
  const serial = new URLSearchParams(window.location.search).get("serial") || "";
  const [gift, setGift] = useState<GiftPublic | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getGiftBySerial(serial).then((g) => {
      setGift(g);
      setLoaded(true);
    });
  }, [serial]);

  const embed = toEmbed(gift?.gift_url);

  return (
    <div
      dir="rtl"
      style={{
        position: "fixed", inset: 0, overflowY: "auto",
        background: "var(--background)", color: "var(--foreground)",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "28px 18px", gap: 18, zIndex: 50,
      }}
    >
      <img src={marhabaLogo} alt="مرحبا" style={{ width: 64, height: "auto", opacity: 0.95 }} />

      {!loaded && <p style={{ color: "var(--muted-foreground)" }}>جاري التحميل…</p>}

      {loaded && !gift && (
        <p style={{ color: "var(--muted-foreground)", textAlign: "center" }}>
          هذه الهدية غير متوفرة حالياً
        </p>
      )}

      {loaded && gift && (
        <div style={{ width: "100%", maxWidth: 480, textAlign: "center" }}>
          <h2 style={{ margin: "4px 0 16px", fontSize: 22 }}>
            {gift.gift_title || "هدية لك 🎁"}
          </h2>

          {embed.kind === "none" && (
            <div style={{
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 16, padding: 28, color: "var(--muted-foreground)", lineHeight: 1.8,
            }}>
              هديتك في الطريق إليك 💛
              <br />
              ستظهر هنا قريباً.
            </div>
          )}

          {embed.kind === "iframe" && (
            <iframe
              src={embed.src}
              title="gift"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              style={{ width: "100%", aspectRatio: "16 / 9", border: 0, borderRadius: 16, background: "#000" }}
            />
          )}
          {embed.kind === "image" && (
            <img src={embed.src} alt="" style={{ width: "100%", borderRadius: 16 }} />
          )}
          {embed.kind === "video" && (
            <video src={embed.src} controls playsInline style={{ width: "100%", borderRadius: 16, background: "#000" }} />
          )}
          {embed.kind === "audio" && (
            <audio src={embed.src} controls style={{ width: "100%" }} />
          )}
        </div>
      )}

      <a
        href="https://marhabanid.com"
        style={{ marginTop: "auto", fontSize: 12, color: "var(--muted-foreground)", textDecoration: "none" }}
      >
        مرحبا NFC
      </a>
    </div>
  );
}
