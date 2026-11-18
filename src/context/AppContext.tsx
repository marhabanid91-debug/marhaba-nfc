import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { Language, Screen, Identity, User, ActiveMode } from "../types";
import { translations, TKey } from "../i18n";
import { supabase } from "../lib/supabase";
import {
  loadUserIdentities, createIdentity, updateIdentityMode as dbUpdateMode,
  updateIdentityActive, deleteIdentityFromDB, loadProfile, upsertProfile,
  activateCard, serialForToken, isTokenCard, SerialRecord, loadPublicIdentityBySerial, lookupSerial,
} from "../lib/db";
import { getGiftBySerial, claimGift } from "../lib/gift";

const defaultVisibility = {
  birthDate: true, bloodType: true, conditions: true,
  allergies: true, medications: true, firstAidInstructions: true,
};

const makeDefaultIdentity = (name = ""): Omit<Identity, "id" | "serialNumber"> => ({
  activeMode: "business",
  isActive: true,
  emergency: {
    photo: "", name, birthDate: "", bloodType: "",
    conditions: "", allergies: "", medications: "", firstAidInstructions: "",
    emergencyContacts: [], visibility: { ...defaultVisibility },
  },
  business: { photo: "", name, jobTitle: "", company: "", bio: "", phone: "", email: "", website: "", location: "", socialLinks: {} },
  events: { photo: "", name, bio: "", eventName: "", eventLocation: "", status: "" as const, ticketLink: "", socialLinks: {} },
  offlineSettings: { name: true, contactPhone: true, emergencyPhone: true },
});

interface AppContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: TKey) => string;
  screen: Screen;
  setScreen: (s: Screen) => void;
  prevScreen: Screen;
  user: User | null;
  setUser: (u: User | null) => void;
  setAvatarUrl: (url: string) => void;
  identities: Identity[];
  setIdentities: (ids: Identity[]) => void;
  activeIdentityId: string | null;
  setActiveIdentityId: (id: string | null) => void;
  creatingId: string | null;
  setCreatingId: (id: string | null) => void;
  updateIdentityMode: (id: string, mode: ActiveMode) => void;
  addIdentity: (name: string) => void;
  deleteIdentity: (id: string) => void;
  toggleIdentityActive: (id: string) => void;
  readerPreviewMode: ActiveMode;
  setReaderPreviewMode: (m: ActiveMode) => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  disclaimerAcknowledged: boolean;
  setDisclaimerAcknowledged: (v: boolean) => void;
  dbLoading: boolean;
  initializing: boolean;
  supabaseUser: any;
  isAdmin: boolean;
  pendingSerial: SerialRecord | null;
  setPendingSerial: (c: SerialRecord | null) => void;
  gateSerial: string | null;
  setGateSerial: (s: string | null) => void;
  authMode: "login" | "register";
  setAuthMode: (m: "login" | "register") => void;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("ar");
  const [screen, setScreenState] = useState<Screen>("card-scan");
  const [prevScreen, setPrevScreen] = useState<Screen>("home");
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingSerial, setPendingSerial] = useState<SerialRecord | null>(() => {
    const s = localStorage.getItem("pending_serial");
    return s ? { serial_number: s, status: "available", identity_id: null } : null;
  });
  const [authMode, setAuthMode] = useState<"login" | "register">(
    localStorage.getItem("pending_serial") || localStorage.getItem("pending_gift") ? "register" : "login"
  );
  // الرقم المتوقع عند مسح بطاقة غير مفعّلة (يجب على الزائر إدخاله قبل أي تسجيل)
  const [gateSerial, setGateSerial] = useState<string | null>(null);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [activeIdentityId, setActiveIdentityId] = useState<string | null>(null);
  // هوية قيد الإنشاء (تُحفظ في sessionStorage لأن إنشاءها يُعيد تحميل الصفحة)
  const [creatingId, setCreatingIdState] = useState<string | null>(() => {
    try { return sessionStorage.getItem("creating_identity"); } catch { return null; }
  });
  const setCreatingId = (id: string | null) => {
    setCreatingIdState(id);
    try { if (id) sessionStorage.setItem("creating_identity", id); else sessionStorage.removeItem("creating_identity"); } catch {}
  };
  const [readerPreviewMode, setReaderPreviewMode] = useState<ActiveMode>("business");
  const [dbLoading, setDbLoading] = useState(false);
  // Gate that hides the card-scan welcome screen from ever flashing on
  // startup — while true, App.tsx renders a plain loading spinner instead,
  // whether we're resolving a scanned serial or just checking the session.
  const [initializing, setInitializing] = useState(true);
  const [disclaimerAcknowledged, setDisclaimerAcknowledgedState] = useState<boolean>(() =>
    localStorage.getItem("marhaba-disclaimer") === "true"
  );
  const [darkMode, setDarkModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem("marhaba-theme");
    return saved ? saved === "dark" : true;
  });

  // ===== زر الرجوع: يعيد للصفحة السابقة داخل التطبيق بدل الخروج من الموقع =====
  const screenRef = useRef<Screen>(screen);
  screenRef.current = screen;
  const userRef = useRef<any>(null);
  userRef.current = supabaseUser;
  const pushedRef = useRef(false);
  const fromPopRef = useRef(false);
  // عمق المدخل الحالي في سجل المتصفح: 0 = بداية السجل (نعترض عندها الخروج ونطلب تأكيداً)
  const depthRef = useRef(0);
  const exitArmedRef = useRef(false);
  const [exitHint, setExitHint] = useState(false);

  const setScreen = (s: Screen) => {
    if (s === screen) return;
    setPrevScreen(screen);
    pushedRef.current = true;
    depthRef.current += 1;
    try { window.history.pushState({ app: true, screen: s, d: depthRef.current }, ""); } catch {}
    setScreenState(s);
  };

  // عند أول تحميل: مدخل أساس (d=0) ثم مدخل فوقه (d=1)، حتى يمكن اعتراض الرجوع للخروج
  useEffect(() => {
    try {
      const st = window.history.state as { app?: boolean; d?: number } | null;
      if (st && st.app) { depthRef.current = st.d ?? 0; return; } // إعادة تحميل: السجل موجود
      window.history.replaceState({ app: true, screen: screenRef.current, d: 0 }, "");
      window.history.pushState({ app: true, screen: screenRef.current, d: 1 }, "");
      depthRef.current = 1;
    } catch {}
  }, []);

  // أي تغيير آخر للصفحة (تحميل أولي، توجيه بعد الدخول…) يستبدل المدخل الحالي ولا يضيف مدخلاً جديداً
  useEffect(() => {
    if (pushedRef.current) { pushedRef.current = false; return; }
    if (fromPopRef.current) { fromPopRef.current = false; return; }
    try { window.history.replaceState({ app: true, screen, d: depthRef.current }, ""); } catch {}
  }, [screen]);

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const st = e.state as { app?: boolean; screen?: Screen; d?: number } | null;
      if (!st || !st.app || !st.screen) return;
      depthRef.current = st.d ?? 0;
      // وصلنا لبداية السجل: الضغطة الأولى تُظهر تنبيهاً، والثانية خلال ثوانٍ تخرج
      if (st.d === 0) {
        if (!userRef.current || exitArmedRef.current) {
          exitArmedRef.current = false;
          setExitHint(false);
          try { window.history.back(); } catch {}
          return;
        }
        exitArmedRef.current = true;
        setExitHint(true);
        window.setTimeout(() => { exitArmedRef.current = false; setExitHint(false); }, 2500);
        depthRef.current = 1;
        try { window.history.pushState({ app: true, screen: screenRef.current, d: 1 }, ""); } catch {}
        return;
      }
      let target: Screen = st.screen;
      // بعد تسجيل الدخول لا نعود لشاشات الدخول أو المسح، بل للرئيسية
      if (userRef.current && (target === "auth" || target === "card-scan" || target === "serial-gate")) target = "home";
      if (target === screenRef.current) return;
      fromPopRef.current = true;
      setScreenState(target);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const setDarkMode = (v: boolean) => {
    setDarkModeState(v);
    localStorage.setItem("marhaba-theme", v ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", v ? "dark" : "light");
  };

  const setDisclaimerAcknowledged = (v: boolean) => {
    setDisclaimerAcknowledgedState(v);
    localStorage.setItem("marhaba-disclaimer", v ? "true" : "false");
  };

  const setLang = (l: Language) => {
    setLangState(l);
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = l;
  };

  useEffect(() => {
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "ar";
    const saved = localStorage.getItem("marhaba-theme");
    document.documentElement.setAttribute("data-theme", saved === "light" ? "light" : "dark");

    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("c");
    const rawSerialFromUrl = params.get("serial");

    if (tokenFromUrl || rawSerialFromUrl) {
      // البطاقات الجديدة تُفتح برمز عشوائي (?c=)، والبطاقات ذات الرمز لا تُفتح بالرقم التسلسلي
      const resolveSerial = async (): Promise<string | null> => {
        if (tokenFromUrl) return await serialForToken(tokenFromUrl);
        if (await isTokenCard(rawSerialFromUrl!)) return null;
        return rawSerialFromUrl;
      };
      resolveSerial().then((serialFromUrl) => {
      if (!serialFromUrl) {
        setScreenState("auth");
        setInitializing(false);
        return;
      }
      return getGiftBySerial(serialFromUrl).then((gift) => {
        // بطاقة هدية مفعّلة: تُعرض صفحة الهدية فقط
        if (gift && gift.status === "linked") {
          setScreenState("reader-gift");
          setInitializing(false);
          return;
        }
        // بطاقة هدية لم تُفعَّل بعد: يسجّل المُهدي دخوله ثم تُفعَّل على حسابه
        if (gift) {
          localStorage.setItem("pending_gift", gift.serial);
          window.location.replace(window.location.pathname);
          return;
        }
        return loadPublicIdentityBySerial(serialFromUrl, tokenFromUrl).then(async (identity) => {
        if (identity) {
          setIdentities([identity]);
          setActiveIdentityId(identity.id);
          setReaderPreviewMode(identity.activeMode);
          setScreenState(`reader-${identity.activeMode}` as Screen);
          setInitializing(false);
          return;
        }
        const lookup = await lookupSerial(serialFromUrl);
        if (lookup.status === "available") {
          // بطاقة غير مفعّلة: لا تسجيل ولا ربط قبل إدخال الرقم المرفق مع البطاقة
          setGateSerial(lookup.record.serial_number);
          setScreenState("serial-gate");
          setInitializing(false);
          return;
        }
        setScreenState("auth");
        setInitializing(false);
        });
      });
      }).catch(() => {
        setScreenState("auth");
        setInitializing(false);
      });
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setScreenState("auth");
        setInitializing(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") return;

      if (session?.user) {
        const su = session.user;
        setSupabaseUser(su);
        const shouldReload = event === "SIGNED_IN" || event === "INITIAL_SESSION";

        const isGoogle = su.app_metadata?.provider === "google";
        if (event === "SIGNED_IN" && isGoogle) {
          upsertProfile(su.id, {
            avatar_url: su.user_metadata?.avatar_url ?? undefined,
          }).catch(() => {});
        }

        const profile = await loadProfile(su.id).catch(() => ({ avatar_url: null, is_admin: false }));
        setIsAdmin(profile.is_admin);
        const appUser: User = {
          id: su.id,
          name: su.user_metadata?.full_name || su.email?.split("@")[0] || "مستخدم",
          email: su.email || "",
          emailConfirmed: su.email_confirmed_at != null,
          avatarUrl: profile.avatar_url ?? su.user_metadata?.avatar_url ?? null,
        };
        setUser(appUser);

        if (shouldReload) {
          setDbLoading(true);
          try {
            const loaded = await loadUserIdentities(su.id);
            setIdentities(loaded);
            if (loaded.length) setActiveIdentityId(loaded[0].id);

            const pendingGift = localStorage.getItem("pending_gift");
            if (pendingGift) {
              claimGift(pendingGift)
                .then(() => localStorage.removeItem("pending_gift"))
                .catch(() => {});
            }

            // pending_serial لا يُكتب إلا بعد التحقق من الرقم في شاشة serial-gate
            const pendingCode = localStorage.getItem("pending_serial");
            const pendingActCode = localStorage.getItem("pending_code") || "";
            if (pendingCode) {
              try {
                let targetId = loaded.length && !loaded[0].serialNumber ? loaded[0].id : null;
                if (!targetId) targetId = await createIdentity(su.id, "هويتي الجديدة");
                if (targetId) {
                  const ok = await activateCard(pendingCode, pendingActCode, targetId);
                  if (ok) setIdentities(await loadUserIdentities(su.id));
                }
              } catch { /* ignore */ }
              localStorage.removeItem("pending_serial");
              localStorage.removeItem("pending_code");
            }
            setPendingSerial(null);
          } catch {
            // silently continue
          } finally {
            setDbLoading(false);
          }
          setScreenState("home");
        }
        setInitializing(false);
      } else {
        setSupabaseUser(null);
        setUser(null);
        setIsAdmin(false);
        setIdentities([]);
        setActiveIdentityId(null);
        setScreenState("auth");
        setInitializing(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const setAvatarUrl = (url: string) =>
    setUser((prev) => prev ? { ...prev, avatarUrl: url } : prev);

  const t = (key: TKey): string => translations[lang][key] as string;

  const updateIdentityMode = (id: string, mode: ActiveMode) => {
    setIdentities((prev) => prev.map((i) => i.id === id ? { ...i, activeMode: mode } : i));
    if (supabaseUser) dbUpdateMode(id, mode).catch(() => {});
  };

  const addIdentity = async (name: string) => {
    if (supabaseUser) {
      setDbLoading(true);
      try {
        const newId = await createIdentity(supabaseUser.id, name);
        if (newId) {
          const newIdentity: Identity = { id: newId, serialNumber: null, ...makeDefaultIdentity(name) };
          setIdentities((prev) => [...prev, newIdentity]);
          setActiveIdentityId(newId);
        }
      } finally {
        setDbLoading(false);
      }
    } else {
      const newId = String(Date.now());
      const newIdentity: Identity = { id: newId, serialNumber: null, ...makeDefaultIdentity(name) };
      setIdentities((prev) => [...prev, newIdentity]);
      setActiveIdentityId(newId);
    }
  };

  const deleteIdentity = (id: string) => {
    const remaining = identities.filter((i) => i.id !== id);
    setIdentities(remaining);
    setActiveIdentityId(remaining[0]?.id || null);
    if (supabaseUser) deleteIdentityFromDB(id).catch(() => {});
  };

  const toggleIdentityActive = (id: string) => {
    setIdentities((prev) => prev.map((i) => {
      if (i.id !== id) return i;
      const next = { ...i, isActive: !i.isActive };
      if (supabaseUser) updateIdentityActive(id, next.isActive).catch(() => {});
      return next;
    }));
  };

  return (
    <AppContext.Provider
      value={{
        lang, setLang, t, screen, setScreen, prevScreen,
        user, setUser, setAvatarUrl,
        identities, setIdentities,
        activeIdentityId, setActiveIdentityId,
        creatingId, setCreatingId,
        updateIdentityMode, addIdentity, deleteIdentity, toggleIdentityActive,
        readerPreviewMode, setReaderPreviewMode,
        darkMode, setDarkMode,
        disclaimerAcknowledged, setDisclaimerAcknowledged,
        dbLoading, initializing, supabaseUser, isAdmin, pendingSerial, setPendingSerial,
        gateSerial, setGateSerial,
        authMode, setAuthMode,
      }}
    >
      {children}
      {exitHint && (
        <div style={{
          position: "fixed", bottom: 96, left: "50%", transform: "translateX(-50%)", zIndex: 300,
          background: "rgba(0,0,0,0.88)", color: "#fff", padding: "10px 18px", borderRadius: 20, fontSize: 13,
          border: "1px solid var(--border-strong)", whiteSpace: "nowrap",
        }}>
          {lang === "ar" ? "اضغط رجوع مرة أخرى للخروج" : "Press back again to exit"}
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
