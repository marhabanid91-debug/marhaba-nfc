import { useApp } from "../context/AppContext";
import { useCompany } from "../hooks/useCompany";

const upcoming = [
  { icon: "👥", title: "الموظفون", desc: "قائمة بطاقات الشركة، إضافة وتعديل ونقل البطاقة لموظف جديد" },
  { icon: "🎨", title: "هوية الشركة الموحدة", desc: "شعار وروابط وفروع الشركة تظهر في كل بطاقة، وتتحدث مرة واحدة للجميع" },
  { icon: "📥", title: "إضافة جماعية", desc: "الصقي قائمة الموظفين لإنشاء بطاقاتهم دفعة واحدة" },
  { icon: "📊", title: "إحصائيات الشركة", desc: "عدد مرات المسح لكل موظف وللشركة كلها" },
];

export default function CompanyScreen() {
  const { setScreen, lang } = useApp();
  const { org, loading } = useCompany();
  const ar = lang === "ar";

  return (
    <div className="screen fade-in">
      <div style={{ padding: "24px 20px 0" }}>
        <button
          onClick={() => setScreen("settings")}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--primary)", fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "0 0 12px" }}
        >
          <span>{ar ? "→" : "←"}</span>{ar ? "رجوع" : "Back"}
        </button>

        {!loading && !org ? (
          <div className="card" style={{ textAlign: "center", padding: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🔒</div>
            <div style={{ fontWeight: 700 }}>خاصية الشركات غير مفعّلة لحسابك</div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>تواصل معنا لتفعيلها.</div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(201,168,76,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏢</div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{org?.name || "..."}</h1>
                <p style={{ fontSize: 12, color: "#22c55e", margin: 0 }}>✅ {ar ? "مرحباً للشركات مفعّلة" : "Marhaba for Business is active"}</p>
              </div>
            </div>

            <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 10 }}>
              {ar ? "المزايا قيد التجهيز وستظهر هنا تباعًا:" : "Features coming soon:"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {upcoming.map((u) => (
                <div key={u.title} className="card" style={{ display: "flex", gap: 12, alignItems: "center", opacity: 0.75 }}>
                  <span style={{ fontSize: 26 }}>{u.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{u.title}</div>
                    <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2, lineHeight: 1.6 }}>{u.desc}</div>
                  </div>
                  <span style={{ fontSize: 11, opacity: 0.6 }}>{ar ? "قريبًا" : "Soon"}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
