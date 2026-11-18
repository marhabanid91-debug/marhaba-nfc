import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabase";

type Lookup = {
  found: boolean; gifts_plan?: boolean; gifts_until?: string | null; vault_plan?: boolean; vault_until?: string | null;
  org_name?: string | null; org_active?: boolean;
};
type Sub = { email: string; gifts: boolean; gifts_until: string | null; vault: boolean; vault_until: string | null; org: string | null };

const fmt = (iso?: string | null) => {
  if (!iso) return "دائم";
  try { return new Date(iso).toLocaleDateString("ar-SA", { dateStyle: "medium" }); } catch { return iso; }
};

const ERR: Record<string, string> = {
  not_admin: "هذا الحساب ليس مديراً", no_user: "لا يوجد حساب بهذا البريد، اطلب منه التسجيل أولاً",
  no_profile: "تعذّر إنشاء ملف الحساب", name_required: "اكتب اسم الشركة", bad_feature: "خاصية غير معروفة",
};

// لوحة المشتركين: للمدير فقط. تفعّل أو توقف الخصائص المدفوعة بالبريد بدل SQL
export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [info, setInfo] = useState<Lookup | null>(null);
  const [orgName, setOrgName] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [subs, setSubs] = useState<Sub[] | null>(null);

  const loadSubs = async () => {
    const { data, error } = await supabase.rpc("admin_subscribers");
    setSubs(error ? [] : ((data as Sub[]) || []));
  };
  useEffect(() => { loadSubs(); }, []);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };
  const mail = email.trim().toLowerCase();

  const lookup = async () => {
    if (!mail) return;
    setBusy(true); setInfo(null);
    const { data, error } = await supabase.rpc("admin_lookup", { p_email: mail });
    setBusy(false);
    if (error || !data) return flash("تعذّر البحث. تأكد من تشغيل admin-panel.sql وأنك مدير");
    const r = data as Lookup;
    setInfo(r);
    if (!r.found) flash(ERR.no_user);
    else if (r.org_name) setOrgName(r.org_name);
  };

  const set = async (feature: "gifts" | "vault" | "company", months: number) => {
    if (months === 0 && !window.confirm("إيقاف هذه الخاصية لهذا الحساب؟")) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("admin_set_feature", { p_email: mail, p_feature: feature, p_months: months, p_name: orgName.trim() || null });
    setBusy(false);
    const r = data as { ok: boolean; error?: string } | null;
    if (error || !r?.ok) return flash(ERR[r?.error || ""] || "تعذّر التنفيذ");
    flash(months === 0 ? "تم الإيقاف ✓" : "تم التفعيل ✓");
    await lookup(); await loadSubs();
  };

  const btn = (label: string, months: number, feature: "gifts" | "vault" | "company", danger = false) => (
    <button key={label} disabled={busy} onClick={() => set(feature, months)} className="btn-ghost"
      style={{ padding: "7px 10px", fontSize: 12, color: danger ? "var(--emergency)" : undefined }}>{label}</button>
  );
  const row = (icon: string, title: string, on: boolean, until: string | null | undefined, feature: "gifts" | "vault" | "company", extra?: string) => (
    <div className="card" style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <b>{icon} {title}</b>
        <span style={{ fontSize: 12, color: on ? "#22c55e" : "var(--muted-foreground)" }}>
          {on ? (feature === "company" ? "مفعّلة" : `مفعّلة حتى ${fmt(until)}`) : "غير مفعّلة"}{extra}
        </span>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
        {feature === "company"
          ? <>{btn("تفعيل", 1, "company")}{on && btn("إيقاف", 0, "company", true)}</>
          : <>{btn("شهر", 1, feature)}{btn("3 أشهر", 3, feature)}{btn("سنة", 12, feature)}{btn("دائم", -1, feature)}{on && btn("إيقاف", 0, feature, true)}</>}
      </div>
    </div>
  );

  const active = (until: string | null | undefined, plan?: boolean) => !!plan && (!until || new Date(until) > new Date());

  return createPortal(
    <div dir="rtl" style={{ position: "fixed", inset: 0, zIndex: 210, overflowY: "auto", background: "var(--background)", color: "var(--foreground)", overscrollBehavior: "contain" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 20px 40px" }}>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--primary)", fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "0 0 12px" }}>→ رجوع</button>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px" }}>🛠 لوحة المشتركين</h1>
        <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: "0 0 14px", lineHeight: 1.7 }}>
          اكتب بريد العميل (الذي يسجّل به دخوله) ثم اضغط بحث، وفعّل الخاصية بعد استلام المبلغ.
        </p>
        {msg && <div style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 12 }}>{msg}</div>}

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input style={{ flex: 1, direction: "ltr", textAlign: "right" }} inputMode="email" autoCapitalize="none" value={email}
            onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && lookup()} placeholder="client@example.com" />
          <button className="btn-primary" disabled={busy || !mail} onClick={lookup} style={{ width: "auto", padding: "0 16px" }}>بحث</button>
        </div>

        {info?.found && (
          <>
            {row("💼", "أعمال وهدايا", active(info.gifts_until, info.gifts_plan), info.gifts_until, "gifts")}
            {row("🔐", "المستندات المحمية", active(info.vault_until, info.vault_plan), info.vault_until, "vault")}
            <input style={{ marginBottom: 8 }} value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="اسم الشركة (لتفعيل مرحباً للشركات)" />
            {row("🏢", "مرحباً للشركات", !!info.org_active, null, "company", info.org_name ? ` — ${info.org_name}` : "")}
          </>
        )}

        <div style={{ fontSize: 13, fontWeight: 700, margin: "20px 0 8px" }}>المشتركون الحاليون {subs ? `(${subs.length})` : ""}</div>
        {subs === null && <p style={{ color: "var(--muted-foreground)", fontSize: 13 }}>جاري التحميل…</p>}
        {subs?.length === 0 && <p style={{ color: "var(--muted-foreground)", fontSize: 13 }}>لا يوجد مشتركون بعد.</p>}
        {subs?.map((s) => (
          <button key={s.email} onClick={() => { setEmail(s.email); setInfo(null); }} className="card"
            style={{ display: "block", width: "100%", textAlign: "start", marginBottom: 8, fontFamily: "inherit", color: "inherit", cursor: "pointer" }}>
            <div style={{ fontWeight: 700, direction: "ltr", textAlign: "right", fontSize: 13 }}>{s.email}</div>
            <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 4, lineHeight: 1.8 }}>
              {s.gifts && <>💼 حتى {fmt(s.gifts_until)} · </>}
              {s.vault && <>🔐 حتى {fmt(s.vault_until)} · </>}
              {s.org && <>🏢 {s.org}</>}
            </div>
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}
