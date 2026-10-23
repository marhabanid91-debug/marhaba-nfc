import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useApp } from "../context/AppContext";
import { myCardToken } from "../lib/db";
import { Identity } from "../types";

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
    emergency ? `NOTE:${vEsc(`رقم الطوارئ${emergency.name ? ` (${emergency.name})` : ""}: ${emergency.phone.trim()}`)}` : "",
    `URL:${pageUrl}`,
    "END:VCARD",
  ].filter(Boolean);
  return lines.join("\n");
}

export default function ShareModal({ identityName, serialNumber, identity, onClose }: ShareModalProps) {
  const { t } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
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
    QRCode.toCanvas(c, vcard, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#b8962e", light: "#1a1a1a" },
    });
  }, [vcard]);

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

  const downloadOfflineQR = () => {
    const c = offlineCanvasRef.current;
    if (!c) return;
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `marhaba-offline-${serialNumber}.png`;
    a.click();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    QRCode.toCanvas(canvas, url, {
      width: 240,
      margin: 2,
      color: { dark: "#b8962e", light: "#1a1a1a" },
    });
    QRCode.toDataURL(url, {
      width: 240,
      margin: 2,
      color: { dark: "#b8962e", light: "#1a1a1a" },
    }).then(setQrDataUrl);
  }, [url]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: identityName, url });
    }
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `marhaba-${serialNumber}.png`;
    a.click();
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--card-bg)",
          borderRadius: "24px 24px 0 0",
          width: "100%", maxWidth: 480,
          padding: "28px 24px 40px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border-color)", marginBottom: 4 }} />

        <p style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          {identityName}
        </p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "-12px 0 0", fontFamily: "monospace" }}>
          {serialNumber}
        </p>

        {/* QR Canvas */}
        <div style={{
          padding: 12,
          background: "#1a1a1a",
          borderRadius: 16,
          border: "2px solid var(--gold-base, #b8962e)",
          boxShadow: "0 0 24px rgba(184,150,46,0.3)",
        }}>
          <canvas ref={canvasRef} style={{ display: "block", borderRadius: 8 }} />
        </div>

        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "-8px 0 0", textAlign: "center" }}>
          {url}
        </p>

        {/* QR دون إنترنت */}
        {vcard && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingTop: 4 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              📵 رمز QR يعمل دون إنترنت
            </p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, textAlign: "center", lineHeight: 1.7 }}>
              من يمسحه بكاميرا جواله يرى الاسم والرقم مع زر «حفظ جهة اتصال» حتى بدون إنترنت.
              البيانات ثابتة وقت الطباعة، فإن تغيّر الرقم يُنشأ رمز جديد. تتحكم في ما يظهر من الإعدادات ← بيانات القراءة دون إنترنت.
            </p>
            <div style={{ padding: 12, background: "#1a1a1a", borderRadius: 16, border: "2px solid var(--gold-base, #b8962e)" }}>
              <canvas ref={offlineCanvasRef} style={{ display: "block", borderRadius: 8 }} />
            </div>
            <button
              onClick={downloadOfflineQR}
              style={{
                padding: "12px 0", borderRadius: 12, border: "1px solid var(--border-color)",
                background: "var(--card-alt-bg, var(--card-bg))", color: "var(--text-primary)",
                fontWeight: 600, fontSize: 14, cursor: "pointer", width: "100%",
              }}
            >
              ⬇ تحميل رمز QR دون إنترنت
            </button>
            <button
              onClick={shareOfflineQR}
              style={{
                padding: "12px 0", borderRadius: 12, border: "1px solid var(--border-color)",
                background: "var(--card-alt-bg, var(--card-bg))", color: "var(--text-primary)",
                fontWeight: 600, fontSize: 14, cursor: "pointer", width: "100%",
              }}
            >
              📤 مشاركة رمز QR دون إنترنت
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%" }}>
          <button
            onClick={copyLink}
            style={{
              padding: "12px 0", borderRadius: 12, border: "1px solid var(--border-color)",
              background: copied ? "var(--gold-base, #b8962e)" : "var(--card-alt-bg, var(--card-bg))",
              color: copied ? "#000" : "var(--text-primary)",
              fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            {copied ? "✓" : "🔗"} {copied ? (t("copied") || "Copied!") : (t("copyLink") || "Copy Link")}
          </button>

          {typeof navigator !== "undefined" && "share" in navigator ? (
            <button
              onClick={nativeShare}
              style={{
                padding: "12px 0", borderRadius: 12, border: "1px solid var(--border-color)",
                background: "var(--card-alt-bg, var(--card-bg))",
                color: "var(--text-primary)",
                fontWeight: 600, fontSize: 14, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              ↗ {t("share") || "Share"}
            </button>
          ) : (
            <button
              onClick={downloadQR}
              style={{
                padding: "12px 0", borderRadius: 12, border: "1px solid var(--border-color)",
                background: "var(--card-alt-bg, var(--card-bg))",
                color: "var(--text-primary)",
                fontWeight: 600, fontSize: 14, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              ⬇ {t("downloadQR") || "Download QR"}
            </button>
          )}

          <button
            onClick={downloadQR}
            style={{
              padding: "12px 0", borderRadius: 12, border: "1px solid var(--border-color)",
              background: "var(--card-alt-bg, var(--card-bg))",
              color: "var(--text-primary)",
              fontWeight: 600, fontSize: 14, cursor: "pointer",
              gridColumn: "1 / -1",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            ⬇ {t("downloadQR") || "Download QR"}
          </button>
        </div>
      </div>
    </div>
  );
}
