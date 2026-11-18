import { useApp } from "../context/AppContext";
import { useState } from "react";
import { useCompany } from "../hooks/useCompany";
import EmployeesScreen from "./EmployeesScreen";
import BrandScreen from "./BrandScreen";
import BulkImportScreen from "./BulkImportScreen";
import OrgStatsScreen from "./OrgStatsScreen";
import DeliveriesScreen from "./DeliveriesScreen";

type View = "home" | "employees" | "brand" | "bulk" | "stats" | "deliveries";

const items: { view: Exclude<View, "home">; icon: string; title: string; desc: string }[] = [
  { view: "employees", icon: "👥", title: "الموظفون", desc: "قائمة بطاقات الشركة، إضافة وتعديل ونقل البطاقة لموظف جديد" },
  { view: "brand", icon: "🎨", title: "هوية الشركة الموحدة", desc: "موقع وروابط وفروع الشركة تظهر في كل بطاقة، وتتحدث مرة واحدة للجميع" },
  { view: "bulk", icon: "📥", title: "إضافة جماعية", desc: "الصقي قائمة الموظفين لإنشاء بطاقاتهم دفعة واحدة" },
  { view: "deliveries", icon: "🚚", title: "التسليمات", desc: "تأكيدات استلام العملاء لدى المناديب: الوقت والموقع ورقم الطلب" },
  { view: "stats", icon: "📊", title: "إحصائيات الشركة", desc: "عدد مرات المسح لكل موظف وللشركة كلها" },
];

export default function CompanyScreen() {
  const { setScreen, lang } = useApp();
  const { org, setOrg, loading } = useCompany();
  const ar = lang === "ar";
  const [view, setView] = useState<View>("home");

  const home = () => setView("home");
  if (org && view === "employees") return <EmployeesScreen org={org} onBack={home} />;
  if (org && view === "brand") return <BrandScreen org={org} onBack={home} onSaved={(brand) => setOrg({ ...org, brand })} />;
  if (org && view === "bulk") return <BulkImportScreen org={org} onBack={home} />;
  if (org && view === "deliveries") return <DeliveriesScreen onBack={home} />;
  if (org && view === "stats") return <OrgStatsScreen org={org} onBack={home} />;

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

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map((u) => (
                <button
                  key={u.view}
                  onClick={() => setView(u.view)}
                  className="card"
                  style={{ display: "flex", width: "100%", gap: 12, alignItems: "center", cursor: "pointer", fontFamily: "inherit", color: "inherit", textAlign: "start", border: "1px solid var(--primary)" }}
                >
                  <span style={{ fontSize: 26 }}>{u.icon}</span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontWeight: 700, fontSize: 15 }}>{u.title}</span>
                    <span style={{ display: "block", fontSize: 12, color: "var(--muted-foreground)", marginTop: 2, lineHeight: 1.6 }}>{u.desc}</span>
                  </span>
                  <span style={{ color: "var(--primary)" }}>{ar ? "‹" : "›"}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
