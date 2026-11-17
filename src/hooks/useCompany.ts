import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";

export interface Org { id: string; name: string; active: boolean }

// خاصية الشركات مغلقة: لا تظهر إلا لحساب فُعِّلت له شركة من لوحة Supabase
export function useCompany() {
  const { supabaseUser } = useApp();
  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    if (!supabaseUser) { setOrg(null); setLoading(false); return; }
    supabase
      .from("organizations")
      .select("id, name, active")
      .eq("owner_user_id", supabaseUser.id)
      .eq("active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive) return;
        setOrg((data as Org) || null);
        setLoading(false);
      });
    return () => { alive = false; };
  }, [supabaseUser?.id]);

  return { org, loading };
}
