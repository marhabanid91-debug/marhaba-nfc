import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";
import type { LocationItem } from "../types";

export interface OrgBrand {
  website?: string;
  links?: Record<string, string>;
  locations?: LocationItem[];
  delivery?: { enabled: boolean; wa: string };
}

export interface Org { id: string; name: string; active: boolean; brand: OrgBrand }

// خاصية الشركات مغلقة: لا تظهر إلا لحساب فُعِّلت له شركة من لوحة Supabase
export function useCompany() {
  const { supabaseUser } = useApp();
  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    if (!supabaseUser) { setOrg(null); setLoading(false); return; }
    (async () => {
      const q = (cols: string) =>
        supabase.from("organizations").select(cols).eq("owner_user_id", supabaseUser.id).eq("active", true).maybeSingle();
      let { data, error } = await q("id, name, active, brand");
      // قبل تشغيل company-cd.sql لا يوجد عمود brand: نقرأ بدونه حتى لا تُقفل الخاصية
      if (error) ({ data, error } = await q("id, name, active"));
      if (!alive) return;
      const row = data as any;
      setOrg(row ? { id: row.id, name: row.name, active: row.active, brand: row.brand || {} } : null);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [supabaseUser?.id]);

  return { org, setOrg, loading };
}
