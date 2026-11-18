import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { activateCard, unlinkSerial } from "../lib/db";
import { Org } from "../hooks/useCompany";
import {
  Employee, EmployeeInput, listEmployees, createEmployee, updateEmployee, deleteEmployee, transferCard,
} from "../lib/company";

const empty: EmployeeInput = { name: "", jobTitle: "", phone: "", email: "" };
const SERIAL_PREFIX = "MARHABA-";

type Mode =
  | { k: "list" }
  | { k: "edit"; id: string | null }       // null = موظف جديد
  | { k: "card"; emp: Employee };           // ربط / نقل / فك بطاقة

export default function EmployeesScreen({ org, onBack }: { org: Org; onBack: () => void }) {
  const { supabaseUser } = useApp();
  const [list, setList] = useState<Employee[] | null>(null);
  const [mode, setMode] = useState<Mode>({ k: "list" });
  const [form, setForm] = useState<EmployeeInput>(empty);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [serial, setSerial] = useState(SERIAL_PREFIX);
  const [code, setCode] = useState("");

  const reload = async () => setList(await listEmployees(org.id));
  useEffect(() => { reload(); }, [org.id]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3500); };
  const inputStyle = { marginBottom: 8 } as const;

  const openEdit = (e: Employee | null) => {
    setForm(e ? { name: e.name, jobTitle: e.jobTitle, phone: e.phone, email: e.email } : empty);
    setMode({ k: "edit", id: e?.id ?? null });
  };

  const save = async () => {
    if (!form.name.trim()) return flash("اكتبي اسم الموظف");
    if (!supabaseUser) return;
    setBusy(true);
    const m = mode as { k: "edit"; id: string | null };
    const ok = m.id
      ? await updateEmployee(m.id, form)
      : !!(await createEmployee(org.id, org.name, supabaseUser.id, form));
    setBusy(false);
    if (!ok) return flash("تعذّر الحفظ، تأكدي من تشغيل ملف company-b.sql");
    await reload();
    setMode({ k: "list" });
    flash("تم الحفظ ✓");
  };

  const remove = async (e: Employee) => {
    if (!window.confirm(`حذف بطاقة ${e.name}؟ سيُفكّ ربط البطاقة وتصبح متاحة من جديد.`)) return;
    if (e.serial) await unlinkSerial(e.serial, e.id).catch(() => {});
    await deleteEmployee(e.id);
    await reload();
    flash("تم الحذف");
  };

  const link = async (e: Employee) => {
    const s = serial.trim().toUpperCase();
    if (!s || s === SERIAL_PREFIX || !code.trim()) return flash("اكتبي رقم البطاقة ورمز التفعيل");
    setBusy(true);
    const ok = await activateCard(s, code, e.id);
    setBusy(false);
    if (!ok) return flash("الرقم أو رمز التفعيل غير صحيح، أو البطاقة مستخدمة");
    setSerial(SERIAL_PREFIX); setCode("");
    await reload(); setMode({ k: "list" }); flash("تم ربط البطاقة ✓");
  };

  const transfer = async (e: Employee, to: Employee) => {
    if (!e.serial) return;
    if (!window.confirm(`نقل البطاقة ${e.serial} من ${e.name} إلى ${to.name}؟ الرابط يبقى كما هو.`)) return;
    setBusy(true);
    const ok = await transferCard(e.serial, to.id);
    setBusy(false);
    if (!ok) return flash("تعذّر النقل (قد يحمل الموظف الجديد بطاقة أخرى)");
    await reload(); setMode({ k: "list" }); flash("تم نقل البطاقة ✓");
  };

  const unlink = async (e: Employee) => {
    if (!e.serial || !window.confirm(`فك ربط البطاقة ${e.serial}؟`)) return;
    await unlinkSerial(e.serial, e.id).catch(() => {});
    await reload(); setMode({ k: "list" }); flash("تم فك الربط");
  };

  const back = (fn: () => void, label = "رجوع") => (
    <button onClick={fn} style={{ display: "inline-flex", gap: 6, background: "none", border: "none", color: "var(--primary)", fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "0 0 12px" }}>
      <span>→</span>{label}
    </button>
  );

  const toast = msg && (
    <div style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 12 }}>{msg}</div>
  );

  // ─── إضافة / تعديل ───
  if (mode.k === "edit") {
    return (
      <div className="screen fade-in"><div style={{ padding: "24px 20px 0" }}>
        {back(() => setMode({ k: "list" }))}
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 16px" }}>{mode.id ? "تعديل الموظف" : "موظف جديد"}</h1>
        {toast}
        <input style={inputStyle} placeholder="الاسم *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input style={inputStyle} placeholder="المسمى الوظيفي" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
        <input style={{ ...inputStyle, direction: "ltr" }} inputMode="tel" placeholder="الجوال 05xxxxxxxx" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input style={{ ...inputStyle, direction: "ltr" }} inputMode="email" placeholder="البريد الإلكتروني" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <button className="btn-primary" onClick={save} disabled={busy} style={{ marginTop: 8, opacity: busy ? 0.7 : 1 }}>{busy ? "..." : "حفظ"}</button>
      </div></div>
    );
  }

  // ─── البطاقة: ربط / نقل / فك ───
  if (mode.k === "card") {
    const e = list?.find((x) => x.id === mode.emp.id) || mode.emp;
    const others = (list || []).filter((x) => x.id !== e.id && !x.serial);
    return (
      <div className="screen fade-in"><div style={{ padding: "24px 20px 0" }}>
        {back(() => setMode({ k: "list" }))}
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px" }}>بطاقة {e.name}</h1>
        <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: "0 0 16px" }}>{e.serial ? `مرتبطة: ${e.serial}` : "لا توجد بطاقة مرتبطة"}</p>
        {toast}
        {!e.serial ? (
          <>
            <input style={{ ...inputStyle, direction: "ltr", letterSpacing: 2, textTransform: "uppercase" }} value={serial}
              onChange={(ev) => { let v = ev.target.value.toUpperCase(); if (!v.startsWith(SERIAL_PREFIX)) v = SERIAL_PREFIX + v.replace(/^M?A?R?H?A?B?A?-?/, ""); setSerial(v); }} placeholder="MARHABA-001" />
            <input style={{ ...inputStyle, direction: "ltr", letterSpacing: 2, textTransform: "uppercase" }} value={code}
              onChange={(ev) => setCode(ev.target.value.toUpperCase())} placeholder="رمز التفعيل XXXX-XXXX-XXXX" />
            <button className="btn-primary" disabled={busy} onClick={() => link(e)}>{busy ? "..." : "ربط البطاقة"}</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, margin: "4px 0 8px" }}>نقل البطاقة إلى موظف آخر (الرابط يبقى ثابتاً)</div>
            {others.length === 0 && <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 8 }}>لا يوجد موظف بدون بطاقة. أضيفي موظفاً جديداً أولاً.</div>}
            {others.map((o) => (
              <button key={o.id} className="btn-ghost" disabled={busy} onClick={() => transfer(e, o)} style={{ width: "100%", marginBottom: 8, textAlign: "start" }}>
                ↪ {o.name}{o.jobTitle ? ` — ${o.jobTitle}` : ""}
              </button>
            ))}
            <button className="btn-ghost" onClick={() => unlink(e)} style={{ width: "100%", marginTop: 8, color: "var(--emergency)" }}>فك ربط البطاقة</button>
          </>
        )}
      </div></div>
    );
  }

  // ─── القائمة ───
  return (
    <div className="screen fade-in"><div style={{ padding: "24px 20px 0" }}>
      {back(onBack)}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>👥 الموظفون {list ? `(${list.length})` : ""}</h1>
        <button className="btn-primary" onClick={() => openEdit(null)} style={{ padding: "8px 14px", width: "auto" }}>➕ موظف</button>
      </div>
      {toast}
      {list === null && <p style={{ color: "var(--muted-foreground)" }}>جاري التحميل…</p>}
      {list?.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 24, color: "var(--muted-foreground)", lineHeight: 1.8 }}>
          لا يوجد موظفون بعد.<br />اضغطي «➕ موظف» لإنشاء أول بطاقة.
        </div>
      )}
      {list?.map((e) => (
        <div key={e.id} className="card" style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{e.name || "بدون اسم"}</div>
          {e.jobTitle && <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>{e.jobTitle}</div>}
          <div style={{ fontSize: 12, marginTop: 6, color: e.serial ? "#22c55e" : "var(--muted-foreground)" }}>
            {e.serial ? `💳 ${e.serial}` : "بدون بطاقة بعد"}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="btn-ghost" style={{ flex: 1 }} onClick={() => openEdit(e)}>✏️ تعديل</button>
            <button className="btn-ghost" style={{ flex: 1 }} onClick={() => { setSerial(SERIAL_PREFIX); setCode(""); setMode({ k: "card", emp: e }); }}>💳 البطاقة</button>
            <button className="btn-ghost" style={{ color: "var(--emergency)" }} onClick={() => remove(e)} aria-label="حذف">🗑</button>
          </div>
        </div>
      ))}
    </div></div>
  );
}
