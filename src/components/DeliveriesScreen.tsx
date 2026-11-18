import { useEffect, useState } from "react";
import { DeliveriesData, loadDeliveries } from "../lib/company";

export default function DeliveriesScreen({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<DeliveriesData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const load = () => { setLoaded(false); loadDeliveries().then((d) => { setData(d); setLoaded(true); }); };
  useEffect(load, []);
  const fmt = (iso: string) => { try { return new Date(iso).toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" }); } catch { return iso; } };

  return (
    <div className="screen fade-in"><div style={{ padding: "24px 20px 0" }}>
      <button onClick={onBack} style={{ display: "inline-flex", gap: 6, background: "none", border: "none", color: "var(--primary)", fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "0 0 12px" }}>
        <span>→</span>رجوع
      </button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 0 16px" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>🚚 التسليمات</h1>
        <button className="btn-ghost" onClick={load} style={{ padding: "6px 12px" }}>🔄 تحديث</button>
      </div>
      {!loaded && <p style={{ color: "var(--muted-foreground)" }}>جاري التحميل…</p>}
      {loaded && !data && (
        <div className="card" style={{ color: "var(--muted-foreground)", lineHeight: 1.8 }}>
          لا تتوفر البيانات. تأكدي من تشغيل ملف company-delivery.sql.
        </div>
      )}
      {data && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <div className="card" style={{ flex: 1, textAlign: "center", padding: 12 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--primary)" }}>{Number(data.today)}</div>
              <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>تسليمات اليوم</div>
            </div>
            <div className="card" style={{ flex: 1, textAlign: "center", padding: 12 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--primary)" }}>{Number(data.total)}</div>
              <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>الإجمالي</div>
            </div>
          </div>
          {data.items.length === 0 && (
            <div className="card" style={{ color: "var(--muted-foreground)", lineHeight: 1.8, textAlign: "center" }}>
              لا توجد تسليمات بعد. فعّلي الخاصية من «هوية الشركة الموحدة» وجرّبي بلمس بطاقة أحد المناديب.
            </div>
          )}
          {data.items.map((d) => (
            <div key={d.id} className="card" style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <b>{d.courier_name || "مندوب"}</b>
                <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{fmt(d.created_at)}</span>
              </div>
              <div style={{ fontSize: 13, marginTop: 4 }}>{d.order_no ? `الطلب: ${d.order_no}` : "بدون رقم طلب"}</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {d.lat != null && d.lng != null ? (
                  <a href={`https://maps.google.com/?q=${d.lat},${d.lng}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)" }}>📍 عرض الموقع على الخريطة</a>
                ) : <span style={{ color: "var(--muted-foreground)" }}>بدون موقع</span>}
              </div>
            </div>
          ))}
        </>
      )}
      <div style={{ height: 24 }} />
    </div></div>
  );
}
