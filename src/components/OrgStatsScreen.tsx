import { useEffect, useState } from "react";
import { Org } from "../hooks/useCompany";
import { Employee, OrgStats, listEmployees, loadOrgStats } from "../lib/company";

function BackBtn({ onBack }: { onBack: () => void }) {
  return (
    <button onClick={onBack} style={{ display: "inline-flex", gap: 6, background: "none", border: "none", color: "var(--primary)", fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "0 0 12px" }}>
      <span>→</span>رجوع
    </button>
  );
}

export default function OrgStatsScreen({ org, onBack }: { org: Org; onBack: () => void }) {
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [emps, setEmps] = useState<Employee[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([loadOrgStats(), listEmployees(org.id)]).then(([s, e]) => { setStats(s); setEmps(e); setLoaded(true); });
  }, [org.id]);

  const name = (id: string) => emps.find((e) => e.id === id)?.name || "—";
  const rows = [...(stats?.employees || [])].sort((a, b) => b.opens - a.opens);
  const max = Math.max(1, ...(stats?.days || []).map((d) => d.n));
  const stat = (label: string, v: number) => (
    <div className="card" style={{ flex: 1, textAlign: "center", padding: 12 }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: "var(--primary)" }}>{v}</div>
      <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{label}</div>
    </div>
  );

  return (
    <div className="screen fade-in"><div style={{ padding: "24px 20px 0" }}>
      <BackBtn onBack={onBack} />
      <h1 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 16px" }}>📊 إحصائيات الشركة</h1>
      {!loaded && <p style={{ color: "var(--muted-foreground)" }}>جاري التحميل…</p>}
      {loaded && !stats && (
        <div className="card" style={{ color: "var(--muted-foreground)", lineHeight: 1.8 }}>
          لا توجد إحصائيات بعد. تأكدي من تشغيل ملفي stats.sql و company-cd.sql.
        </div>
      )}
      {stats && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {stat("مرات فتح البطاقات", Number(stats.opens))}
            {stat("أجهزة مختلفة", Number(stats.devices))}
            {stat("موظفون", emps.length)}
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>آخر ٧ أيام</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 70 }}>
              {stats.days.map((d) => (
                <div key={d.day} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{d.n || ""}</div>
                  <div style={{ height: Math.max(3, (Number(d.n) / max) * 50), background: "var(--primary)", borderRadius: 4, opacity: d.n ? 1 : 0.25 }} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>حسب الموظف</div>
          {rows.length === 0 && <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>لا يوجد موظفون بعد.</div>}
          {rows.map((r, i) => (
            <div key={r.id} className="card" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ width: 22, color: "var(--muted-foreground)", fontSize: 12 }}>{i + 1}</span>
              <span style={{ flex: 1, fontWeight: 600 }}>{name(r.id)}</span>
              <span style={{ fontSize: 12, textAlign: "end", lineHeight: 1.6 }}>
                👁 {Number(r.opens)}<br /><span style={{ color: "var(--muted-foreground)" }}>💬 {Number(r.contacts)}</span>
              </span>
            </div>
          ))}
        </>
      )}
      <div style={{ height: 24 }} />
    </div></div>
  );
}
