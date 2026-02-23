/**
 * Utility per gestire gli URL degli avatar con cache efficace.
 * Usa sempre URL pubblici (object/public) per permettere la cache del browser.
 */

import { createSupabaseServerClient } from "./supabase/server";

const AVATAR_BUCKET = "avatars";

/**
 * Genera un URL pubblico per l'avatar con cache busting.
 * Formato: .../storage/v1/object/public/avatars/users/xxx/avatar.jpg?t=timestamp
 *
 * @param avatarPath - Il path dell'avatar nello storage (es. "users/xxx/avatar.jpg")
 * @param updatedAt - Timestamp dell'ultimo aggiornamento dell'avatar
 * @returns URL pubblico con cache busting, o null se il path non è valido
 */
export function getAvatarPublicUrl(
  avatarPath: string | null,
  updatedAt: string | Date | null
): string | null {
  if (!avatarPath) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  // Sempre URL pubblico (non /sign/) così il browser può cachare
  const baseUrl = `${supabaseUrl}/storage/v1/object/public/${AVATAR_BUCKET}/${avatarPath}`;

  if (updatedAt) {
    const timestamp =
      typeof updatedAt === "string"
        ? Number(updatedAt) || new Date(updatedAt).getTime()
        : updatedAt.getTime();
    if (!Number.isNaN(timestamp)) return `${baseUrl}?t=${timestamp}`;
  }

  return baseUrl;
}

/**
 * Recupera l'URL pubblico dell'avatar per un utente.
 * 
 * @param userId - ID dell'utente
 * @returns URL pubblico dell'avatar o null se non presente
 */
export async function getUserAvatarUrl(userId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url, avatar_updated_at")
    .eq("id", userId)
    .single();

  if (!profile?.avatar_url) return null;

  return getAvatarPublicUrl(profile.avatar_url, profile.avatar_updated_at);
}
