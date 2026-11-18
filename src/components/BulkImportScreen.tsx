import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Org } from "../hooks/useCompany";
import { parseEmployees, bulkCreate } from "../lib/company";

function BackBtn({ onBack }: { onBack: () => void }) {
  return (
    <button onClick={onBack} style={{ display: "inline-flex", gap: 6, background: "none", border: "none", color: "var(--primary)", fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "0 0 12px" }}>
      <span>→</span>رجوع
    </button>
  );
}

export default function BulkImportScreen({ org, onBack }: { org: Org; onBack: () => void }) {
  const { supabaseUser } = useApp();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState("");
  const list = parseEmployees(text);
  const tooMany = list.length > 200;

  const run = async () => {
    if (!supabaseUser || !list.length || tooMany) return;
    if (!window.confirm(`إنشاء ${list.length} بطاقة موظف؟`)) return;
    setBusy(true); setProgress(0); setResult("");
    const ok = await bulkCreate(org, supabaseUser.id, list, setProgress);
    setBusy(false);
    setResult(ok === list.length ? `تم إنشاء ${ok} بطاقة ✓` : `أُنشئت ${ok} من ${list.length}. راجعي قائمة الموظفين وأعيدي المتبقي.`);
    if (ok > 0) setText("");
  };

  return (
    <div className="screen fade-in"><div style={{ padding: "24px 20px 0" }}>
      <BackBtn onBack={onBack} />
      <h1 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px" }}>📥 إضافة جماعية</h1>
      <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: "0 0 12px", lineHeight: 1.8 }}>
        الصقي قائمة الموظفين، كل موظف في سطر، والأعمدة مفصولة بفاصلة أو Tab:<br />
        <b>الاسم، المسمى الوظيفي، الجوال، البريد</b> (غير الاسم اختياري)<br />
        يمكنك نسخها مباشرة من Excel أو Google Sheets.
      </p>
      <textarea rows={10} value={text} onChange={(e) => setText(e.target.value)} disabled={busy}
        placeholder={"أحمد علي، مدير مبيعات، 0500000001، ahmed@company.com\nسارة محمد، مصممة، 0500000002"}
        style={{ width: "100%", resize: "vertical", direction: "rtl" }} />
      {list.length > 0 && (
        <div style={{ fontSize: 12, margin: "8px 0", color: tooMany ? "var(--emergency)" : "var(--muted-foreground)" }}>
          {tooMany ? "الحد الأقصى 200 موظف في المرة الواحدة." : `سيتم إنشاء ${list.length} بطاقة. أول موظف: ${list[0].name}`}
        </div>
      )}
      {busy && <div style={{ fontSize: 13, margin: "8px 0" }}>جاري الإنشاء… {progress} / {list.length}</div>}
      {result && <div style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13, margin: "8px 0" }}>{result}</div>}
      <button className="btn-primary" disabled={busy || !list.length || tooMany} onClick={run} style={{ marginTop: 8, opacity: busy || !list.length || tooMany ? 0.6 : 1 }}>
        إنشاء البطاقات
      </button>
    </div></div>
  );
}
