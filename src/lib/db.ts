import { supabase } from "./supabase";
import { HIDE_SENSITIVE_FIELDS } from "./flags";
import { normalizeNotes } from "./contactNotes";
import {
  Identity, EmergencyData, BusinessData, EventsData,
  OfflineSettings, ActiveMode, EmergencyContact, EmergencyVisibility,
  LocationItem,
} from "../types";

// ─── Mappers: DB (snake_case) ↔ Local (camelCase) ──────────────────────────

function mapEmergencyFromDB(row: any, contacts: any[]): EmergencyData {
  return {
    photo: row.photo_url || "",
    name: row.name || "",
    birthDate: row.birth_date || "",
    bloodType: row.blood_type || "",
    conditions: row.conditions || "",
    allergies: row.allergies || "",
    medications: row.medications || "",
    firstAidInstructions: row.first_aid_instructions || "",
    contactNotes: normalizeNotes(row.contact_notes),
    emergencyContacts: (contacts || []).map((c) => ({
      name: c.name || "",
      phone: c.phone || "",
      relationship: c.relationship || "",
      visible: c.is_visible ?? true,
    })),
    visibility: {
      birthDate: row.show_birth_date ?? true,
      bloodType: row.show_blood_type ?? true,
      conditions: row.show_conditions ?? true,
      allergies: row.show_allergies ?? true,
      medications: row.show_medications ?? true,
      firstAidInstructions: row.show_first_aid ?? true,
    },
    locations: (row.locations as LocationItem[]) || [],
  };
}

function mapEmergencyToDB(data: EmergencyData) {
  return {
    photo_url: data.photo || null,
    name: data.name || null,
    birth_date: data.birthDate || null,
    blood_type: data.bloodType || null,
    conditions: data.conditions || null,
    allergies: data.allergies || null,
    medications: data.medications || null,
    first_aid_instructions: data.firstAidInstructions || null,
    contact_notes: normalizeNotes(data.contactNotes),
    show_birth_date: data.visibility.birthDate,
    show_blood_type: data.visibility.bloodType,
    show_conditions: data.visibility.conditions,
    show_allergies: data.visibility.allergies,
    show_medications: data.visibility.medications,
    show_first_aid: data.visibility.firstAidInstructions,
    locations: data.locations || [],
    updated_at: new Date().toISOString(),
  };
}

function mapBusinessFromDB(row: any): BusinessData {
  return {
    photo: row.photo_url || "",
    name: row.name || "",
    jobTitle: row.job_title || "",
    company: row.company || "",
    bio: row.bio || "",
    phone: row.phone || "",
    email: row.email || "",
    website: row.website || "",
    location: row.location || "",
    socialLinks: row.social_links || {},
    locations: (row.locations as LocationItem[]) || [],
  };
}

function mapBusinessToDB(data: BusinessData) {
  return {
    photo_url: data.photo || null,
    name: data.name || null,
    job_title: data.jobTitle || null,
    company: data.company || null,
    bio: data.bio || null,
    phone: data.phone || null,
    email: data.email || null,
    website: data.website || null,
    location: data.location || null,
    social_links: data.socialLinks || {},
    locations: data.locations || [],
    updated_at: new Date().toISOString(),
  };
}

function mapEventsFromDB(row: any): EventsData {
  return {
    photo: row.photo_url || "",
    name: row.name || "",
    bio: row.bio || "",
    eventName: row.event_name || "",
    eventLocation: row.event_location || "",
    status: row.status || "",
    ticketLink: row.ticket_link || "",
    socialLinks: row.social_links || {},
    locations: (row.locations as LocationItem[]) || [],
  };
}

function mapEventsToDB(data: EventsData) {
  return {
    photo_url: data.photo || null,
    name: data.name || null,
    bio: data.bio || null,
    event_name: data.eventName || null,
    event_location: data.eventLocation || null,
    status: data.status || null,
    ticket_link: data.ticketLink || null,
    social_links: data.socialLinks || {},
    locations: data.locations || [],
    updated_at: new Date().toISOString(),
  };
}

const defaultEmergency = (): EmergencyData => ({
  photo: "", name: "", birthDate: "", bloodType: "",
  conditions: "", allergies: "", medications: "", firstAidInstructions: "",
  emergencyContacts: [],
  visibility: { birthDate: true, bloodType: true, conditions: true, allergies: true, medications: true, firstAidInstructions: true },
  locations: [],
});

const defaultBusiness = (): BusinessData => ({
  photo: "", name: "", jobTitle: "", company: "", bio: "",
  phone: "", email: "", website: "", location: "", socialLinks: {}, locations: [],
});

const defaultEvents = (): EventsData => ({
  photo: "", name: "", bio: "", eventName: "", eventLocation: "", status: "", ticketLink: "", socialLinks: {}, locations: [],
});

const defaultOffline = (): OfflineSettings => ({
  name: true, contactPhone: false, emergencyPhone: true,
});

// ─── Identity loading ────────────────────────────────────────────────────────

export async function loadUserIdentities(userId: string): Promise<Identity[]> {
  const { data: identityRows, error } = await supabase
    .from("identities")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error || !identityRows?.length) return [];

  const identities: Identity[] = [];

  for (const row of identityRows) {
    const id = row.id;

    const [emRow, emContacts, bizRow, evRow, offRow, cardRow] = await Promise.all([
      supabase.from("emergency_data").select("*").eq("identity_id", id).maybeSingle(),
      supabase.from("emergency_contacts").select("*").eq("identity_id", id).order("sort_order"),
      supabase.from("business_data").select("*").eq("identity_id", id).maybeSingle(),
      supabase.from("events_data").select("*").eq("identity_id", id).maybeSingle(),
      supabase.from("offline_preferences").select("*").eq("identity_id", id).maybeSingle(),
      // serial_inventory is the source of truth for the linked serial
      supabase.from("serial_inventory").select("serial_number").eq("identity_id", id).eq("status", "linked").maybeSingle(),
    ]);

    identities.push({
      id,
      // prefer serial_inventory; fall back to identities.serial_number mirror
      serialNumber: cardRow.data?.serial_number || row.serial_number || null,
      activeMode: (row.active_mode as ActiveMode) || "business",
      isActive: row.is_active ?? true,
      emergency: emRow.data ? mapEmergencyFromDB(emRow.data, emContacts.data || []) : defaultEmergency(),
      business: bizRow.data ? mapBusinessFromDB(bizRow.data) : defaultBusiness(),
      events: evRow.data ? mapEventsFromDB(evRow.data) : defaultEvents(),
      offlineSettings: offRow.data
        ? { name: offRow.data.show_name, contactPhone: offRow.data.show_contact_phone, emergencyPhone: offRow.data.show_emergency_phone }
        : defaultOffline(),
    });
  }

  return identities;
}

// ─── Identity CRUD ───────────────────────────────────────────────────────────

export async function createIdentity(userId: string, name: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("identities")
    .insert({ user_id: userId, name, active_mode: "business", is_active: true })
    .select("id")
    .single();

  if (error || !data) return null;

  // Initialise sub-tables so they exist
  await Promise.allSettled([
    supabase.from("emergency_data").insert({ identity_id: data.id }),
    supabase.from("business_data").insert({ identity_id: data.id }),
    supabase.from("events_data").insert({ identity_id: data.id }),
    supabase.from("offline_preferences").insert({ identity_id: data.id }),
  ]);

  return data.id;
}

export async function updateIdentityMode(identityId: string, mode: ActiveMode) {
  await supabase
    .from("identities")
    .update({ active_mode: mode, updated_at: new Date().toISOString() })
    .eq("id", identityId);
}

export async function updateIdentityActive(identityId: string, isActive: boolean) {
  await supabase
    .from("identities")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", identityId);
}

export async function deleteIdentityFromDB(identityId: string) {
  await supabase.from("identities").delete().eq("id", identityId);
}

// ─── Data saves ──────────────────────────────────────────────────────────────
// ملاحظة مهمة: onConflict: "identity_id" ضروري لأن upsert بشكل افتراضي
// يعتمد على المفتاح الأساسي (id) للتعارض، وليس على identity_id. بدونها
// كانت عملية الحفظ تفشل بصمت وتترك الصف الأصلي (الفارغ) دون تحديث.

export async function saveEmergencyData(identityId: string, data: EmergencyData) {
  const row: Record<string, unknown> = mapEmergencyToDB(data);
  // عند إخفاء البيانات الحساسة لا نرسلها في الحفظ، فتبقى القيم القديمة في القاعدة كما هي دون استبدال بفراغ
  if (HIDE_SENSITIVE_FIELDS) {
    for (const k of ["birth_date","blood_type","conditions","allergies","medications","first_aid_instructions",
      "show_birth_date","show_blood_type","show_conditions","show_allergies","show_medications","show_first_aid"]) delete row[k];
  }

  const { error } = await supabase
    .from("emergency_data")
    .upsert({ ...row, identity_id: identityId }, { onConflict: "identity_id" });

  if (error) return;

  // Sync contacts: delete all then re-insert (max 3)
  await supabase.from("emergency_contacts").delete().eq("identity_id", identityId);

  const contacts = data.emergencyContacts.slice(0, 3).map((c, i) => ({
    identity_id: identityId,
    name: c.name || null,
    phone: c.phone || null,
    relationship: c.relationship || null,
    is_visible: c.visible ?? true,
    sort_order: i,
  }));

  if (contacts.length) {
    await supabase.from("emergency_contacts").insert(contacts);
  }
}

export async function saveBusinessData(identityId: string, data: BusinessData) {
  await supabase
    .from("business_data")
    .upsert({ ...mapBusinessToDB(data), identity_id: identityId }, { onConflict: "identity_id" });
}

export async function saveEventsData(identityId: string, data: EventsData) {
  await supabase
    .from("events_data")
    .upsert({ ...mapEventsToDB(data), identity_id: identityId }, { onConflict: "identity_id" });
}

export async function saveOfflinePreferences(identityId: string, prefs: OfflineSettings) {
  await supabase
    .from("offline_preferences")
    .upsert({
      identity_id: identityId,
      show_name: prefs.name,
      show_contact_phone: prefs.contactPhone,
      show_emergency_phone: prefs.emergencyPhone,
      updated_at: new Date().toISOString(),
    }, { onConflict: "identity_id" });
}

// ─── Serial inventory ─────────────────────────────────────────────────────────

export interface SerialRecord {
  serial_number: string;
  status: "available" | "linked";
  identity_id: string | null;
}

export type SerialLookupResult =
  | { status: "not_found" }
  | { status: "available"; record: SerialRecord }
  | { status: "linked";    record: SerialRecord };

/** يبحث عن الرقم التسلسلي عبر دالة آمنة (الجدول نفسه مغلق أمام العموم). */
export async function lookupSerial(rawSerial: string): Promise<SerialLookupResult> {
  const serial = rawSerial.trim().toUpperCase();
  const { data, error } = await supabase.rpc("lookup_serial", { p_serial: serial });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) return { status: "not_found" };
  return row.status === "available"
    ? { status: "available", record: row as SerialRecord }
    : { status: "linked",    record: row as SerialRecord };
}

// ─── Identity rename ──────────────────────────────────────────────────────────

/** Update the display name across all three profile sub-tables in one shot. */
export async function renameIdentity(identityId: string, name: string): Promise<void> {
  const ts = new Date().toISOString();
  await Promise.allSettled([
    supabase.from("emergency_data").update({ name, updated_at: ts }).eq("identity_id", identityId),
    supabase.from("business_data").update({ name, updated_at: ts }).eq("identity_id", identityId),
    supabase.from("events_data").update({ name, updated_at: ts }).eq("identity_id", identityId),
    supabase.from("identities").update({ name, updated_at: ts }).eq("id", identityId),
  ]);
}

// ─── Serial linking (serial_inventory is the source of truth) ────────────────

/**
 * Check whether a serial code exists in serial_inventory and is available.
 * Returns { valid: false } when the code is not found at all.
 * Returns { valid: true, available: false } when already linked.
 * Returns { valid: true, available: true } when ready to activate.
 */
export async function checkSerialAvailability(
  serial: string,
): Promise<{ valid: boolean; available: boolean }> {
  const result = await lookupSerial(serial);
  if (result.status === "not_found") return { valid: false, available: false };
  return { valid: true, available: result.status === "available" };
}

/**
 * Link a serial code to an identity by updating serial_inventory.status → 'linked'
 * and writing the identity_id. Also mirrors the serial on identities.serial_number.
 * Uses .eq("status", "available") as a race-condition guard — safe for concurrent requests.
 */
export async function linkSerialToIdentity(
  serial: string,
  identityId: string,
  _userId: string,
): Promise<boolean> {
  const normalized = serial.trim().toUpperCase();
  const ts = new Date().toISOString();

  const { error } = await supabase
    .from("serial_inventory")
    .update({ status: "linked", identity_id: identityId, linked_at: ts })
    .eq("serial_number", normalized)
    .eq("status", "available"); // only link once

  if (error) return false;

  // Mirror on identities for display
  await supabase
    .from("identities")
    .update({ serial_number: normalized, updated_at: ts })
    .eq("id", identityId);

  return true;
}

/** يطبّع رمز التفعيل المكتوب (يتجاهل الشرطات والمسافات) */
export const normalizeCode = (c: string) => c.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

/**
 * تحقق من رمز التفعيل السري (قبل التسجيل). يعيد الرقم التسلسلي إن صح الرمز
 * وكانت البطاقة متاحة، وإلا null. الخادم يحدّ المحاولات الخاطئة.
 */
export async function verifyActivation(serial: string | null, code: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("verify_activation", {
    p_serial: serial ?? "",
    p_code: normalizeCode(code),
  });
  return error || !data ? null : (data as string);
}

/** تفعيل البطاقة وربطها بهوية المستخدم (يتحقق الخادم من الرمز ومن ملكية الهوية). */
export async function activateCard(serial: string, code: string, identityId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("activate_card", {
    p_serial: serial,
    p_code: normalizeCode(code),
    p_identity_id: identityId,
  });
  return !error && data === true;
}

/**
 * Reset a serial back to available in serial_inventory and clear identities.serial_number.
 */
export async function unlinkSerial(serial: string, _identityId: string): Promise<void> {
  await supabase.rpc("unlink_card", { p_serial: serial.trim() });
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function upsertProfile(userId: string, fields: {
  terms_agreed_at?: string;
  disclaimer_acknowledged_at?: string;
  avatar_url?: string;
}) {
  await supabase.from("profiles").upsert({
    id: userId,
    updated_at: new Date().toISOString(),
    ...fields,
  });
}

export async function loadProfile(userId: string): Promise<{ avatar_url: string | null; is_admin: boolean }> {
  const { data } = await supabase
    .from("profiles")
    .select("avatar_url, is_admin")
    .eq("id", userId)
    .single();
  return {
    avatar_url: (data as any)?.avatar_url ?? null,
    is_admin: (data as any)?.is_admin === true,
  };
}

// ─── Avatar upload ─────────────────────────────────────────────────────────────

export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/avatar.${ext}`;

  // upsert: overwrite existing avatar
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return null;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const publicUrl = data?.publicUrl ?? null;

  if (publicUrl) {
    // Bust CDN cache by appending timestamp query param
    const url = `${publicUrl}?t=${Date.now()}`;
    await upsertProfile(userId, { avatar_url: url });
    return url;
  }
  return null;
}

export async function loadAvatarUrl(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", userId)
    .single();
  return (data as any)?.avatar_url ?? null;
}

// Upload an identity card photo (business / events / emergency) to the identities bucket.
export async function uploadIdentityPhoto(
  userId: string,
  identityId: string,
  slot: "business" | "events" | "emergency",
  file: File,
): Promise<string | null> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${identityId}/${slot}.${ext}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) return null;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const publicUrl = data?.publicUrl ?? null;
  return publicUrl ? `${publicUrl}?t=${Date.now()}` : null;
}

// ─── Cards ────────────────────────────────────────────────────────────────────

export interface CardRecord {
  id: string;
  serial_code: string;
  is_claimed: boolean;
  claimed_by: string | null;
  identity_id: string | null;
  card_type: string;
  created_at: string;
  claimed_at: string | null;
}

export type CardLookupResult =
  | { status: "not_found" }
  | { status: "unclaimed"; card: CardRecord }
  | { status: "claimed";   card: CardRecord };

/** Look up a card by its serial_code (case-insensitive, trimmed). */
export async function lookupCard(rawSerial: string): Promise<CardLookupResult> {
  const serial = rawSerial.trim().toUpperCase();
  const { data, error } = await supabase
    .from("cards")
    .select("id, serial_code, is_claimed, claimed_by, identity_id, card_type, created_at, claimed_at")
    .ilike("serial_code", serial)
    .single();

  if (error || !data) return { status: "not_found" };

  return data.is_claimed
    ? { status: "claimed",   card: data as CardRecord }
    : { status: "unclaimed", card: data as CardRecord };
}

/** Mark a card as claimed and link it to a user + identity. */
export async function claimCard(
  cardId: string,
  userId: string,
  identityId: string,
): Promise<boolean> {
  const ts = new Date().toISOString();

  // First fetch the card's serial_code so we can mirror it on identities
  const { data: card } = await supabase
    .from("cards")
    .select("serial_code")
    .eq("id", cardId)
    .single();

  const { error } = await supabase
    .from("cards")
    .update({
      is_claimed: true,
      claimed_by: userId,
      identity_id: identityId,
      claimed_at: ts,
    })
    .eq("id", cardId)
    .eq("is_claimed", false); // only claim once — prevents race conditions

  if (error) return false;

  // Mirror serial_code on identities for legacy display + easy querying
  if (card?.serial_code) {
    await supabase
      .from("identities")
      .update({ serial_number: card.serial_code, updated_at: ts })
      .eq("id", identityId);
  }

  return true;
}

// ─── Public identity lookup (no auth required — for NFC card readers) ────────

export async function loadPublicIdentityBySerial(serial: string, token?: string | null): Promise<Identity | null> {
  // دالة آمنة: تعيد بيانات البطاقة العامة فقط، وترفض الرقم التسلسلي لبطاقات الرابط العشوائي
  const { data, error } = await supabase.rpc("get_public_identity", {
    p_serial: token ? null : serial,
    p_token: token || null,
  });
  const d = data as any;
  if (error || !d || !d.identity) return null;

  return {
    id: d.identity.id,
    serialNumber: d.serial,
    activeMode: (d.identity.active_mode as ActiveMode) || "business",
    isActive: d.identity.is_active ?? true,
    emergency: d.emergency ? mapEmergencyFromDB(d.emergency, d.contacts || []) : defaultEmergency(),
    business: d.business ? mapBusinessFromDB(d.business) : defaultBusiness(),
    events: d.events ? mapEventsFromDB(d.events) : defaultEvents(),
    offlineSettings: defaultOffline(),
  };
}

// ─── رابط البطاقة العشوائي (?c=token) ─────────────────────────────────────────

/** يحوّل الرمز العشوائي في الرابط إلى الرقم التسلسلي، أو null إن لم يوجد. */
export async function serialForToken(token: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc("serial_for_token", { p_token: token.trim() });
    return error || !data ? null : (data as string);
  } catch {
    return null;
  }
}

/** هل هذه البطاقة تعمل بالرابط العشوائي فقط؟ (إن فشل الاستعلام نعتبرها بطاقة قديمة) */
export async function isTokenCard(serial: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("is_token_card", { p_serial: serial.trim() });
    return !error && data === true;
  } catch {
    return false;
  }
}

/** رمز الرابط العشوائي لبطاقة يملكها المستخدم الحالي (للمشاركة)، أو null للبطاقات القديمة. */
export async function myCardToken(serial: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc("my_card_token", { p_serial: serial.trim() });
    return error || !data ? null : (data as string);
  } catch {
    return null;
  }
}
