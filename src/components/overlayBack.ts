import { useEffect, useRef } from "react";

// يربط نافذة منبثقة (قائمة، لوحة…) بزر الرجوع في الجوال:
// الرجوع يغلق النافذة (أو المستوى الأعلى فيها) بدل أن يغادر الصفحة.
// push(): عند فتح مستوى أعمق. back(): للإغلاق من الأزرار. leave(fn): للخروج ثم تنفيذ تنقّل.
export function useOverlayBack(onPop: () => void) {
  const count = useRef(0);
  const leaving = useRef(false);
  const handler = useRef(onPop);
  handler.current = onPop;

  const push = () => {
    try { window.history.pushState(window.history.state, ""); count.current += 1; } catch {}
  };

  useEffect(() => {
    push(); // مدخل للمستوى الأول
    const onPopState = () => {
      if (leaving.current) return;
      if (count.current > 0) count.current -= 1;
      handler.current();
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const back = () => {
    if (count.current > 0) { try { window.history.back(); } catch {} } else handler.current();
  };

  const leave = (after: () => void) => {
    const k = count.current;
    count.current = 0;
    if (k <= 0) { after(); return; }
    leaving.current = true;
    window.addEventListener("popstate", () => { after(); }, { once: true });
    try { window.history.go(-k); } catch { after(); }
  };

  return { push, back, leave };
}
