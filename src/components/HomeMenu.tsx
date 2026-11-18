import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useCompany } from "../hooks/useCompany";
import AdminPanel from "./AdminPanel";

const WA_NUMBER = "966500816798";
const SITE = "https://welcome.marhabanid.com";

type View = "menu" | "help" | "services";

// الخدمات الرقمية الأخرى: عدّلي هذه القائمة بحرية (الأيقونة، العنوان، الوصف، ونص رسالة الاستفسار)
const SERVICES: { icon: string; title: string; desc: string; msg: string }[] = [
  { icon: "🍽️", title: "منيو وكتالوج رقمي", desc: "للمطاعم والكافيهات والمتاجر: باركود ثابت ومحتوى يتجدد في أي وقت", msg: "أرغب بالاستفسار عن المنيو/الكتالوج الرقمي بباركود ثابت" },
  { icon: "🔐", title: "المستندات المحمية", desc: "ملفات خاصة بروابط برمز أو مدة أو مرة واحدة، في بطاقة الطوارئ أو الأعمال", msg: "أرغب بتفعيل خاصية المستندات المحمية" },
  { icon: "💼", title: "أعمال وهدايا", desc: "معرض أعمال وهدايا بعروض وسحوبات وكتالوج وإحصائيات", msg: "أرغب بتفعيل خاصية أعمال وهدايا" },
  { icon: "🏢", title: "بطاقات الشركات والموظفين", desc: "بطاقة لكل موظف بهوية موحدة وإحصائيات", msg: "أرغب بالاستفسار عن بطاقات الموظفين (مرحباً للشركات)" },
  { icon: "🎁", title: "هدايا وسحوبات رقمية", desc: "هدية ذكية بعروض وسحوبات تُشارَك بضغطة", msg: "أرغب بالاستفسار عن الهدايا والسحوبات الرقمية" },
  { icon: "🎪", title: "خدمة الفعاليات", desc: "بطاقة فعالية بعروض وسحوبات وتقويم وراعٍ", msg: "أرغب بالاستفسار عن خدمة مرحباً للفعاليات" },
  { icon: "🚚", title: "تأكيد استلام الطلبات", desc: "لشركات التوصيل: يلمس العميل بطاقة المندوب فيُسجَّل التسليم والموقع", msg: "أرغب بالاستفسار عن خدمة تأكيد استلام الطلبات لشركة توصيل" },
  { icon: "🛡️", title: "بطاقات الطوارئ والعائلة", desc: "بيانات الإسعاف وأرقام الأهل عند الحاجة", msg: "أرغب بالاستفسار عن بطاقات الطوارئ للعائلة" },
  { icon: "🎨", title: "تصميم هوية وصفحة تعريفية", desc: "شعار وهوية بصرية وصفحة رقمية لنشاطك", msg: "أرغب بالاستفسار عن تصميم هوية وصفحة رقمية" },
  { icon: "💡", title: "خدمة أخرى حسب طلبك", desc: "اكتبي لنا فكرتك ونفكر معك في الحل", msg: "لدي فكرة لخدمة رقمية وأرغب بمناقشتها" },
];

// قائمة الثلاث خطوط في الصفحة الرئيسية: تعليمات، الإكسسوار، الإعدادات، الدعم…
export default function HomeMenu({ onClose }: { onClose: () => void }) {
  const { lang, setScreen, isAdmin } = useApp();
  const { org } = useCompany();
  const ar = lang === "ar";
  const [view, setView] = useState<View>("menu");
  const [admin, setAdmin] = useState(false);

  const go = (s: string) => { onClose(); setScreen(s as any); };

  const share = async () => {
    const text = ar ? "مرحبا NFC: بطاقات ذكية للأعمال والطوارئ والفعاليات" : "Marhaba NFC: smart cards for business, emergency and events";
    try {
      if (navigator.share) { await navigator.share({ title: "مرحبا NFC", text, url: SITE }); return; }
    } catch { return; }
    try { await navigator.clipboard.writeText(SITE); alert(ar ? "تم نسخ الرابط" : "Link copied"); } catch { window.prompt("", SITE); }
  };

  const steps: { t: string; d: string }[] = ar ? [
    { t: "ابدئي بإضافة هوية", d: "من الصفحة الرئيسية اضغطي «إضافة هوية جديدة»." },
    { t: "اربطي بطاقتك", d: "اكتبي رقم البطاقة المطبوع عليها (MARHABA-…) ورمز التفعيل المرفق معها، ثم اضغطي ربط." },
    { t: "اختاري نوع الهوية", d: "الطوارئ لبيانات الإسعاف وأرقام ذويك، الأعمال لبطاقتك المهنية، الفعاليات لبطاقة فعالية أو معرض." },
    { t: "املئي بياناتك", d: "الاسم والصورة والجوال والروابط، وأضيفي موقعاً أو أكثر بزر ➕ عند الحاجة. كل حقل اختياري عدا الاسم." },
    { t: "احفظي وجرّبي", d: "اضغطي «حفظ». ثم قرّبي البطاقة من جوال آخر أو امسحي رمز QR لترى كيف تظهر للناس." },
    { t: "عدّلي في أي وقت", d: "افتحي الهوية من القائمة وغيّري بياناتها، والبطاقة نفسها لا تتغير: الرابط ثابت والمحتوى يتحدث." },
  ] : [
    { t: "Start a new identity", d: "From Home tap “Add new identity”." },
    { t: "Link your card", d: "Enter the card number printed on it (MARHABA-…) and the activation code that came with it." },
    { t: "Choose the type", d: "Emergency for medical info and contacts, Business for your professional card, Events for an event or exhibition." },
    { t: "Fill in your details", d: "Name, photo, phone and links. Use ➕ to add more locations. Everything is optional except the name." },
    { t: "Save and test", d: "Tap Save, then tap the card on another phone or scan the QR to see what people see." },
    { t: "Edit any time", d: "Open the identity from the list and change it. The link stays the same and the content updates." },
  ];

  const item = (icon: string, label: string, sub: string | null, onClick: () => void) => (
    <button key={label} onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "13px 4px", background: "none",
      border: "none", borderBottom: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "inherit",
      fontSize: 15, cursor: "pointer", textAlign: "start",
    }}>
      <span style={{ fontSize: 22, width: 30, textAlign: "center" }}>{icon}</span>
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", fontWeight: 700 }}>{label}</span>
        {sub && <span style={{ display: "block", fontSize: 12, color: "var(--muted-foreground)", marginTop: 1 }}>{sub}</span>}
      </span>
    </button>
  );

  if (admin) return <AdminPanel onClose={() => setAdmin(false)} />;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} dir={ar ? "rtl" : "ltr"} style={{
        width: "100%", maxWidth: 520, maxHeight: "86vh", overflowY: "auto", background: "var(--card)",
        borderRadius: "20px 20px 0 0", padding: "18px 20px 28px", border: "1px solid var(--border-strong)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>
            {view === "help" ? (ar ? "📖 طريقة إنشاء هويتك" : "📖 How to create your identity") : view === "services" ? (ar ? "🧩 خدمات رقمية أخرى" : "🧩 Other digital services") : (ar ? "القائمة" : "Menu")}
          </div>
          <button onClick={view !== "menu" ? () => setView("menu") : onClose} aria-label="close"
            style={{ background: "none", border: "none", color: "var(--muted-foreground)", fontSize: 22, cursor: "pointer" }}>
            {view !== "menu" ? (ar ? "→" : "←") : "✕"}
          </button>
        </div>

        {view === "menu" && (
          <>
            {item("📖", ar ? "تعليمات إنشاء الهوية" : "How to create an identity", ar ? "الخطوات من الربط حتى المشاركة" : "Steps from linking to sharing", () => setView("help"))}
            {item("🧩", ar ? "خدمات رقمية أخرى" : "Other digital services", ar ? "منيو رقمي، شركات، فعاليات، توصيل… واسألي عبر واتساب" : "Ask us on WhatsApp", () => setView("services"))}
            {isAdmin && item("🛠", "لوحة المشتركين", "تفعيل الخصائص المدفوعة بالبريد", () => setAdmin(true))}
            {org && item("🏢", ar ? "مرحباً للشركات" : "Marhaba for Business", org.name, () => go("company"))}
            {item("📤", ar ? "شارك التطبيق" : "Share the app", null, share)}
            {item("🌐", ar ? "موقع مرحبا" : "Website", "welcome.marhabanid.com", () => window.open(SITE, "_blank", "noopener"))}
          </>
        )}

        {view === "services" && (
          <div style={{ marginTop: 6 }}>
            <p style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.7, margin: "0 0 6px" }}>
              اضغطي على الخدمة لتفتح محادثة واتساب جاهزة للاستفسار.
            </p>
            {SERVICES.map((sv) => item(sv.icon, sv.title, sv.desc, () => {
              window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`مرحباً مرحبا NFC 👋\n${sv.msg}`)}`, "_blank", "noopener");
            }))}
          </div>
        )}

        {view === "help" && (
          <div style={{ marginTop: 10 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%", background: "var(--primary)", color: "#000", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{i + 1}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{s.t}</div>
                  <div style={{ fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.7, marginTop: 2 }}>{s.d}</div>
                </div>
              </div>
            ))}
            <button className="btn-ghost" style={{ width: "100%", marginTop: 4 }} onClick={() => {
              window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(ar ? "مرحباً، أحتاج مساعدة في إنشاء هويتي" : "Hello, I need help creating my identity")}`, "_blank", "noopener");
            }}>💬 {ar ? "ما زلت أحتاج مساعدة" : "I still need help"}</button>
          </div>
        )}
      </div>
    </div>
  );
}
