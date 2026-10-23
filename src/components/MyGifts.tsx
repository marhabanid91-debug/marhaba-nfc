import { useEffect, useState } from "react";
import { claimGift, loadMyGifts, setGiftLink, toEmbed, giftItems, GiftItem, MyGift } from "../lib/gift";

// قسم «هداياي» داخل حساب المُهدي: تفعيل بطاقة هدية وتبديل رابطها
export default function MyGifts() {
  const [list, setList] = useState<MyGift[]>([]);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => loadMyGifts().then(setList);
  useEffect(() => {
    load();
  }, []);

  async function activate() {
    setMsg("");
    const ok = await claimGift(code);
    setMsg(ok ? "تم تفعيل الهدية ✅" : "الرمز غير صحيح أو مفعّل من قبل");
    if (ok) {
      setCode("");
      load();
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 10, boxSizing: "border-box",
    background: "var(--card)", border: "1px solid var(--border-strong)",
    color: "var(--foreground)", fontFamily: "inherit", fontSize: 14,
  };

  return (
    <section dir="rtl" style={{ marginTop: 28 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>🎁 هداياي</h3>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="رمز بطاقة الهدية GIFT-…"
          style={{ ...inputStyle, direction: "ltr" }}
        />
        <button
          onClick={activate}
          disabled={!code.trim()}
          style={{
            padding: "0 16px", borderRadius: 10, border: "none", cursor: "pointer",
            background: "var(--primary)", color: "#000", fontWeight: 700, fontFamily: "inherit",
            opacity: code.trim() ? 1 : 0.5,
          }}
        >
          تفعيل
        </button>
      </div>
      {msg && <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>{msg}</p>}

      {list.map((g) => (
        <GiftRow key={g.serial} g={g} onSaved={load} inputStyle={inputStyle} />
      ))}
    </section>
  );
}

function GiftRow({
  g, onSaved, inputStyle,
}: { g: MyGift; onSaved: () => void; inputStyle: React.CSSProperties }) {
  const [items, setItems] = useState<GiftItem[]>(() => {
    const it = giftItems(g);
    return it.length ? it : [{ url: "", title: "" }];
  });
  const [title, setTitle] = useState(g.gift_title || "");
  const [catalog, setCatalog] = useState(g.gift_catalog || "");
  const [msg, setMsg] = useState("");

  const setItem = (i: number, patch: Partial<GiftItem>) =>
    setItems((prev) => prev.map((it, k) => (k === i ? { ...it, ...patch } : it)));

  async function save() {
    const clean = items
      .map((it) => ({ url: it.url.trim(), title: (it.title || "").trim() }))
      .filter((it) => it.url);
    if (clean.some((it) => toEmbed(it.url).kind === "none")) {
      setMsg("أحد الروابط غير مدعوم. استخدمي رابط يوتيوب أو ملف/مجلد جوجل درايف أو رابط مباشر لصورة/فيديو/صوت.");
      return;
    }
    if (catalog && !/^https:\/\//i.test(catalog.trim())) {
      setMsg("رابط الكتالوج يجب أن يبدأ بـ https://");
      return;
    }
    const ok = await setGiftLink(g.serial, clean, title, catalog.trim());
    setMsg(ok ? "تم التحديث، ستظهر الهدية الجديدة فوراً ✅" : "تعذّر الحفظ");
    if (ok) onSaved();
  }

  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: 14, padding: 14, margin: "12px 0",
    }}>
      <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 8, direction: "ltr", textAlign: "right" }}>
        {g.serial}
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="عنوان الهدية (مثال: لأجمل أم)"
        style={{ ...inputStyle, marginBottom: 8 }}
      />
      {items.map((it, i) => (
        <div key={i} style={{ border: "1px dashed var(--border-strong)", borderRadius: 10, padding: 10, marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{items.length > 1 ? `هدية ${i + 1}` : "الهدية"}</span>
            {items.length > 1 && (
              <button
                onClick={() => setItems((prev) => prev.filter((_, k) => k !== i))}
                style={{ background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer", fontSize: 16 }}
                aria-label="حذف"
              >✕</button>
            )}
          </div>
          <input
            value={it.url}
            onChange={(e) => setItem(i, { url: e.target.value })}
            placeholder="رابط يوتيوب أو ملف أو مجلد جوجل درايف"
            style={{ ...inputStyle, direction: "ltr", marginBottom: 6 }}
          />
          <input
            value={it.title || ""}
            onChange={(e) => setItem(i, { title: e.target.value })}
            placeholder="وصف قصير (اختياري)"
            style={inputStyle}
          />
        </div>
      ))}
      {/* يظهر زر الإضافة فقط بعد أن يكتب المُهدي رابط الهدية الحالية */}
      {items.every((it) => it.url.trim()) && (
      <button
        onClick={() => setItems((prev) => [...prev, { url: "", title: "" }])}
        style={{
          width: "100%", padding: "10px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
          background: "transparent", border: "1px dashed var(--primary)", color: "var(--primary)", fontWeight: 600,
        }}
      >
        ➕ إضافة هدية أخرى
      </button>
      )}
      <input
        value={catalog}
        onChange={(e) => setCatalog(e.target.value)}
        placeholder="رابط الكتالوج (اختياري) https://…"
        style={{ ...inputStyle, direction: "ltr", marginTop: 8 }}
      />
      <button
        onClick={save}
        style={{
          marginTop: 10, padding: "10px 18px", borderRadius: 10, border: "none", cursor: "pointer",
          background: "var(--primary)", color: "#000", fontWeight: 700, fontFamily: "inherit",
        }}
      >
        حفظ
      </button>
      {msg && <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: "8px 0 0" }}>{msg}</p>}
    </div>
  );
}
