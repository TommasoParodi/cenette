"use server";

import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const AVATAR_REFRESH_COOKIE = "avatar_refresh";

const AVATAR_BUCKET = "avatars";
const AVATAR_PATH_PREFIX = "users";

/** Path nello storage per l'avatar dell'utente (salvato in profiles.avatar_url). */
function getAvatarStoragePath(userId: string): string {
  return `${AVATAR_PATH_PREFIX}/${userId}/avatar.jpg`;
}

export async function updateProfileDisplayName(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Non autenticato." };
  }

  const displayName = (formData.get("display_name") as string | null)?.trim() ?? null;

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName || null })
    .eq("id", user.id);

  if (error) {
    console.error("updateProfileDisplayName error:", error);
    return { error: error.message || "Impossibile aggiornare il nome." };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Non autenticato." };
  }

  const file = formData.get("avatar") as File | null;
  if (!file?.size) {
    return { error: "Seleziona un'immagine." };
  }

  const maxSize = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSize) {
    return { error: "L'immagine deve essere al massimo 5 MB." };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Formato non supportato. Usa JPG, PNG, WebP o GIF." };
  }

  const storagePath = getAvatarStoragePath(user.id);
  const bytes = await file.arrayBuffer();

  // Se c'è già un avatar, rimuovilo prima: le policy RLS consentono DELETE+INSERT ma non UPDATE/upsert.
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();
  if (profile?.avatar_url) {
    await supabase.storage.from(AVATAR_BUCKET).remove([profile.avatar_url]);
  }

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(storagePath, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("uploadAvatar error:", uploadError);
    return { error: uploadError.message || "Impossibile caricare l'avatar." };
  }

  // Prova con avatar_updated_at (cache busting); se la colonna non esiste (migrazione non applicata), aggiorna solo avatar_url
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      avatar_url: storagePath,
      avatar_updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  const refreshTs = String(Date.now());

  if (updateError) {
    if (updateError.code === "PGRST204") {
      // Colonna avatar_updated_at non presente: aggiorna solo avatar_url
      const { error: fallbackError } = await supabase
        .from("profiles")
        .update({ avatar_url: storagePath })
        .eq("id", user.id);
      if (fallbackError) {
        console.error("uploadAvatar profile update error:", fallbackError);
        return { error: "Avatar caricato ma non aggiornato nel profilo." };
      }
      (await cookies()).set(AVATAR_REFRESH_COOKIE, refreshTs, {
        maxAge: 120,
        path: "/",
        httpOnly: true,
      });
      revalidatePath("/profile");
      revalidatePath("/dashboard");
      return { ok: true as const, avatarRefresh: refreshTs };
    } else {
      console.error("uploadAvatar profile update error:", updateError);
      return { error: "Avatar caricato ma non aggiornato nel profilo." };
    }
  }

  // Cookie per far aggiornare l'avatar anche in Dashboard/altre pagine (evita cache vecchia)
  (await cookies()).set(AVATAR_REFRESH_COOKIE, refreshTs, {
    maxAge: 120,
    path: "/",
    httpOnly: true,
  });
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { ok: true as const, avatarRefresh: refreshTs };
}

export async function removeAvatar() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Non autenticato." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  if (profile?.avatar_url) {
    await supabase.storage.from(AVATAR_BUCKET).remove([profile.avatar_url]);
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  if (error) {
    console.error("removeAvatar error:", error);
    return { error: error.message || "Impossibile rimuovere l'avatar." };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { ok: true as const };
}
