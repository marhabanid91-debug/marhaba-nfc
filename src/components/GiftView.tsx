import { useEffect, useState } from "react";
import { getGiftBySerial, toEmbed, safeCatalogUrl, giftItems, cleanPromo, GiftPublic } from "../lib/gift";
import GiftContent from "./GiftContent";
import marhabaLogo from "../imports/marhaba-logo.png";
import { trackOpen } from "../lib/stats";

const LANDING_LINK = "https://welcome.marhabanid.com";

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
  const promo = cleanPromo(gift?.gift_promo);
  // لا يظهر إلا ما أضافه المُهدي؛ الرسالة الافتراضية فقط إن كانت الهدية فارغة تماماً
  const statSerial = gift?.serial || null;
  useEffect(() => {
    if (statSerial) trackOpen("gift", statSerial);
  }, [statSerial]);
  const isEmpty = !gift?.gift_title && items.length === 0 && !catalog && !promo.follow && promo.offers.length === 0;

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
          {gift.gift_title && (
            <h2 style={{ margin: "4px 0 16px", fontSize: 22 }}>{gift.gift_title}</h2>
          )}

          {isEmpty && (
            <div style={{
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 16, padding: 28, color: "var(--muted-foreground)", lineHeight: 1.8,
            }}>
              هديتك قيد التجهيز 💛
              <br />
              ستظهر هنا قريباً.
            </div>
          )}

          <GiftContent gift={gift} link={window.location.href} />
        </div>
      )}

      {loaded && (
        <a
          href={LANDING_LINK}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            width: "100%", maxWidth: 480, boxSizing: "border-box", display: "block",
            marginTop: 8, padding: "14px 18px", borderRadius: 14, textAlign: "center",
            background: "rgba(201,168,76,0.12)", border: "1px solid var(--primary)",
            color: "var(--primary)", fontWeight: 700, fontSize: 15, textDecoration: "none", lineHeight: 1.6,
          }}
        >
          🎁 أنشئ إكسسوارات وهدايا ذكية، اضغط هنا
        </a>
      )}

      <a
        href="https://welcome.marhabanid.com"
        style={{ marginTop: "auto", fontSize: 12, color: "var(--muted-foreground)", textDecoration: "none" }}
      >
        مرحبا NFC
      </a>
    </div>
  );
}
