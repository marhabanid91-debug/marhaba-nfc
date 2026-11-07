import { supabase } from "./supabase";

// ─── روابط الهدية: يوتيوب، جوجل درايف، أو رابط مباشر لصورة/فيديو/صوت ─────────

export type Embed =
  | { kind: "iframe"; src: string; tall?: boolean; portrait?: boolean }
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

  // تيك توك: الرابط الكامل فقط (…/@user/video/رقم). الروابط المختصرة (vm.tiktok.com) لا يمكن تحويلها
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
    const id = u.pathname.match(/\/video\/(\d{8,25})/)?.[1];
    return id
      ? { kind: "iframe", src: `https://www.tiktok.com/embed/v2/${id}`, portrait: true }
      : { kind: "none" };
  }

  // جوجل درايف: مجلد كامل (يجب أن يكون «أي شخص لديه الرابط»)
  if (host === "drive.google.com") {
    const folderId = u.pathname.match(/\/folders\/([\w-]+)/)?.[1];
    if (folderId) {
      return { kind: "iframe", src: `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`, tall: true };
    }
  }

  // جوجل درايف: ملف واحد صورة أو فيديو أو صوت
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

/** هل هو رابط تيك توك مختصر أو غير كامل؟ (لرسالة خطأ أوضح) */
export function isTikTokUnsupported(raw: string): boolean {
  try {
    const h = new URL(raw.trim()).hostname.replace(/^www\./, "");
    return (h === "tiktok.com" || h.endsWith(".tiktok.com")) && toEmbed(raw).kind === "none";
  } catch {
    return false;
  }
}

// ─── قاعدة البيانات ────────────────────────────────────────────────────────────

export interface GiftItem {
  url: string;
  title?: string;
}

/** عناصر الهدية: القائمة الجديدة، أو الرابط القديم الوحيد إن لم توجد قائمة */
export function giftItems(g: { gift_items?: GiftItem[] | null; gift_url?: string | null } | null | undefined): GiftItem[] {
  if (!g) return [];
  if (Array.isArray(g.gift_items) && g.gift_items.length) return g.gift_items;
  return g.gift_url ? [{ url: g.gift_url }] : [];
}

/** صفحة المُهدي للمتابعة (مثلاً صفحة مرحبا لشخص أو فعالية) */
export interface GiftFollow {
  url: string;
  title?: string;
}

/** عرض أو سحب: عنوان + طريقة المشاركة + رابط اختياري */
export interface GiftOffer {
  title: string;
  how?: string;
  url?: string;
}

export interface GiftPromo {
  follow?: GiftFollow | null;
  offers?: GiftOffer[] | null;
}

/** تنظيف الإضافات للعرض: روابط https فقط، وحذف العناصر الفارغة */
export function cleanPromo(p: GiftPromo | null | undefined): { follow: { url: string; title: string } | null; offers: GiftOffer[] } {
  const furl = safeCatalogUrl(p?.follow?.url);
  const follow = furl ? { url: furl, title: (p?.follow?.title || "").trim() } : null;
  const offers = (Array.isArray(p?.offers) ? p!.offers! : [])
    .map((o) => ({
      title: (o?.title || "").trim(),
      how: (o?.how || "").trim(),
      url: safeCatalogUrl(o?.url) || "",
    }))
    .filter((o) => o.title || o.how || o.url);
  return { follow, offers };
}

export interface GiftPublic {
  serial: string;
  status: "available" | "linked";
  gift_title: string | null;
  gift_url: string | null;
  gift_catalog: string | null;
  gift_items: GiftItem[] | null;
  gift_promo?: GiftPromo | null;
}

/** رابط الكتالوج: https فقط، يُفتح في تبويب جديد */
export function safeCatalogUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw.trim());
    return u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

/** تعيد الهدية إن كان الرمز بطاقة هدية، وإلا null. لا ترمي أخطاء حتى لا تعطل التطبيق. */
export async function getGiftBySerial(rawSerial: string): Promise<GiftPublic | null> {
  try {
    const q = (cols: string) =>
      supabase.from("gift_public").select(cols).ilike("serial", rawSerial.trim()).maybeSingle();
    let { data, error } = await q("serial, status, gift_title, gift_url, gift_catalog, gift_items, gift_promo");
    if (error) {
      // قبل تشغيل ملف SQL الجديد: اقرأ الأعمدة القديمة حتى لا تتعطل صفحة الهدية
      ({ data, error } = await q("serial, status, gift_title, gift_url, gift_catalog, gift_items"));
    }
    if (error || !data) return null;
    return data as unknown as GiftPublic;
  } catch {
    return null;
  }
}

/** تفعيل بطاقة هدية على حساب المستخدم الحالي. */
export async function claimGift(rawSerial: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("claim_gift", { p_serial: rawSerial.trim() });
  return !error && data === true;
}

/** تبديل محتوى الهدية (للمُهدي مالك الحساب فقط): أي عدد من العناصر. */
export async function setGiftLink(serial: string, items: GiftItem[], title: string, catalog: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("set_gift_link", {
    p_serial: serial,
    p_items: items,
    p_title: title,
    p_catalog: catalog,
  });
  return !error && data === true;
}

/** حفظ الإضافات: رابط المتابعة والعروض (للمُهدي مالك الحساب فقط). */
export async function setGiftPromo(serial: string, promo: { follow: GiftFollow | null; offers: GiftOffer[] }): Promise<boolean> {
  const { data, error } = await supabase.rpc("set_gift_promo", { p_serial: serial, p_promo: promo });
  return !error && data === true;
}

export interface MyGift {
  serial: string;
  gift_title: string | null;
  gift_url: string | null;
  gift_catalog: string | null;
  gift_items: GiftItem[] | null;
  gift_promo?: GiftPromo | null;
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
