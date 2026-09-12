import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

// Singleton — module is evaluated once; import from anywhere without re-creating the client.
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export const EDGE_BASE = `https://${projectId}.supabase.co/functions/v1/server/make-server-493add5a`;
