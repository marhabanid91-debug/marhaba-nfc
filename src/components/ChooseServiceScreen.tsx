import { useApp } from "../context/AppContext";
import marhabaLogo from "../imports/marhaba-logo.png";
import { SECTIONS, Sec, getDone, wasAsked, setAsked, clearFlow } from "../lib/createFlow";

/**
 * يظهر في خطوتين:
 *  - "create-choose": بعد إدخال الرمز والاسم، اختيار القسم الأول (٣ بطاقات).
 *  - "create-more":   بعد حفظ القسم الأول، مرة واحدة فقط: هل تريد إضافة قسم آخر؟ (الأقسام التي لم تُختر)
 */
export default function ChooseServiceScreen({ more }: { more?: boolean }) {
  const { lang, setScreen, activeIdentityId, updateIdentityMode, setCreatingId } = useApp();
  const ar = lang === "ar";
  const done = getDone();
  const list = more ? SECTIONS.filter((s) => !done.includes(s.key)) : SECTIONS;

  const finish = () => { clearFlow(); setCreatingId(null); setScreen("home"); };

  const pick = (key: Sec) => {
    if (!more && activeIdentityId) updateIdentityMode(activeIdentityId, key); // القسم الأول هو الذي يظهر عند مسح البطاقة
    if (more) setAsked();
    setScreen(key);
  };

  if (more && (wasAsked() || list.length === 0)) { setTimeout(finish, 0); return null; }

  return (
    <div className="screen fade-in" dir={ar ? "rtl" : "ltr"}>
      <div style={{ padding: "28px 20px 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <img src={marhabaLogo} alt="مرحبا NFC" style={{ height: 44, width: "auto" }} />
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "14px 0 6px" }}>
            {more ? (ar ? "هل تريد إضافة قسم آخر؟" : "Add another section?") : (ar ? "ماذا تريد أن تضيف أولاً؟" : "What do you want to set up first?")}
          </h1>
          <p style={{ color: "var(--muted-foreground)", fontSize: 14, margin: 0, lineHeight: 1.7 }}>
            {more
              ? (ar ? "يمكنك إضافة الأقسام الأخرى الآن أو في أي وقت من «الأقسام»." : "You can add the others now or any time from Sections.")
              : (ar ? "القسم الذي تختاره هو الذي يظهر عند مسح البطاقة، ويمكنك تغييره لاحقاً." : "The section you pick opens when your card is scanned. You can change it later.")}
          </p>
        </div>

        {list.map((s) => (
          <button key={s.key} onClick={() => pick(s.key)} style={{
            width: "100%", textAlign: "start", cursor: "pointer", fontFamily: "inherit", color: "var(--foreground)",
            padding: "18px", marginBottom: 12, borderRadius: 20, display: "flex", alignItems: "center", gap: 14,
            background: `color-mix(in srgb, ${s.color} 9%, var(--card))`, border: `1.5px solid color-mix(in srgb, ${s.color} 55%, transparent)`,
          }}>
            <span style={{ fontSize: 36 }}>{s.icon}</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontWeight: 800, fontSize: 18, color: s.color }}>{ar ? s.ar : s.en}</span>
              <span style={{ display: "block", fontSize: 13, color: "var(--muted-foreground)", marginTop: 3, lineHeight: 1.6 }}>{ar ? s.descAr : s.descEn}</span>
            </span>
            <span style={{ fontSize: 22, color: "var(--muted-foreground)" }}>{ar ? "‹" : "›"}</span>
          </button>
        ))}

        <button className="btn-ghost" style={{ width: "100%", marginTop: 6 }} onClick={finish}>
          {more ? (ar ? "لا، إنهاء" : "No, finish") : (ar ? "تخطّي الآن" : "Skip for now")}
        </button>
      </div>
    </div>
  );
}
