/** نسخ نص إلى الحافظة؛ يعيد true عند النجاح */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

/** مشاركة رابط بقائمة مشاركة الجوال، وإن لم تتوفر يُنسخ الرابط. يعيد ما حدث */
export async function shareLink(url: string, title: string): Promise<"shared" | "copied" | "failed" | "cancelled"> {
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return "shared";
    } catch (e: any) {
      if (e?.name === "AbortError") return "cancelled";
    }
  }
  return (await copyText(url)) ? "copied" : "failed";
}
