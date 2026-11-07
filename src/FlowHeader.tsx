import { useApp } from "../context/AppContext";

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
  const finish = () => { setCreatingId(null); setScreen("home"); };
  const after = (next: Step | "done") => {
    if (!creating) { setScreen("identity-detail"); return; }
    if (next === "done") finish(); else setScreen(next);
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
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
      {steps.map((s, i) => {
        const active = i === idx;
        const done = i < idx;
        return (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
            <button
              onClick={() => setScreen(s.key)}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                padding: "8px 4px", borderRadius: 10, fontFamily: "inherit", fontSize: 12, cursor: "pointer",
                fontWeight: active ? 700 : 500,
                background: active ? "var(--primary)" : "var(--card)",
                color: active ? "var(--primary-foreground, #fff)" : done ? "var(--primary)" : "var(--muted-foreground)",
                border: `1px solid ${active || done ? "var(--primary)" : "var(--border-strong)"}`,
              }}
            >
              <span>{done ? "✓" : i + 1}</span>
              <span>{isAr ? s.ar : s.en}</span>
            </button>
            {i < steps.length - 1 && <span style={{ color: "var(--muted-foreground)", fontSize: 12 }}>{isAr ? "←" : "→"}</span>}
          </div>
        );
      })}
    </div>
  );
}
