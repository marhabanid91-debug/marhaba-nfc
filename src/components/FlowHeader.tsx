import { useApp } from "../context/AppContext";
import { addDone, clearFlow, getDone, wasAsked } from "../lib/createFlow";

type Step = "emergency" | "business" | "events";
const steps: { key: Step; ar: string; en: string; icon: string }[] = [
  { key: "emergency", ar: "الطوارئ", en: "Emergency", icon: "🚨" },
  { key: "business", ar: "الأعمال", en: "Business", icon: "💼" },
  { key: "events", ar: "الفعاليات", en: "Events", icon: "🎪" },
];

// شريط أعلى شاشات التعديل: خطوات الإنشاء للهوية الجديدة، أو زر رجوع للهوية الموجودة
export function useFlow() {
  const { creatingId, activeIdentityId, setCreatingId, setScreen } = useApp();
  const creating = !!creatingId && creatingId === activeIdentityId;
  const finish = () => { clearFlow(); setCreatingId(null); setScreen("home"); };
  // بعد حفظ قسم أثناء الإنشاء: يُسأل المستخدم مرة واحدة عن قسم آخر، ثم ينتهي
  const after = (_next?: Step | "done", current?: Step) => {
    if (!creating) { setScreen("identity-detail"); return; }
    if (current) addDone(current);
    if (!wasAsked() && getDone().length < 3) setScreen("create-more"); else finish();
  };
  return { creating, finish, after };
}

export default function FlowHeader({ current }: { current: Step }) {
  const { lang, setScreen } = useApp();
  const { creating } = useFlow();
  const isAr = lang === "ar";

  if (!creating) {
    return (
      <button
        onClick={() => setScreen("identity-detail")}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none",
          color: "var(--primary)", fontFamily: "inherit", fontSize: 14, fontWeight: 600,
          cursor: "pointer", padding: "0 0 12px",
        }}
      >
        <span>{isAr ? "→" : "←"}</span>{isAr ? "رجوع" : "Back"}
      </button>
    );
  }

  const idx = steps.findIndex((s) => s.key === current);
  const only = steps[idx];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 14, padding: "8px 12px", borderRadius: 10, background: "var(--primary)", color: "var(--primary-foreground, #fff)", fontWeight: 700, fontSize: 14 }}>
      <span>{only.icon}</span><span>{isAr ? only.ar : only.en}</span>
    </div>
  );
}
