// تعليمات عامة تظهر لمن يمسح بطاقة الطوارئ. لا تحتوي معلومات صحية.
export interface ContactNotes {
  presets: string[];
  custom: string;
}

export const NOTE_PRESETS: { key: string; ar: string; en: string }[] = [
  { key: "escort_child", ar: "طفل يحتاج إلى مرافقة", en: "Child — needs an escort" },
  { key: "escort_elder", ar: "شخص كبير في السن يحتاج إلى مرافقة", en: "Elderly person — needs an escort" },
  { key: "call_family", ar: "يرجى الاتصال بالأهل فوراً", en: "Please call the family right away" },
  { key: "stay_with", ar: "يرجى البقاء معه حتى وصول الأهل", en: "Please stay with them until family arrives" },
  { key: "dont_leave", ar: "يرجى عدم تركه وحده", en: "Please do not leave them alone" },
  { key: "arabic_only", ar: "يتحدث العربية فقط", en: "Speaks Arabic only" },
  { key: "speak_calmly", ar: "يرجى التحدث معه بهدوء", en: "Please speak to them calmly" },
];

export const CUSTOM_NOTE_MAX = 80;

export function emptyNotes(): ContactNotes {
  return { presets: [], custom: "" };
}

export function normalizeNotes(raw: any): ContactNotes {
  const known = new Set(NOTE_PRESETS.map((p) => p.key));
  const presets = Array.isArray(raw?.presets) ? raw.presets.filter((k: any) => typeof k === "string" && known.has(k)) : [];
  const custom = typeof raw?.custom === "string" ? raw.custom.slice(0, CUSTOM_NOTE_MAX) : "";
  return { presets, custom };
}

export function noteLines(notes: ContactNotes | undefined, lang: string): string[] {
  const n = normalizeNotes(notes);
  const lines = NOTE_PRESETS.filter((p) => n.presets.includes(p.key)).map((p) => (lang === "ar" ? p.ar : p.en));
  if (n.custom.trim()) lines.push(n.custom.trim());
  return lines;
}
