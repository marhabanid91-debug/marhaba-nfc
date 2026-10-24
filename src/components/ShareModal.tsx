import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { useApp } from "../context/AppContext";
import { myCardToken } from "../lib/db";
import { Identity } from "../types";
import marhabaLogo from "../imports/marhaba-logo.png";

interface ShareModalProps {
  identityName: string;
  serialNumber: string;
  identity?: Identity;
  onClose: () => void;
}

const vEsc = (v: string) => v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

/** بطاقة اتصال (vCard) تُقرأ بكاميرا الجوال دون إنترنت، بحسب إعدادات «بيانات القراءة دون إنترنت» */
function buildOfflineVCard(identity: Identity | undefined, name: string, pageUrl: string): string | null {
  if (!identity) return null;
  const o = identity.offlineSettings || { name: true, contactPhone: false, emergencyPhone: true };
  const contact = o.contactPhone ? (identity.business.phone || "").trim() : "";
  const emergency = o.emergencyPhone
    ? (identity.emergency.emergencyContacts || []).find((c) => c.visible && c.phone)
    : undefined;
  const showName = o.name && !!name;
  if (!showName && !contact && !emergency) return null;

  const fn = showName ? name : "مرحبا NFC";
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${vEsc(fn)}`,
    `N:${vEsc(fn)};;;;`,
    contact ? `TEL;TYPE=CELL:${contact}` : "",
    emergency ? `TEL;TYPE=HOME:${emergency.phone.trim()}` : "",
    `URL:${pageUrl}`,
    "END:VCARD",
  ].filter(Boolean);
  return lines.join("\n");
}

const QR_PX = 1200; // دقة عالية للطباعة؛ العرض داخل التطبيق يصغَّر بالـ CSS

/** يرسم رمز QR بتصحيح أخطاء عالٍ وشعار مرحبا بارزاً في المنتصف مع كلمة عربية (أونلاين/أوفلاين) */
async function drawBadgedQR(canvas: HTMLCanvasElement, text: string, label: string, isCancelled: () => boolean) {
  await QRCode.toCanvas(canvas, text, {
    width: QR_PX,
    margin: 2,
    errorCorrectionLevel: "H",
    color: { dark: "#1a1a1a", light: "#ffffff" }, // الوضع القياسي ليقرأه أي جوال
  });
  if (isCancelled()) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const size = w * 0.3; // 30% من العرض (≈9% من المساحة) ويتحمله تصحيح الأخطاء
  const x = (w - size) / 2;
  const y = (canvas.height - size) / 2;
  const draw = (img?: HTMLImageElement) => {
    if (isCancelled()) return;
    ctx.fillStyle = "#1a1a1a";
    ctx.strokeStyle = "#b8962e";
    ctx.lineWidth = size * 0.035;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, size * 0.15);
    ctx.fill();
    ctx.stroke();
    if (img) {
      const ls = size * 0.62; // الشعار هو الأبرز
      ctx.drawImage(img, x + (size - ls) / 2, y + size * 0.06, ls, ls);
    }
    ctx.fillStyle = "#e6c35a";
    ctx.font = `bold ${size * 0.17}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + size / 2, y + size * 0.86);
  };
  const img = new Image();
  img.onload = () => draw(img);
  img.onerror = () => draw();
  img.src = marhabaLogo;
}

export default function ShareModal({ identityName, serialNumber, identity, onClose }: ShareModalProps) {
  const { t } = useApp();
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offlineCanvasRef = useRef<HTMLCanvasElement>(null);

  // البطاقات الجديدة: ?c=الرمز العشوائي، والقديمة: ?serial=
  const [token, setToken] = useState<string | null | undefined>(undefined);
  useEffect(() => { myCardToken(serialNumber).then(setToken); }, [serialNumber]);
  const url = token
    ? `https://marhabanid.com/?c=${encodeURIComponent(token)}`
    : `https://marhabanid.com/?serial=${encodeURIComponent(serialNumber)}`;

  const vcard = buildOfflineVCard(identity, identityName, url);

  useEffect(() => {
    const c = offlineCanvasRef.current;
    if (!c || !vcard) return;
    let cancelled = false;
    drawBadgedQR(c, vcard, "أوفلاين", () => cancelled);
    return () => { cancelled = true; };
  }, [vcard]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    let cancelled = false;
    drawBadgedQR(c, url, "أونلاين", () => cancelled);
    return () => { cancelled = true; };
  }, [url]);

  const shareOfflineQR = () => {
    const c = offlineCanvasRef.current;
    if (!c) return;
    c.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `marhaba-offline-${serialNumber}.png`, { type: "image/png" });
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: identityName });
        } else if (navigator.share) {
          await navigator.share({ title: identityName, url });
        } else {
          downloadOfflineQR();
        }
      } catch {
        /* أُلغيت المشاركة */
      }
    }, "image/png");
  };

  const downloadQR = () => {
    const c = canvasRef.current;
    if (!c) return;
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `marhaba-${serialNumber}.png`;
    a.click();
  };

  const downloadOfflineQR = () => {
    const c = offlineCanvasRef.current;
    if (!c) return;
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `marhaba-offline-${serialNumber}.png`;
    a.click();
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: identityName, url });
      } catch {
        /* أُلغيت المشاركة */
      }
    } else {
      await copyLink();
    }
  };

  // يُرسم في body (خارج حاوية التطبيق التي تمنع التمرير) والتمرير على الطبقة نفسها كما في صفحة القراءة
  return createPortal(
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        height: "100dvh", zIndex: 9999,
        background: "rgba(0,0,0,0.7)",
        overflowY: "scroll", overflowX: "hidden",
        WebkitOverflowScrolling: "touch", touchAction: "pan-y", overscrollBehavior: "contain",
      }}
      onClick={onClose}
    >
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div
        style={{
          background: "var(--card-bg)",
          borderRadius: "24px 24px 0 0",
          width: "100%", maxWidth: 480,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "28px 24px 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border-color)", marginBottom: 4 }} />

        <p style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          {identityName}
        </p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "-12px 0 0", fontFamily: "monospace" }}>
          {serialNumber}
        </p>

        {/* رمز البطاقة (أونلاين) */}
        <div style={{ padding: 10, background: "#ffffff", borderRadius: 16, border: "3px solid var(--gold-base, #b8962e)", boxShadow: "0 0 24px rgba(184,150,46,0.3)" }}>
          <canvas ref={canvasRef} style={{ display: "block", width: "min(60vw, 220px)", height: "min(60vw, 220px)", borderRadius: 8 }} />
        </div>

        {/* رابط البطاقة */}
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, textAlign: "center", wordBreak: "break-all" }}>
          {url}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%" }}>
          <button
            onClick={copyLink}
            style={{
              padding: "12px 0", borderRadius: 12, border: "1px solid var(--border-color)",
              background: copied ? "var(--gold-base, #b8962e)" : "var(--card-alt-bg, var(--card-bg))", color: copied ? "#000" : "var(--text-primary)",
              fontWeight: 600, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            {copied ? "✓" : "🔗"} {copied ? (t("copied") || "Copied!") : (t("copyLink") || "Copy Link")}
          </button>
          <button
            onClick={nativeShare}
            style={{
              padding: "12px 0", borderRadius: 12, border: "1px solid var(--border-color)",
              background: "var(--card-alt-bg, var(--card-bg))", color: "var(--text-primary)",
              fontWeight: 600, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            ↗ {t("share") || "Share"}
          </button>
          <button
            onClick={downloadQR}
            style={{
              padding: "12px 0", borderRadius: 12, border: "1px solid var(--border-color)",
              background: "var(--card-alt-bg, var(--card-bg))", color: "var(--text-primary)",
              fontWeight: 600, fontSize: 14, cursor: "pointer", gridColumn: "1 / -1",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            ⬇ {t("downloadQR") || "Download QR"}
          </button>
        </div>

        {/* QR دون إنترنت */}
        {vcard && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingTop: 4 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              📵 رمز QR أوفلاين (يعمل دون إنترنت)
            </p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, textAlign: "center", lineHeight: 1.7 }}>
              من يمسحه بكاميرا جواله يرى الاسم والرقم مع زر «حفظ جهة اتصال» حتى بدون إنترنت.
              البيانات ثابتة وقت الطباعة، فإن تغيّر الرقم يُنشأ رمز جديد. تتحكم في ما يظهر من الإعدادات ← بيانات القراءة دون إنترنت.
            </p>
            <div style={{ padding: 10, background: "#ffffff", borderRadius: 16, border: "3px solid var(--gold-base, #b8962e)" }}>
              <canvas ref={offlineCanvasRef} style={{ display: "block", width: "min(60vw, 220px)", height: "min(60vw, 220px)", borderRadius: 8 }} />
            </div>
            <button
              onClick={downloadOfflineQR}
              style={{
                padding: "12px 0", borderRadius: 12, border: "1px solid var(--border-color)",
                background: "var(--card-alt-bg, var(--card-bg))", color: "var(--text-primary)",
                fontWeight: 600, fontSize: 14, cursor: "pointer", width: "100%",
              }}
            >
              ⬇ تحميل رمز QR أوفلاين
            </button>
            <button
              onClick={shareOfflineQR}
              style={{
                padding: "12px 0", borderRadius: 12, border: "1px solid var(--border-color)",
                background: "var(--card-alt-bg, var(--card-bg))", color: "var(--text-primary)",
                fontWeight: 600, fontSize: 14, cursor: "pointer", width: "100%",
              }}
            >
              📤 مشاركة رمز QR أوفلاين
            </button>
          </div>
        )}

        </div>
      </div>
      </div>
    </div>,
    document.body
  );
}
