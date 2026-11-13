import { useEffect, useState } from "react";
import StatsBox from "./StatsBox";
import { copyText, shareLink } from "../lib/share";
import { claimGift, loadMyGifts, setGiftLink, setGiftPromo, toEmbed, isTikTokUnsupported, giftItems, cleanPromo, GiftItem, GiftOffer, MyGift } from "../lib/gift";

// قسم «أعمال وهدايا» داخل حساب المُهدي: تفعيل بطاقة هدية وتبديل رابطها
export default function MyGifts() {
  const [list, setList] = useState<MyGift[]>([]);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [showAdd, setShowAdd] = useState(false);

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
      setShowAdd(false);
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
      <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>🎁 أعمال وهدايا</h3>

      {list.length > 0 && !showAdd && (
        <button
          onClick={() => setShowAdd(true)}
          style={{
            width: "100%", padding: "10px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
            background: "transparent", border: "1px dashed var(--primary)", color: "var(--primary)", fontWeight: 600,
            marginBottom: 8,
          }}
        >
          ➕ إضافة هدية جديدة (رمز بطاقة لشخص آخر)
        </button>
      )}
      {(list.length === 0 || showAdd) && (
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
      )}
      {msg && <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>{msg}</p>}

      {list.map((g) => (
        <GiftRow key={g.serial} g={g} onSaved={load} inputStyle={inputStyle} />
      ))}
    </section>
  );
}

const quickBtn: React.CSSProperties = {
  flex: 1, padding: "8px 0", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
  fontSize: 12.5, fontWeight: 600, background: "var(--card-elevated)",
  border: "1px solid var(--border-strong)", color: "var(--foreground)",
};

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
  const initPromo = cleanPromo(g.gift_promo);
  const [followUrl, setFollowUrl] = useState(initPromo.follow?.url || "");
  const [followTitle, setFollowTitle] = useState(initPromo.follow?.title || "");
  const [offers, setOffers] = useState<GiftOffer[]>(initPromo.offers);
  const hadPromo = !!(initPromo.follow || initPromo.offers.length);
  // بطاقة مصغّرة بعد الحفظ؛ تُفتح عند الضغط. الهدية الجديدة الفارغة تبدأ مفتوحة
  const hasContent = !!(g.gift_title || giftItems(g).length || g.gift_catalog || hadPromo);
  const [open, setOpen] = useState(!hasContent);
  const cardName = title.trim() || giftItems(g).find((it) => it.title)?.title || (g.gift_catalog ? "كتالوج" : "هدية بدون عنوان");
  const nLinks = items.filter((it) => it.url.trim()).length;
  const giftUrl = `https://marhabanid.com/?serial=${encodeURIComponent(g.serial)}`;
  const [linkMsg, setLinkMsg] = useState("");
  const flash = (t: string) => { setLinkMsg(t); setTimeout(() => setLinkMsg(""), 2500); };
  const copyGift = async () => flash((await copyText(giftUrl)) ? "تم نسخ الرابط ✅" : "تعذّر النسخ");
  const shareGift = async () => {
    const r = await shareLink(giftUrl, cardName);
    if (r === "copied") flash("تم نسخ الرابط ✅");
    if (r === "failed") flash("تعذّرت المشاركة");
  };

  const setOffer = (i: number, patch: Partial<GiftOffer>) =>
    setOffers((prev) => prev.map((o, k) => (k === i ? { ...o, ...patch } : o)));

  const setItem = (i: number, patch: Partial<GiftItem>) =>
    setItems((prev) => prev.map((it, k) => (k === i ? { ...it, ...patch } : it)));

  async function save() {
    const clean = items
      .map((it) => ({ url: it.url.trim(), title: (it.title || "").trim() }))
      .filter((it) => it.url);
    if (clean.some((it) => isTikTokUnsupported(it.url))) {
      setMsg("رابط تيك توك المختصر (vm.tiktok.com أو tiktok.com/t/…) لا يعمل. افتحي الفيديو في المتصفح وانسخي الرابط الكامل الذي يحتوي /video/ ثم الصقيه هنا.");
      return;
    }
    if (clean.some((it) => toEmbed(it.url).kind === "none")) {
      setMsg("أحد الروابط غير مدعوم. استخدمي رابط يوتيوب أو تيك توك (الكامل) أو ملف/مجلد جوجل درايف أو رابط مباشر لصورة/فيديو/صوت.");
      return;
    }
    if (catalog && !/^https:\/\//i.test(catalog.trim())) {
      setMsg("رابط الكتالوج يجب أن يبدأ بـ https://");
      return;
    }
    const httpsOnly = /^https:\/\//i;
    if (followUrl.trim() && !httpsOnly.test(followUrl.trim())) {
      setMsg("رابط المتابعة يجب أن يبدأ بـ https://");
      return;
    }
    const cleanOffers = offers
      .map((o) => ({ title: (o.title || "").trim(), how: (o.how || "").trim(), url: (o.url || "").trim() }))
      .filter((o) => o.title || o.how || o.url);
    if (cleanOffers.some((o) => o.url && !httpsOnly.test(o.url))) {
      setMsg("رابط العرض يجب أن يبدأ بـ https://");
      return;
    }
    const ok = await setGiftLink(g.serial, clean, title, catalog.trim());
    if (!ok) {
      setMsg("تعذّر الحفظ");
      return;
    }
    const promo = {
      follow: followUrl.trim() ? { url: followUrl.trim(), title: followTitle.trim() } : null,
      offers: cleanOffers,
    };
    if (promo.follow || promo.offers.length || hadPromo) {
      const ok2 = await setGiftPromo(g.serial, promo);
      if (!ok2) {
        setMsg("تم حفظ الهدية، لكن تعذّر حفظ المتابعة والعروض (تأكدي من تشغيل ملف gift-promo.sql)");
        onSaved();
        return;
      }
    }
    setMsg("تم التحديث، ستظهر الهدية الجديدة فوراً ✅");
    onSaved();
    setOpen(false);
    setTimeout(() => setMsg(""), 4000);
  }

  return (
    <div style={{
      background: "var(--card)", border: `1px solid ${open ? "var(--primary)" : "var(--border)"}`,
      borderRadius: 14, margin: "12px 0", overflow: "hidden",
    }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
          background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
          color: "var(--foreground)", textAlign: "start",
        }}
      >
        <span style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0, fontSize: 20,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(201,168,76,0.14)", border: "1px solid rgba(201,168,76,0.35)",
        }}>🎁</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {cardName}
          </span>
          <span style={{ display: "block", fontSize: 12, marginTop: 3, color: "var(--muted-foreground)" }}>
            <span dir="ltr">{g.serial}</span>
            {nLinks > 0 && <> · 🎁 {nLinks}</>}
            {catalog.trim() && <> · 📖</>}
            {offers.length > 0 && <> · 🎉 {offers.length}</>}
          </span>
        </span>
        <span style={{ color: "var(--muted-foreground)", fontSize: 12, flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </button>
      <div style={{ display: "flex", gap: 8, padding: "0 14px 12px" }}>
        <button type="button" onClick={copyGift} style={quickBtn}>🔗 نسخ الرابط</button>
        <button type="button" onClick={shareGift} style={quickBtn}>↗ مشاركة الرابط</button>
      </div>
      {linkMsg && <p style={{ fontSize: 12.5, color: "#22c55e", margin: 0, padding: "0 14px 10px" }}>{linkMsg}</p>}
      {!open && msg && <p style={{ fontSize: 12.5, color: "#22c55e", margin: 0, padding: "0 14px 10px" }}>{msg}</p>}

      {open && (
      <div style={{ padding: "0 14px 14px" }}>
      <StatsBox
        kind="gift"
        target={g.serial}
        labels={Object.fromEntries(initPromo.offers.map((o, i) => [`offer:${i}`, `🎉 ${o.title || `عرض ${i + 1}`}`]))}
      />
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
      <input
        value={catalog}
        onChange={(e) => setCatalog(e.target.value)}
        placeholder="رابط الكتالوج (اختياري) https://…"
        style={{ ...inputStyle, direction: "ltr", marginTop: 8 }}
      />

      <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>💛 رابط المتابعة (اختياري)</div>
        <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 8, lineHeight: 1.7 }}>
          ضعي رابط صفحتك في مرحبا (شخص أو فعالية أو متجر) ليتابعك من أُهديت له الهدية.
        </div>
        <input
          value={followUrl}
          onChange={(e) => setFollowUrl(e.target.value)}
          placeholder="https://marhabanid.com/?c=…"
          style={{ ...inputStyle, direction: "ltr", marginBottom: 6 }}
        />
        <input
          value={followTitle}
          onChange={(e) => setFollowTitle(e.target.value)}
          placeholder="اسمك أو اسم الفعالية (مثال: معرض تجار)"
          maxLength={80}
          style={inputStyle}
        />
      </div>

      <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🎉 عروض وسحوبات (اختياري)</div>
        {offers.map((o, i) => (
          <div key={i} style={{ border: "1px dashed var(--border-strong)", borderRadius: 10, padding: 10, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>عرض {i + 1}</span>
              <button
                onClick={() => setOffers((prev) => prev.filter((_, k) => k !== i))}
                style={{ background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer", fontSize: 16 }}
                aria-label="حذف"
              >✕</button>
            </div>
            <input
              value={o.title}
              onChange={(e) => setOffer(i, { title: e.target.value })}
              placeholder="عنوان العرض أو السحب (مثال: سحب على جوال)"
              maxLength={80}
              style={{ ...inputStyle, marginBottom: 6 }}
            />
            <textarea
              value={o.how || ""}
              onChange={(e) => setOffer(i, { how: e.target.value })}
              placeholder="طريقة المشاركة (مثال: تابعينا وشاركي المنشور وعلّمي ٣ من صديقاتك)"
              maxLength={600}
              rows={3}
              style={{ ...inputStyle, marginBottom: 6, resize: "vertical" }}
            />
            <input
              value={o.url || ""}
              onChange={(e) => setOffer(i, { url: e.target.value })}
              placeholder="رابط المشاركة (اختياري) https://…"
              style={{ ...inputStyle, direction: "ltr" }}
            />
          </div>
        ))}
        {offers.length < 20 && (
          <button
            onClick={() => setOffers((prev) => [...prev, { title: "", how: "", url: "" }])}
            style={{
              width: "100%", padding: "9px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
              background: "transparent", border: "1px dashed var(--primary)", color: "var(--primary)", fontWeight: 600,
            }}
          >
            ➕ إضافة عرض أو سحب
          </button>
        )}
      </div>

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
      )}
    </div>
  );
}
