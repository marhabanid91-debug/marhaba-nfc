import { supabase } from "./supabase";

// ─── روابط الهدية: يوتيوب، جوجل درايف، أو رابط مباشر لصورة/فيديو/صوت ─────────

export type Embed =
  | { kind: "iframe"; src: string }
  | { kind: "image"; src: string }
  | { kind: "video"; src: string }
  | { kind: "audio"; src: string }
  | { kind: "none" };

export function toEmbed(raw: string | null | undefined): Embed {
  if (!raw) return { kind: "none" };
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return { kind: "none" };
  }
  if (u.protocol !== "https:") return { kind: "none" };

  const host = u.hostname.replace(/^www\./, "");

  // يوتيوب
  if (host === "youtu.be" || host === "youtube.com" || host.endsWith(".youtube.com")) {
    const id =
      host === "youtu.be"
        ? u.pathname.slice(1)
        : u.searchParams.get("v") || u.pathname.split("/").filter(Boolean).pop() || "";
    return /^[\w-]{11}$/.test(id)
      ? { kind: "iframe", src: `https://www.youtube.com/embed/${id}` }
      : { kind: "none" };
  }

  // جوجل درايف: صور وفيديو وصوت
  if (host === "drive.google.com") {
    const id = u.pathname.match(/\/d\/([\w-]+)/)?.[1] || u.searchParams.get("id");
    return id
      ? { kind: "iframe", src: `https://drive.google.com/file/d/${id}/preview` }
      : { kind: "none" };
  }

  // روابط مباشرة
  const p = u.pathname.toLowerCase();
  if (/\.(jpg|jpeg|png|webp|gif)$/.test(p)) return { kind: "image", src: u.href };
  if (/\.(mp4|webm|mov)$/.test(p)) return { kind: "video", src: u.href };
  if (/\.(mp3|m4a|wav|ogg)$/.test(p)) return { kind: "audio", src: u.href };

  return { kind: "none" };
}

// ─── قاعدة البيانات ────────────────────────────────────────────────────────────

export interface GiftPublic {
  serial: string;
  status: "available" | "linked";
  gift_title: string | null;
  gift_url: string | null;
}

/** تعيد الهدية إن كان الرمز بطاقة هدية، وإلا null. لا ترمي أخطاء حتى لا تعطل التطبيق. */
export async function getGiftBySerial(rawSerial: string): Promise<GiftPublic | null> {
  try {
    const { data, error } = await supabase
      .from("gift_public")
      .select("serial, status, gift_title, gift_url")
      .ilike("serial", rawSerial.trim())
      .maybeSingle();
    if (error || !data) return null;
    return data as GiftPublic;
  } catch {
    return null;
  }
}

/** تفعيل بطاقة هدية على حساب المستخدم الحالي. */
export async function claimGift(rawSerial: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("claim_gift", { p_serial: rawSerial.trim() });
  return !error && data === true;
}

/** تبديل رابط الهدية (للمُهدي مالك الحساب فقط). */
export async function setGiftLink(serial: string, url: string, title: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("set_gift_link", {
    p_serial: serial,
    p_url: url,
    p_title: title,
  });
  return !error && data === true;
}

export interface MyGift {
  serial: string;
  gift_title: string | null;
  gift_url: string | null;
}

export async function loadMyGifts(): Promise<MyGift[]> {
  try {
    const { data, error } = await supabase.rpc("my_gifts");
    if (error || !data) return [];
    return data as MyGift[];
  } catch {
    return [];
  }
}
