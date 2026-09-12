import { useApp } from "../context/AppContext";
import { Screen } from "../types";

const navItems: { screen: Screen; icon: string; labelAr: string; labelEn: string }[] = [
  {
    screen: "home",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    labelAr: "الرئيسية",
    labelEn: "Home",
  },
  {
    screen: "emergency",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.9 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.81 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 10.91a16 16 0 0 0 5 5l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 17v-.08z"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>`,
    labelAr: "الطوارئ",
    labelEn: "Emergency",
  },
  {
    screen: "business",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
    labelAr: "الأعمال",
    labelEn: "Business",
  },
  {
    screen: "events",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    labelAr: "الفعاليات",
    labelEn: "Events",
  },
  {
    screen: "accessory",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    labelAr: "الإكسسوار",
    labelEn: "Accessory",
  },
  {
    screen: "settings",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    labelAr: "الإعدادات",
    labelEn: "Settings",
  },
];

export default function BottomNav() {
  const { screen, setScreen, lang } = useApp();

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: "50%",
      transform: "translateX(-50%)",
      width: "100%",
      maxWidth: 430,
      background: "var(--nav-bg)",
      backdropFilter: "blur(16px)",
      borderTop: "1px solid var(--border)",
      display: "flex",
      paddingBottom: "env(safe-area-inset-bottom, 8px)",
      zIndex: 100,
    }}>
      {navItems.map((item) => {
        const isActive = screen === item.screen;
        const label = lang === "ar" ? item.labelAr : item.labelEn;
        return (
          <button
            key={item.screen}
            onClick={() => setScreen(item.screen)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 4px 8px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: isActive ? "var(--primary)" : "var(--muted-foreground)",
              transition: "color 0.2s",
              fontFamily: "inherit",
              gap: 3,
            }}
          >
            <span dangerouslySetInnerHTML={{ __html: item.icon }} />
            <span style={{ fontSize: 9, fontWeight: isActive ? 600 : 400, letterSpacing: 0.2 }}>
              {label}
            </span>
            {isActive && (
              <div style={{
                position: "absolute",
                top: 0,
                width: 32,
                height: 2,
                background: "var(--primary)",
                borderRadius: "0 0 2px 2px",
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

