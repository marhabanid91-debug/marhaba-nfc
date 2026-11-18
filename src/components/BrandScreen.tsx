import { useState } from "react";
import { Org, OrgBrand } from "../hooks/useCompany";
import { saveBrand } from "../lib/company";
import { LocationFields, cleanLocations } from "./LocationFields";
import type { LocationItem } from "../types";

function BackBtn({ onBack }: { onBack: () => void }) {
  return (
    <button onClick={onBack} style={{ display: "inline-flex", gap: 6, background: "none", border: "none", color: "var(--primary)", fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "0 0 12px" }}>
      <span>→</span>رجوع
    </button>
  );
}

const FIELDS: { key: string; icon: string; label: string; placeholder: string }[] = [
  { key: "instagram", icon: "📸", label: "Instagram", placeholder: "https://instagram.com/…" },
  { key: "tiktok", icon: "🎵", label: "TikTok", placeholder: "https://tiktok.com/@…" },
  { key: "snapchat", icon: "👻", label: "Snapchat", placeholder: "https://snapchat.com/add/…" },
  { key: "twitter", icon: "🐦", label: "X", placeholder: "https://x.com/…" },
  { key: "linkedin", icon: "💼", label: "LinkedIn", placeholder: "https://linkedin.com/company/…" },
  { key: "youtube", icon: "▶️", label: "YouTube", placeholder: "https://youtube.com/@…" },
  { key: "facebook", icon: "👥", label: "Facebook", placeholder: "https://facebook.com/…" },
  { key: "whatsapp", icon: "💬", label: "WhatsApp", placeholder: "https://wa.me/9665…" },
  { key: "catalog", icon: "📖", label: "الكتالوج", placeholder: "https://…" },
  { key: "googleReview", icon: "⭐", label: "تقييم قوقل", placeholder: "https://g.page/r/…/review" },
];

const https = (v: string) => {
  const t = v.trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : "https://" + t.replace(/^@/, "");
};

export default function BrandScreen({ org, onBack, onSaved }: { org: Org; onBack: () => void; onSaved: (b: OrgBrand) => void }) {
  const b = org.brand || {};
  const [website, setWebsite] = useState(b.website || "");
  const [links, setLinks] = useState<Record<string, string>>(b.links || {});
  const [locations, setLocations] = useState<LocationItem[]>(b.locations || []);
  const [deliveryOn, setDeliveryOn] = useState(!!b.delivery?.enabled);
  const [deliveryWa, setDeliveryWa] = useState(b.delivery?.wa || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const save = async () => {
    setBusy(true);
    const cleanLinks: Record<string, string> = {};
    for (const f of FIELDS) { const v = https(links[f.key] || ""); if (v) cleanLinks[f.key] = v; }
    const brand: OrgBrand = { website: https(website), links: cleanLinks, locations: cleanLocations(locations),
      delivery: { enabled: deliveryOn, wa: deliveryWa.replace(/\D/g, "") } };
    const n = await saveBrand(org, brand);
    setBusy(false);
    if (n < 0) return setMsg("تعذّر الحفظ، تأكدي من تشغيل ملف company-cd.sql");
    onSaved(brand);
    setMsg(n === 0 ? "تم حفظ الهوية. ستُطبَّق على كل موظف جديد." : `تم الحفظ وتحديث ${n} بطاقة ✓`);
  };

  return (
    <div className="screen fade-in"><div style={{ padding: "24px 20px 0" }}>
      <BackBtn onBack={onBack} />
      <h1 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px" }}>🎨 هوية الشركة الموحدة</h1>
      <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: "0 0 16px", lineHeight: 1.7 }}>
        ما تكتبينه هنا يُطبَّق على بطاقات كل الموظفين الآن وعلى أي موظف جديد. الحقول الفارغة لا تغيّر شيئاً. اسم الشركة ({org.name}) يظهر في كل بطاقة.
      </p>
      {msg && <div style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 12 }}>{msg}</div>}

      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>🌐 موقع الشركة</div>
      <input style={{ direction: "ltr", textAlign: "right", marginBottom: 16 }} inputMode="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://company.com" />

      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>🔗 روابط الشركة</div>
      {FIELDS.map((f) => (
        <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ width: 28, textAlign: "center", fontSize: 18 }}>{f.icon}</span>
          <input style={{ flex: 1, direction: "ltr", textAlign: "right" }} inputMode="url" value={links[f.key] || ""}
            onChange={(e) => setLinks({ ...links, [f.key]: e.target.value })} placeholder={`${f.label}: ${f.placeholder}`} />
        </div>
      ))}

      <div style={{ margin: "16px 0 6px", fontSize: 13, fontWeight: 700 }}>📍 فروع الشركة (حتى 3)</div>
      <LocationFields value={locations} onChange={setLocations} />

      <div style={{ margin: "20px 0 6px", fontSize: 13, fontWeight: 700 }}>🚚 تأكيد استلام الطلبات</div>
      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, marginBottom: 8, cursor: "pointer" }}>
        <input type="checkbox" checked={deliveryOn} onChange={(e) => setDeliveryOn(e.target.checked)} style={{ width: 20, height: 20 }} />
        تفعيل زر «تأكيد الاستلام» على بطاقات المناديب
      </label>
      {deliveryOn && (
        <>
          <input style={{ direction: "ltr", textAlign: "right" }} inputMode="tel" value={deliveryWa} onChange={(e) => setDeliveryWa(e.target.value)}
            placeholder="واتساب الشركة لاستلام التأكيد: 9665xxxxxxxx" />
          <p style={{ fontSize: 11, color: "var(--muted-foreground)", margin: "6px 0 0", lineHeight: 1.7 }}>
            يلمس العميل بطاقة المندوب فيضغط «تأكيد الاستلام»، فيُسجَّل التسليم في لوحة «التسليمات» ويُعرض له زر لإرسال رسالة التأكيد لهذا الرقم.
          </p>
        </>
      )}

      <button className="btn-primary" disabled={busy} onClick={save} style={{ marginTop: 16, opacity: busy ? 0.7 : 1 }}>
        {busy ? "جاري التطبيق على البطاقات…" : "حفظ وتطبيق على الجميع"}
      </button>
      <div style={{ height: 24 }} />
    </div></div>
  );
}
