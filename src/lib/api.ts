import { supabase, EDGE_BASE } from "./supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StoreLink {
  id: string;
  label_ar: string;
  label_en: string;
  url: string;
  icon: string;
}

export interface AppSettings {
  whatsapp_number: string;
  whatsapp_accessory_number: string;
  support_email: string;
  store_links: StoreLink[];
  updated_at?: string;
}

const DEFAULTS: AppSettings = {
  whatsapp_number: "966500816798",
  whatsapp_accessory_number: "966500816798",
  support_email: "support@marhaba.com",
  store_links: [],
};

// ─── App Settings — read directly from Supabase (RLS: public SELECT) ──────────

export async function getAppSettings(): Promise<AppSettings> {
  // maybeSingle avoids throwing when the row doesn't exist yet
  const { data } = await supabase
    .from("app_settings")
    .select("whatsapp_number, whatsapp_accessory_number, support_email, store_links, updated_at")
    .maybeSingle();

  if (!data) return DEFAULTS;

  return {
    whatsapp_number: (data as any).whatsapp_number || DEFAULTS.whatsapp_number,
    whatsapp_accessory_number: (data as any).whatsapp_accessory_number || DEFAULTS.whatsapp_accessory_number,
    support_email: (data as any).support_email || DEFAULTS.support_email,
    store_links: (data as any).store_links ?? [],
    updated_at: (data as any).updated_at,
  };
}

// Write — upserts so the row is created if it doesn't exist yet
export async function updateAppSettings(updates: Partial<AppSettings>): Promise<{ ok: boolean }> {
  const payload: Record<string, unknown> = {
    id: 1, // single-row sentinel
    updated_at: new Date().toISOString(),
    // Always carry defaults so upsert never creates a row with nulls
    whatsapp_number: DEFAULTS.whatsapp_number,
    whatsapp_accessory_number: DEFAULTS.whatsapp_accessory_number,
    support_email: DEFAULTS.support_email,
    store_links: [],
  };
  if (updates.whatsapp_number !== undefined) payload.whatsapp_number = updates.whatsapp_number;
  if (updates.whatsapp_accessory_number !== undefined) payload.whatsapp_accessory_number = updates.whatsapp_accessory_number;
  if (updates.support_email !== undefined) payload.support_email = updates.support_email;
  if (updates.store_links !== undefined) payload.store_links = updates.store_links;

  const { error } = await supabase.from("app_settings").upsert(payload);
  if (error) throw new Error(error.message);
  return { ok: true };
}

// ─── Schema ───────────────────────────────────────────────────────────────────

export interface SchemaStatus {
  tables: Record<string, boolean>;
  initLog: unknown;
}

async function fetchEdge<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${EDGE_BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Edge error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const getSchemaStatus = (): Promise<SchemaStatus> =>
  fetchEdge<SchemaStatus>("/schema-status");

export const initSchema = (): Promise<{ ok: boolean; created: string[]; errors: string[] }> =>
  fetchEdge("/init-schema", { method: "POST" });

// ─── Serials ──────────────────────────────────────────────────────────────────

export const checkSerial = (serial: string): Promise<{ valid: boolean; available: boolean }> =>
  fetchEdge(`/serial/check/${encodeURIComponent(serial)}`);

export const linkSerial = (serial: string, identity_id: string): Promise<{ ok: boolean }> =>
  fetchEdge("/serial/link", {
    method: "POST",
    body: JSON.stringify({ serial, identity_id }),
  });
