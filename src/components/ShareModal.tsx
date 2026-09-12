import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useApp } from "../context/AppContext";

interface ShareModalProps {
  identityName: string;
  serialNumber: string;
  onClose: () => void;
}

export default function ShareModal({ identityName, serialNumber, onClose }: ShareModalProps) {
  const { t } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  const url = `https://marhaba.com/id/${serialNumber}`;

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

