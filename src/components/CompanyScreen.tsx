import { supabase } from "./supabase";

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

export async function createEmployee(orgId: string, orgName: string, ownerId: string, f: EmployeeInput): Promise<string | null> {
  const { data, error } = await supabase
    .from("identities")
    .insert({ user_id: ownerId, name: f.name, active_mode: "business", is_active: true, organization_id: orgId })
    .select("id")
    .single();
  if (error || !data) return null;
  await Promise.allSettled([
    supabase.from("emergency_data").insert({ identity_id: data.id, name: f.name }),
    supabase.from("events_data").insert({ identity_id: data.id, name: f.name }),
    supabase.from("offline_preferences").insert({ identity_id: data.id }),
    supabase.from("business_data").insert({
      identity_id: data.id, name: f.name, job_title: f.jobTitle || null,
      company: orgName, phone: f.phone || null, email: f.email || null,
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
