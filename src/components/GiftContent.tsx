import { useEffect, useState } from "react";
import { toEmbed, safeCatalogUrl, giftItems, cleanPromo, GiftPublic } from "../lib/gift";
import { trackOpen, trackClick } from "../lib/stats";

const WA_NUMBER = "966500816798";

// محتوى الهدية المشترك (وسائط، عروض وسحوبات بأزرار المشاركة والتواصل الفوري، متابعة، كتالوج)
// يُستخدم في صفحة الهدية وفي صفحة الفعاليات. link = رابط الهدية الذي يُشارك
export default function GiftContent({ gift, link, track = false }: { gift: GiftPublic; link: string; track?: boolean }) {
  const [copied, setCopied] = useState<number | null>(null);
  const items = giftItems(gift).map((it) => ({ ...it, embed: toEmbed(it.url) })).filter((it) => it.embed.kind !== "none");
  const catalog = safeCatalogUrl(gift.gift_catalog);
  const promo = cleanPromo(gift.gift_promo);
  const statSerial = gift.serial || null;

  useEffect(() => {
    if (track && statSerial) trackOpen("gift", statSerial);
  }, [track, statSerial]);
  const hit = (metric: string) => () => {
    if (statSerial) trackClick("gift", statSerial, metric);
  };

  const waLink = (title?: string) =>
    `https://wa.me/${WA_NUMBER}?text=` +
    encodeURIComponent(`مرحباً مرحبا NFC 👋\nأرغب بالمشاركة في ${title || "السحب الأسبوعي"} 🎁\nرابط الهدية: ${link}`);

  const shareNow = async (title: string | undefined, idx: number) => {
    const text = `${title || gift.gift_title || "هدية من مرحبا NFC"} 🎁`;
    try {
      if (navigator.share) {
        await navigator.share({ title: text, text, url: link });
        return;
      }
    } catch {
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopied(idx);
      setTimeout(() => setCopied(null), 2500);
    } catch {
      window.prompt("انسخ الرابط وشاركه", link);
    }
  };

  return (
    <>
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
          style={{
            width: "100%", border: 0, borderRadius: 16, background: "#000",
            ...(it.embed.portrait
              ? { maxWidth: 360, height: 740, display: "block", margin: "0 auto" }
              : it.embed.tall ? { height: "70vh" } : { aspectRatio: "16 / 9" }),
          }}
        />
      )}
      {it.embed.kind === "image" && <img src={it.embed.src} alt="" style={{ width: "100%", borderRadius: 16 }} />}
      {it.embed.kind === "video" && (
        <video src={it.embed.src} controls playsInline style={{ width: "100%", borderRadius: 16, background: "#000" }} />
      )}
      {it.embed.kind === "audio" && <audio src={it.embed.src} controls style={{ width: "100%" }} />}
    </div>
  ))}

  {promo.offers.length > 0 && (
    <div style={{ marginTop: 22, textAlign: "right" }}>
      <div style={{ fontWeight: 700, fontSize: 17, margin: "0 0 10px", textAlign: "center" }}>🎉 عروض وسحوبات</div>
      {promo.offers.map((o, i) => (
        <div
          key={i}
          style={{
            background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16,
            padding: 16, marginBottom: 12,
          }}
        >
          {o.title && <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{o.title}</div>}
          {o.how && (
            <div style={{ color: "var(--muted-foreground)", lineHeight: 1.9, fontSize: 14, whiteSpace: "pre-wrap" }}>
              {o.how}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              hit(`offer:${i}`)();
              shareNow(o.title, i);
            }}
            style={{
              display: "block", width: "100%", marginTop: 12, padding: "11px 16px", borderRadius: 12, textAlign: "center",
              background: "var(--primary)", color: "#000", fontWeight: 700, fontSize: 15, border: 0, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {copied === i ? "تم نسخ الرابط ✓" : "شارك الآن ↗"}
          </button>
          <a
            href={waLink(o.title)}
            onClick={hit(`offer-wa:${i}`)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block", width: "100%", boxSizing: "border-box", marginTop: 10, padding: "11px 16px", borderRadius: 12,
              textAlign: "center", background: "#25D366", color: "#fff", fontWeight: 700, fontSize: 15,
              textDecoration: "none", fontFamily: "inherit",
            }}
          >
            💬 تواصل فوري عبر واتساب
          </a>
        </div>
      ))}
    </div>
  )}

  {promo.follow && (
    <a
      href={promo.follow.url}
      onClick={hit("follow")}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block", marginTop: 16, padding: "14px 18px", borderRadius: 14,
        background: "transparent", border: "1px solid var(--primary)", color: "var(--primary)",
        fontWeight: 700, textDecoration: "none", fontSize: 16,
      }}
    >
      💛 {promo.follow.title ? `تابع ${promo.follow.title}` : "تابع المُهدي"}
    </a>
  )}

  {catalog && (
    <a
      href={catalog}
      onClick={hit("catalog")}
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
    </>
  );
}
