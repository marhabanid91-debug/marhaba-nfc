import { supabase } from "./supabase";

export type VaultScope = "emergency" | "business";

export interface VaultEditItem {
  id?: string;
  title: string;
  url: string;
  code: string; // فارغ لعنصر قديم = يبقى رمزه الحالي
}

export interface MyVault {
  items: { id: string; title: string; url: string }[];
  opens: number;
  last_open: string | null;
  fails_total: number;
}

export type UnlockResult =
  | { status: "ok"; items: { title: string; url: string }[] }
  | { status: "wrong"; left: number }
  | { status: "locked"; retry: number }
  | { status: "none" }
  | { status: "error" };

/** هل توجد خزنة لهذه الهوية؟ (لا تكشف أي عنوان) */
export async function vaultExists(identityId: string, scope: VaultScope): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("vault_exists", { p_identity: identityId, p_scope: scope });
    return !error && data === true;
  } catch {
    return false;
  }
}

/** فتح الخزنة بالرمز؛ التحقق في الخادم والروابط لا تصل إلا عند النجاح */
export async function unlockVault(identityId: string, scope: VaultScope, code: string): Promise<UnlockResult> {
  try {
    const { data, error } = await supabase.rpc("unlock_vault", {
      p_identity: identityId, p_scope: scope, p_code: code,
    });
    if (error || !data) return { status: "error" };
    const d = data as any;
    if (d.status === "ok") return { status: "ok", items: Array.isArray(d.items) ? d.items : [] };
    if (d.status === "wrong") return { status: "wrong", left: Number(d.left ?? 0) };
    if (d.status === "locked") return { status: "locked", retry: Number(d.retry ?? 900) };
    if (d.status === "none") return { status: "none" };
    return { status: "error" };
  } catch {
    return { status: "error" };
  }
}

/** خزنة المالك (العناوين والروابط وعدّاد الفتح، دون الرموز) أو null */
export async function loadMyVault(identityId: string, scope: VaultScope): Promise<MyVault | null> {
  try {
    const { data, error } = await supabase.rpc("my_vault", { p_identity: identityId, p_scope: scope });
    return error || !data ? null : (data as MyVault);
  } catch {
    return null;
  }
}

/** حفظ الخزنة؛ يعيد "ok" أو رمز الخطأ */
export async function saveMyVault(identityId: string, scope: VaultScope, items: VaultEditItem[]): Promise<string> {
  try {
    const payload = items.map((it) => ({
      ...(it.id ? { id: it.id } : {}),
      title: it.title.trim(),
      url: it.url.trim(),
      ...(it.code ? { code: it.code } : {}),
    }));
    const { data, error } = await supabase.rpc("set_vault", {
      p_identity: identityId, p_scope: scope, p_items: payload,
    });
    return error || typeof data !== "string" ? "error" : data;
  } catch {
    return "error";
  }
}
