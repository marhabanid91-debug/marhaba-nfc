import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, Screen, Identity, User, ActiveMode } from "../types";
import { translations, TKey } from "../i18n";
import { supabase } from "../lib/supabase";
import {
  loadUserIdentities, createIdentity, updateIdentityMode as dbUpdateMode,
  updateIdentityActive, deleteIdentityFromDB, loadProfile, upsertProfile,
  linkSerialToIdentity, SerialRecord,
} from "../lib/db";

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
  offlineSettings: { name: true, contactPhone: false, emergencyPhone: true },
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
  supabaseUser: any;
  isAdmin: boolean;
  pendingSerial: SerialRecord | null;
  setPendingSerial: (c: SerialRecord | null) => void;
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
  const [pendingSerial, setPendingSerial] = useState<SerialRecord | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [activeIdentityId, setActiveIdentityId] = useState<string | null>(null);
  const [readerPreviewMode, setReaderPreviewMode] = useState<ActiveMode>("business");
  const [dbLoading, setDbLoading] = useState(false);
  const [disclaimerAcknowledged, setDisclaimerAcknowledgedState] = useState<boolean>(() =>
    localStorage.getItem("marhaba-disclaimer") === "true"
  );
  const [darkMode, setDarkModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem("marhaba-theme");
    return saved ? saved === "dark" : true;
  });

  const setScreen = (s: Screen) => {
    setPrevScreen(screen);
    setScreenState(s);
  };

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

  // ─── Bootstrap on mount ────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "ar";
    const saved = localStorage.getItem("marhaba-theme");
    document.documentElement.setAttribute("data-theme", saved === "light" ? "light" : "dark");

    // Restore session that may already exist (e.g. after page refresh).
    // getSession() is synchronous from cache — it does NOT cause a network round-trip.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setScreenState("auth");
    });

    // Listen for all auth lifecycle events.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignore password-recovery redirect — user should re-authenticate normally.
      if (event === "PASSWORD_RECOVERY") return;

      if (session?.user) {
        const su = session.user;
        setSupabaseUser(su);

        // Only reload identities on first sign-in or hard refresh (INITIAL_SESSION).
        // TOKEN_REFRESHED / USER_UPDATED keep the existing loaded state to avoid flicker.
        const shouldReload = event === "SIGNED_IN" || event === "INITIAL_SESSION";

        // Ensure profile row exists (critical for Google OAuth first sign-in)
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

            // Auto-link a pending serial that was scanned before sign-in
            setPendingSerial((pending) => {
              if (pending && loaded.length) {
                linkSerialToIdentity(pending.serial_number, loaded[0].id, su.id).catch(() => {});
              }
              return null;
            });
          } catch {
            // silently continue
          } finally {
            setDbLoading(false);
          }
          setScreenState("home");
        }
      } else {
        // No session — signed out or expired.
        setSupabaseUser(null);
        setUser(null);
        setIsAdmin(false);
        setIdentities([]);
        setActiveIdentityId(null);
        setScreenState("auth");
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
      // Offline fallback
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
        updateIdentityMode, addIdentity, deleteIdentity, toggleIdentityActive,
        readerPreviewMode, setReaderPreviewMode,
        darkMode, setDarkMode,
        disclaimerAcknowledged, setDisclaimerAcknowledged,
        dbLoading, supabaseUser, isAdmin, pendingSerial, setPendingSerial,
        authMode, setAuthMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

