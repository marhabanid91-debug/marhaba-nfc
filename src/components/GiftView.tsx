import { useEffect, useState } from "react";
import { getGiftBySerial, toEmbed, safeCatalogUrl, giftItems, GiftPublic } from "../lib/gift";
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

  const items = giftItems(gift).map((it) => ({ ...it, embed: toEmbed(it.url) })).filter((it) => it.embed.kind !== "none");
  const catalog = safeCatalogUrl(gift?.gift_catalog);

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

          {items.length === 0 && (
            <div style={{
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 16, padding: 28, color: "var(--muted-foreground)", lineHeight: 1.8,
            }}>
              هديتك في الطريق إليك 💛
              <br />
              ستظهر هنا قريباً.
            </div>
          )}

          {items.map((it, i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              {it.title && <div style={{ fontWeight: 700, margin: "0 0 8px", fontSize: 16 }}>{it.title}</div>}
              {it.embed.kind === "iframe" && (
                <iframe
                  src={it.embed.src}
                  title={`gift-${i}`}
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                  loading="lazy"
                  style={{ width: "100%", ...(it.embed.tall ? { height: "70vh" } : { aspectRatio: "16 / 9" }), border: 0, borderRadius: 16, background: "#000" }}
                />
              )}
              {it.embed.kind === "image" && <img src={it.embed.src} alt="" style={{ width: "100%", borderRadius: 16 }} />}
              {it.embed.kind === "video" && (
                <video src={it.embed.src} controls playsInline style={{ width: "100%", borderRadius: 16, background: "#000" }} />
              )}
              {it.embed.kind === "audio" && <audio src={it.embed.src} controls style={{ width: "100%" }} />}
            </div>
          ))}

          {catalog && (
            <a
              href={catalog}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block", marginTop: 16, padding: "14px 18px", borderRadius: 14,
                background: "var(--primary)", color: "#000", fontWeight: 700,
                textDecoration: "none", fontSize: 16,
              }}
            >
              📖 تصفح الكتالوج
            </a>
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
