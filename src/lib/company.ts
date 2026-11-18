import { supabase } from "./supabase";
import type { Org, OrgBrand } from "../hooks/useCompany";

export interface Employee {
  id: string;
  name: string;
  jobTitle: string;
  phone: string;
  email: string;
  serial: string | null;
}

export interface EmployeeInput {
  name: string;
  jobTitle: string;
  phone: string;
  email: string;
}

export async function listEmployees(orgId: string): Promise<Employee[]> {
  const { data: ids, error } = await supabase
    .from("identities")
    .select("id, name, serial_number")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true });
  if (error || !ids?.length) return [];
  const { data: biz } = await supabase
    .from("business_data")
    .select("identity_id, name, job_title, phone, email")
    .in("identity_id", ids.map((r: any) => r.id));
  const byId = new Map<string, any>((biz || []).map((b: any) => [b.identity_id, b]));
  return ids.map((r: any) => {
    const b = byId.get(r.id) || {};
    return {
      id: r.id,
      name: b.name || r.name || "",
      jobTitle: b.job_title || "",
      phone: b.phone || "",
      email: b.email || "",
      serial: r.serial_number || null,
    };
  });
}

/** يطبّق هوية الشركة على صف بيانات الأعمال: الاسم، الموقع، الروابط (غير الفارغة فقط)، الفروع */
function brandPatch(org: Org, existingLinks: Record<string, string> = {}) {
  const b = org.brand || {};
  const patch: Record<string, any> = { company: org.name };
  if (b.website) patch.website = b.website;
  const links: Record<string, string> = { ...existingLinks };
  for (const [k, v] of Object.entries(b.links || {})) if (v) links[k] = v;
  // تأكيد الاستلام: علامة تظهر زر التأكيد على بطاقة الموظف (الدالة في قاعدة البيانات تتحقق من الهوية نفسها)
  delete links.deliveryConfirm; delete links.deliveryWa;
  if (b.delivery?.enabled) {
    links.deliveryConfirm = "1";
    const wa = (b.delivery.wa || "").replace(/\D/g, "");
    if (wa) links.deliveryWa = wa;
  }
  patch.social_links = links;
  if (b.locations && b.locations.length) patch.locations = b.locations;
  return patch;
}

export async function createEmployee(org: Org, ownerId: string, f: EmployeeInput): Promise<string | null> {
  const { data, error } = await supabase
    .from("identities")
    .insert({ user_id: ownerId, name: f.name, active_mode: "business", is_active: true, organization_id: org.id })
    .select("id")
    .single();
  if (error || !data) return null;
  await Promise.allSettled([
    supabase.from("emergency_data").insert({ identity_id: data.id, name: f.name }),
    supabase.from("events_data").insert({ identity_id: data.id, name: f.name }),
    supabase.from("offline_preferences").insert({ identity_id: data.id }),
    supabase.from("business_data").insert({
      identity_id: data.id, name: f.name, job_title: f.jobTitle || null,
      phone: f.phone || null, email: f.email || null,
      ...brandPatch(org),
    }),
  ]);
  return data.id;
}

export async function updateEmployee(id: string, f: EmployeeInput): Promise<boolean> {
  const ts = new Date().toISOString();
  const [a, b] = await Promise.all([
    supabase.from("identities").update({ name: f.name, updated_at: ts }).eq("id", id),
    supabase.from("business_data").update({
      name: f.name, job_title: f.jobTitle || null, phone: f.phone || null, email: f.email || null, updated_at: ts,
    }).eq("identity_id", id),
  ]);
  return !a.error && !b.error;
}

export async function deleteEmployee(id: string): Promise<void> {
  await supabase.from("identities").delete().eq("id", id);
}

export async function transferCard(serial: string, toIdentityId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("transfer_card", { p_serial: serial, p_to_identity: toIdentityId });
  return !error && data === true;
}

// ─── المرحلة ج: هوية الشركة الموحدة ───

/** يحفظ الهوية ثم يطبّقها على بطاقات كل الموظفين. يعيد عدد البطاقات المحدّثة، أو -1 عند الفشل */
export async function saveBrand(org: Org, brand: OrgBrand): Promise<number> {
  const { data, error } = await supabase.rpc("save_org_brand", { p_brand: brand });
  if (error || data !== true) return -1;
  const next: Org = { ...org, brand };
  const { data: ids } = await supabase.from("identities").select("id").eq("organization_id", org.id);
  const list = (ids || []) as { id: string }[];
  if (!list.length) return 0;
  const { data: biz } = await supabase
    .from("business_data").select("identity_id, social_links").in("identity_id", list.map((r) => r.id));
  const links = new Map<string, Record<string, string>>((biz || []).map((b: any) => [b.identity_id, b.social_links || {}]));
  const ts = new Date().toISOString();
  const res = await Promise.all(list.map((r) =>
    supabase.from("business_data").update({ ...brandPatch(next, links.get(r.id) || {}), updated_at: ts }).eq("identity_id", r.id)
  ));
  return res.filter((x) => !x.error).length;
}

// ─── المرحلة د: الإضافة الجماعية والإحصائيات ───

/** يحوّل نصاً ملصوقاً إلى موظفين: كل سطر «الاسم، المسمى، الجوال، البريد» (يقبل , ، ; أو Tab) */
export function parseEmployees(text: string): EmployeeInput[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const p = line.split(/\t|،|,|;/).map((s) => s.trim());
      return { name: p[0] || "", jobTitle: p[1] || "", phone: (p[2] || "").replace(/[\s-]/g, ""), email: p[3] || "" };
    })
    .filter((e) => e.name);
}

export async function bulkCreate(org: Org, ownerId: string, list: EmployeeInput[], onProgress?: (n: number) => void): Promise<number> {
  let ok = 0, done = 0;
  for (let i = 0; i < list.length; i += 4) {
    const batch = list.slice(i, i + 4);
    const res = await Promise.all(batch.map((e) => createEmployee(org, ownerId, e)));
    ok += res.filter(Boolean).length;
    done += batch.length;
    onProgress?.(done);
  }
  return ok;
}

export interface OrgStats {
  opens: number;
  devices: number;
  employees: { id: string; opens: number; devices: number; contacts: number }[];
  days: { day: string; n: number }[];
}

export async function loadOrgStats(): Promise<OrgStats | null> {
  try {
    const { data, error } = await supabase.rpc("org_stats");
    if (error || !data) return null;
    return data as OrgStats;
  } catch {
    return null;
  }
}

// ─── تأكيد الاستلام ───

export interface DeliveryItem { id: string; courier_name: string | null; order_no: string | null; lat: number | null; lng: number | null; created_at: string }
export interface DeliveriesData { today: number; total: number; items: DeliveryItem[] }

export async function loadDeliveries(): Promise<DeliveriesData | null> {
  try {
    const { data, error } = await supabase.rpc("org_deliveries", { p_limit: 200 });
    if (error || !data) return null;
    return data as DeliveriesData;
  } catch {
    return null;
  }
}
