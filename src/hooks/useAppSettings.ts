import { useEffect, useState } from "react";
import { getAppSettings, updateAppSettings, type AppSettings, type StoreLink } from "../lib/api";

const CACHE_KEY = "marhaba-app-settings";

const defaultSettings: AppSettings = {
  whatsapp_number: "966500816798",
  whatsapp_accessory_number: "966500816798",
  support_email: "support@marhaba.com",
  store_links: [],
};

function loadCache(): AppSettings {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return defaultSettings;
    const parsed = JSON.parse(cached);
    // Merge to ensure new fields are present even in old cache entries
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadCache);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAppSettings()
      .then((data) => {
        if (cancelled) return;
        const merged = { ...defaultSettings, ...data };
        setSettings(merged);
        localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
      })
      .catch(() => setError("Failed to load settings"))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const save = async (updates: Partial<AppSettings>) => {
    setSaving(true);
    setError(null);
    try {
      await updateAppSettings(updates);
      const updated = { ...settings, ...updates };
      setSettings(updated);
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
    } catch (e: any) {
      setError(e?.message || "Failed to save settings");
      throw e;
    } finally {
      setSaving(false);
    }
  };

  const whatsappLink = `https://wa.me/${settings.whatsapp_number}`;
  const whatsappAccessoryLink = `https://wa.me/${settings.whatsapp_accessory_number}?text=${encodeURIComponent("أرغب في طلب اكسسوار لمنصة Marhaba NFC")}`;

  return { settings, loading, saving, error, save, whatsappLink, whatsappAccessoryLink };
}

export type { AppSettings, StoreLink };
