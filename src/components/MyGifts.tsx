import { useEffect, useState } from "react";
import { claimGift, loadMyGifts, setGiftLink, toEmbed, MyGift } from "../lib/gift";

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
  const [url, setUrl] = useState(g.gift_url || "");
  const [title, setTitle] = useState(g.gift_title || "");
  const [msg, setMsg] = useState("");

  async function save() {
    if (url && toEmbed(url).kind === "none") {
      setMsg("الرابط غير مدعوم. استخدمي رابط يوتيوب أو جوجل درايف.");
      return;
    }
    const ok = await setGiftLink(g.serial, url, title);
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
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="الصقي رابط يوتيوب أو جوجل درايف"
        style={{ ...inputStyle, direction: "ltr" }}
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
