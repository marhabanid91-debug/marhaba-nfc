import { supabase } from "./supabase";

export type StatKind = "gift" | "business" | "events";

// معرّف جهاز عشوائي مجهول، يُحفظ في المتصفح فقط (لا اسم ولا رقم ولا موقع)
function deviceId(): string {
  try {
    let id = localStorage.getItem("mh_dev");
    if (!id) {
      id =
        (typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36)
        ).replace(/-/g, "");
      localStorage.setItem("mh_dev", id);
    }
    return id;
  } catch {
    // التخزين غير متاح: معرّف مؤقت لهذه الصفحة فقط
    return "t" + Math.random().toString(36).slice(2, 14);
  }
}

const sentOpens = new Set<string>();

/** تسجيل فتح الصفحة مرة واحدة لكل تحميل. لا يرمي أخطاء أبداً. */
export function trackOpen(kind: StatKind, target: string | null | undefined) {
  if (!target) return;
  const key = `${kind}:${target}`;
  if (sentOpens.has(key)) return;
  sentOpens.add(key);
  void Promise.resolve(
    supabase.rpc("track_stat", { p_kind: kind, p_target: target, p_metric: "open", p_device: deviceId() })
  ).catch(() => {});
}

/** تسجيل ضغطة (واتساب، حفظ، رابط…). لا يرمي أخطاء أبداً. */
export function trackClick(kind: StatKind, target: string | null | undefined, metric: string) {
  if (!target || !metric) return;
  void Promise.resolve(
    supabase.rpc("track_stat", { p_kind: kind, p_target: target, p_metric: metric, p_device: deviceId() })
  ).catch(() => {});
}

/** يحوّل رابطاً مضغوطاً إلى اسم مقياس: social:instagram، call، email، location، link */
export function metricForHref(href: string | null | undefined): string | null {
  if (!href) return null;
  if (href.startsWith("tel:")) return "call";
  if (href.startsWith("mailto:")) return "email";
  try {
    const host = new URL(href, window.location.href).hostname.replace(/^www\./, "").toLowerCase();
    if (host === window.location.hostname.replace(/^www\./, "")) return null;
    if (/(^|\.)g\.page$/.test(host) || /review/i.test(href)) return "review";
    const map: [RegExp, string][] = [
      [/instagram\.com$/, "social:instagram"],
      [/tiktok\.com$/, "social:tiktok"],
      [/snapchat\.com$/, "social:snapchat"],
      [/linkedin\.com$/, "social:linkedin"],
      [/(^|\.)x\.com$|twitter\.com$/, "social:x"],
      [/facebook\.com$|fb\.com$/, "social:facebook"],
      [/youtube\.com$|youtu\.be$/, "social:youtube"],
      [/wa\.me$|whatsapp\.com$/, "social:whatsapp"],
      [/g\.page$|google\.com$|goo\.gl$|maps\.app\.goo\.gl$/, "location"],
    ];
    for (const [re, name] of map) if (re.test(host)) return name;
    return "link";
  } catch {
    return null;
  }
}

export interface MyStats {
  opens: number;
  devices: number;
  last_open: string | null;
  days: { day: string; n: number }[];
  clicks: Record<string, number>;
}

/** أرقام المالك فقط؛ ترجع null لغير المالك أو عند الخطأ */
export async function loadStats(kind: StatKind, target: string): Promise<MyStats | null> {
  try {
    const { data, error } = await supabase.rpc("my_stats", { p_kind: kind, p_target: target });
    if (error || !data) return null;
    return data as MyStats;
  } catch {
    return null;
  }
}
