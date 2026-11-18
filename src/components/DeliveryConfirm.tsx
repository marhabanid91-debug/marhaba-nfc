import { useState } from "react";
import { supabase } from "../lib/supabase";

function deviceId(): string {
  try {
    let id = localStorage.getItem("mh_dev");
    if (!id) { id = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("mh_dev", id); }
    return id;
  } catch { return "t" + Math.random().toString(36).slice(2, 12); }
}

function getPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 30000 },
    );
  });
}

// زر تأكيد الاستلام يظهر على بطاقة المندوب. يضغطه العميل بعد لمس البطاقة.
export default function DeliveryConfirm({ identityId, courier, company, wa, color }: {
  identityId: string; courier?: string; company?: string; wa?: string; color: string;
}) {
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<{ lat: number; lng: number } | null | false>(false);

  const confirm = async () => {
    setBusy(true); setErr("");
    const pos = await getPosition();
    const { data, error } = await supabase.rpc("confirm_delivery", {
      p_identity: identityId, p_order: order.trim() || null,
      p_lat: pos?.lat ?? null, p_lng: pos?.lng ?? null, p_device: deviceId(),
    });
    setBusy(false);
    if (error || !(data as any)?.ok) return setErr("تعذّر تأكيد الاستلام الآن، حاولي مرة أخرى.");
    setDone(pos);
  };

  const waText = () => {
    const t = new Date().toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" });
    const loc = done ? `\nالموقع: https://maps.google.com/?q=${done.lat},${done.lng}` : "";
    return `تأكيد استلام ✅\nتم استلام الطلب${order.trim() ? ` رقم ${order.trim()}` : ""} من المندوب ${courier || ""}${company ? ` (${company})` : ""}\nالوقت: ${t}${loc}`;
  };

  const box = { marginTop: 12, padding: 16, borderRadius: 14, border: `1.5px solid ${color}55`, background: `${color}10` } as const;

  if (done !== false) {
    return (
      <div style={{ ...box, textAlign: "center" }}>
        <div style={{ fontSize: 36 }}>✅</div>
        <div style={{ fontWeight: 800, fontSize: 16, margin: "4px 0" }}>تم تأكيد استلامك، شكراً لك</div>
        {wa && (
          <a href={`https://wa.me/${wa}?text=${encodeURIComponent(waText())}`} target="_blank" rel="noopener noreferrer"
            style={{ display: "block", marginTop: 12, padding: "12px 16px", borderRadius: 12, background: "#25D366", color: "#fff", fontWeight: 700, textDecoration: "none" }}>
            💬 أرسل التأكيد للشركة عبر واتساب
          </a>
        )}
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginTop: 12, padding: 16,
        borderRadius: 14, border: 0, background: color, color: "#000", fontWeight: 800, fontSize: 17, cursor: "pointer", fontFamily: "inherit",
      }}>
        ✅ تأكيد استلام الطلب
      </button>
    );
  }

  return (
    <div style={box}>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>تأكيد استلام الطلب</div>
      <input value={order} onChange={(e) => setOrder(e.target.value)} maxLength={40} inputMode="text"
        placeholder="رقم الطلب (اختياري)" style={{ marginBottom: 8 }} />
      <p style={{ fontSize: 11, opacity: 0.7, lineHeight: 1.7, margin: "0 0 10px" }}>
        سنطلب إذن موقعك لتأكيد التسليم فقط، ولن نستخدمه لغير ذلك. يمكنك الرفض ويُسجَّل التأكيد بدون موقع.
      </p>
      {err && <div style={{ color: "var(--emergency)", fontSize: 12, marginBottom: 8 }}>⚠ {err}</div>}
      <button type="button" disabled={busy} onClick={confirm} style={{
        width: "100%", padding: 14, borderRadius: 12, border: 0, background: color, color: "#000", fontWeight: 800,
        fontSize: 16, cursor: "pointer", fontFamily: "inherit", opacity: busy ? 0.7 : 1,
      }}>
        {busy ? "جاري التأكيد…" : "تأكيد الاستلام"}
      </button>
      <button type="button" onClick={() => setOpen(false)} style={{ width: "100%", marginTop: 8, background: "none", border: 0, color: "inherit", opacity: 0.7, cursor: "pointer", fontFamily: "inherit" }}>
        إلغاء
      </button>
    </div>
  );
}
