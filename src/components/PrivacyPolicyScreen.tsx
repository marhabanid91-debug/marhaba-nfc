import { useApp } from "../context/AppContext";

export default function PrivacyPolicyScreen() {
  const { lang, setScreen, prevScreen } = useApp();
  const isAr = lang === "ar";

  const goBack = () => setScreen(prevScreen === "privacy-policy" ? "auth" : prevScreen);

  return (
    <div className="screen fade-in">
      <div style={{ padding: "0 0 20px" }}>
        {/* Header */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          background: "var(--background)",
          padding: "16px 20px 14px",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <button
            onClick={goBack}
            style={{
              background: "var(--card-elevated)", border: "1px solid var(--border-strong)",
              borderRadius: 10, width: 36, height: 36, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--foreground)", fontSize: 16,
            }}
          >
            {isAr ? "→" : "←"}
          </button>
          <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
            {isAr ? "سياسة الخصوصية والشروط" : "Privacy Policy & Terms"}
          </h1>
        </div>

        <div style={{ padding: "20px 20px 0" }}>
          {/* Last updated */}
          <div style={{
            fontSize: 12, color: "var(--muted-foreground)",
            marginBottom: 24, display: "flex", alignItems: "center", gap: 6,
          }}>
            📅 {isAr ? "آخر تحديث: 24 أغسطس 2026" : "Last updated: August 24, 2026"}
          </div>

          {isAr ? <ContentAr /> : <ContentEn />}
        </div>
      </div>
    </div>
  );
}

function ContentAr() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Intro text="نلتزم في منصة «مرحباً - Marhaba» بحماية خصوصيتك وسرية بياناتك عبر إكسسواراتنا الذكية." />

      <Section num="1" title="البيانات التي نجمعها">
        <p>نعتمد مبدأ الحد الأدنى من البيانات حسب فئتك:</p>
        <ul>
          <li><strong>الأطفال وذوو الاحتياجات الخاصة:</strong> الاسم، أرقام الطوارئ، وملاحظات طبية مختصرة (فصيلة الدم/الحساسية) للسلامة فقط، بدون تقارير حساسة.</li>
          <li><strong>المهنيون ورواد الأعمال:</strong> الاسم، المسمى، أرقام التواصل، والبريد وروابط التواصل.</li>
          <li><strong>الفعاليات:</strong> اسم الفعالية والمسمى التنظيمي للبطاقات المؤقتة.</li>
        </ul>
      </Section>

      <Section num="2" title="التحكم والتبديل بين الأوضاع">
        <p>يمكنك تبديل وضعك النشط في أي وقت بين (الطوارئ، المهني، أو الفعاليات) بضغطة زر.</p>
        <p>تملك الصلاحية الكاملة لإخفاء أو إظهار أي حقل عبر أزرار التحكم الفورية (Toggles).</p>
      </Section>

      <Section num="3" title="أمن وحماية البيانات">
        <p>نطبق أعلى معايير الحماية البرمجية والتشفير لقاعدة البيانات.</p>
        <p>لا نقوم إطلاقًا ببيع أو مشاركة بياناتك أو بيانات أطفالك مع أي طرف ثالث.</p>
      </Section>

      <Section num="4" title="حماية الفئات الخاصة">
        <p>تقع مسؤولية إدارة بيانات الأطفال وذوي الاحتياجات الخاصة حصريًا على ولي الأمر أو الوصي القانوني.</p>
        <p>بيانات الطوارئ الخاصة بهم مخفية افتراضيًا ولا تظهر إلا للطوارئ حسب إعدادات ولي الأمر، كما يمكنه أيضًا عدم تفعيل الوضع النشط إلا في حالات الطوارئ.</p>
      </Section>

      <Section num="5" title="إخلاء المسؤولية القانونية">
        <p>المنصة وسيط تقني لعرض بياناتك؛ ولا تتحمل أي مسؤولية عن خطأ الإدخال، أو تأخر الاستجابة، أو العناية الطبية البديلة.</p>
        <p>في حال فقدان البطاقة، يتحمل المستخدم مسؤولية تعطيلها فورًا عبر الحساب، والمنصة غير مسؤولة عن الاستخدام السابق للتعطيل.</p>
      </Section>

      <Section num="6" title="إدارة الحساب والحذف النهائي">
        <p>يمكنك تعديل أو إخفاء بياناتك في أي وقت، أو طلب «حذف الحساب نهائيًا» لمسح كافة بياناتك من خوادمنا بشكل دائم.</p>
      </Section>

      <Section num="7" title="الإكسسوارات">
        <p>الإكسسوارات مقاومة للماء والاستخدام اليومي الطبيعي، ولا تتحمل المنصة تلف القطعة الناتج عن سوء الاستخدام الشديد أو درجات الحرارة العالية جدًا.</p>
      </Section>

      <div style={{
        background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)",
        borderRadius: 14, padding: "16px 18px",
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📬 تواصل معنا</div>
        <div style={{ fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.8, marginBottom: 12 }}>
          البريد الإلكتروني: support@marhaba.com
        </div>
        <a
          href={"https://wa.me/966500816798?text=" + encodeURIComponent("مرحباً، أتواصل معكم بخصوص منصة Marhaba NFC")}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "11px 14px", borderRadius: 10,
            background: "#25D366", color: "white",
            fontWeight: 700, fontSize: 13, textDecoration: "none",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          تواصل عبر واتساب — +966 500 816 798
        </a>
      </div>
    </div>
  );
}

function ContentEn() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Intro text='At "Marhaba" platform, we are committed to protecting your privacy and the confidentiality of your data through our smart accessories.' />

      <Section num="1" title="Data We Collect">
        <p>We follow a minimum data principle based on your category:</p>
        <ul>
          <li><strong>Children & Special Needs:</strong> Name, emergency numbers, brief medical notes (blood type/allergies) for safety only.</li>
          <li><strong>Professionals & Entrepreneurs:</strong> Name, title, contact numbers, email, and social links.</li>
          <li><strong>Events:</strong> Event name and organizational title for temporary cards.</li>
        </ul>
      </Section>

      <Section num="2" title="Control & Mode Switching">
        <p>You can switch your active mode at any time between (Emergency, Professional, or Events) with one tap.</p>
        <p>You have full authority to hide or show any field using instant toggle controls.</p>
      </Section>

      <Section num="3" title="Security & Data Protection">
        <p>We apply the highest standards of software protection and database encryption.</p>
        <p>We never sell or share your data or your children's data with any third party.</p>
      </Section>

      <Section num="4" title="Protection of Special Categories">
        <p>Management of children's and special needs individuals' data is exclusively the responsibility of the parent or legal guardian.</p>
        <p>Their emergency data is hidden by default and only appears for emergencies according to guardian settings.</p>
      </Section>

      <Section num="5" title="Legal Disclaimer">
        <p>The platform is a technical intermediary for displaying your data; it bears no responsibility for input errors, response delays, or alternative medical care.</p>
        <p>If the card is lost, the user is responsible for immediately deactivating it through the account.</p>
      </Section>

      <Section num="6" title="Account Management & Final Deletion">
        <p>You can edit or hide your data at any time, or request "permanent account deletion" to erase all your data from our servers permanently.</p>
      </Section>

      <Section num="7" title="Accessories">
        <p>Accessories are water-resistant and suitable for normal daily use. The platform is not responsible for damage resulting from severe misuse or extremely high temperatures.</p>
      </Section>

      <div style={{
        background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)",
        borderRadius: 14, padding: "16px 18px",
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📬 Contact Us</div>
        <div style={{ fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.8, marginBottom: 12 }}>
          Email: support@marhaba.com
        </div>
        <a
          href={"https://wa.me/966500816798?text=" + encodeURIComponent("Hello, I'm contacting you regarding Marhaba NFC platform")}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "11px 14px", borderRadius: 10,
            background: "#25D366", color: "white",
            fontWeight: 700, fontSize: 13, textDecoration: "none",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp — +966 500 816 798
        </a>
      </div>
    </div>
  );
}

function Intro({ text }: { text: string }) {
  return (
    <p style={{
      fontSize: 14, lineHeight: 1.8, color: "var(--foreground)",
      background: "var(--card)", padding: "14px 16px", borderRadius: 12,
      border: "1px solid var(--border)",
    }}>
      {text}
    </p>
  );
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 8, flexShrink: 0,
          background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 800, color: "var(--primary)",
        }}>
          {num}
        </div>
        <h3 style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>{title}</h3>
      </div>
      <div style={{
        fontSize: 13, lineHeight: 1.9, color: "var(--muted-foreground)",
        paddingInlineStart: 36,
      }}>
        {children}
      </div>
    </div>
  );
}

