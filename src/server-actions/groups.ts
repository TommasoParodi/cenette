"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createGroup(formData: FormData) {
  const name = formData.get("name") as string | null;

  if (!name?.trim()) {
    return { error: "Inserisci un nome per il gruppo." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("rpc_create_group", {
    p_name: name.trim(),
  });

  if (error) {
    console.error("createGroup RPC error:", error);
    return { error: error.message || "Impossibile creare il gruppo." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/new");

  if (formData.get("redirect_to_dashboard") === "1") {
    redirect("/dashboard");
  }

  const groupId = (data as { id?: string })?.id ?? (data as { group_id?: string })?.group_id;
  return { data: groupId ? { groupId } : undefined, error: null };
}

export async function joinGroup(formData: FormData) {
  const inviteCode = formData.get("invite_code") as string | null;

  if (!inviteCode?.trim()) {
    return { error: "Inserisci il codice invito." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("rpc_join_group", {
    p_invite_code: inviteCode.trim(),
  });

  if (error) {
    console.error("joinGroup RPC error:", error);
    if (error.code === "PGRST116" || error.message?.includes("non trovato")) {
      return { error: "Codice invito non valido o gruppo non trovato." };
    }
    return { error: error.message || "Impossibile entrare nel gruppo." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/new");

  if (formData.get("redirect_to_dashboard") === "1") {
    redirect("/dashboard");
  }

  const groupId = (data as { id?: string })?.id ?? (data as { group_id?: string })?.group_id;
  return { data: groupId ? { groupId } : undefined, error: null };
}

async function ensureMember(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, groupId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();
  return membership ? user.id : null;
}

export async function updateGroup(groupId: string, formData: FormData) {
  const name = formData.get("name") as string | null;
  if (!name?.trim()) {
    return { error: "Inserisci un nome per il gruppo." };
  }

  const supabase = await createSupabaseServerClient();
  const userId = await ensureMember(supabase, groupId);
  if (!userId) {
    return { error: "Non sei membro di questo gruppo." };
  }

  const { error } = await supabase
    .from("groups")
    .update({ name: name.trim() })
    .eq("id", groupId);

  if (error) {
    console.error("updateGroup error:", error);
    return { error: error.message || "Impossibile aggiornare il gruppo." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/group/" + groupId);
  revalidatePath("/group/" + groupId, "layout");
  return { data: { groupId }, error: null };
}

export async function deleteGroup(formData: FormData) {
  const groupId = (formData.get("group_id") as string | null)?.trim();
  if (!groupId) {
    return { error: "Gruppo non valido." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Non autenticato." };
  }

  const { data: group } = await supabase
    .from("groups")
    .select("created_by")
    .eq("id", groupId)
    .single();

  if (!group) {
    return { error: "Gruppo non trovato." };
  }

  const createdBy = (group as { created_by?: string | null }).created_by;
  if (createdBy !== user.id) {
    return { error: "Solo il creatore del gruppo può eliminarlo." };
  }

  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return { error: "Non sei membro di questo gruppo." };
  }

  // Prima di eliminare il gruppo, rimuovi da Storage le foto (review-photos e entry-photos).
  // Il CASCADE elimina solo le righe DB, non i file nei bucket.
  const { data: groupEntries } = await supabase
    .from("entries")
    .select("id")
    .eq("group_id", groupId);
  const entryIds = (groupEntries ?? []).map((e) => e.id);

  if (entryIds.length > 0) {
    // Foto delle recensioni (bucket review-photos)
    const { data: reviewsWithPhoto } = await supabase
      .from("reviews")
      .select("id, photo_path")
      .in("entry_id", entryIds)
      .not("photo_path", "is", null);
    const reviewPhotoPaths = (reviewsWithPhoto ?? []).map((r) => (r as { photo_path: string }).photo_path).filter(Boolean);
    if (reviewPhotoPaths.length > 0) {
      await supabase.storage.from("review-photos").remove(reviewPhotoPaths);
    }

    // Foto degli eventi (bucket entry-photos)
    const { data: entryPhotos } = await supabase
      .from("entry_photos")
      .select("storage_path")
      .in("entry_id", entryIds);
    const entryPhotoPaths = (entryPhotos ?? []).map((p) => (p as { storage_path: string }).storage_path).filter(Boolean);
    if (entryPhotoPaths.length > 0) {
      await supabase.storage.from("entry-photos").remove(entryPhotoPaths);
    }
  }

  const { error } = await supabase.from("groups").delete().eq("id", groupId);

  if (error) {
    console.error("deleteGroup error:", error);
    return { error: error.message || "Impossibile eliminare il gruppo." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard", "layout");
  return { data: true, error: null };
}

export async function leaveGroup(formData: FormData) {
  const groupId = (formData.get("group_id") as string | null)?.trim();
  if (!groupId) {
    return { error: "Gruppo non valido." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Non autenticato." };
  }

  const { data: group } = await supabase
    .from("groups")
    .select("created_by")
    .eq("id", groupId)
    .single();

  if (!group) {
    return { error: "Gruppo non trovato." };
  }

  const createdBy = (group as { created_by?: string | null }).created_by;
  if (createdBy === user.id) {
    return { error: "Il creatore non può uscire dal gruppo. Elimina il gruppo se non ti serve più." };
  }

  const { data: groupEntries } = await supabase
    .from("entries")
    .select("id")
    .eq("group_id", groupId);
  const entryIds = (groupEntries ?? []).map((e) => e.id);

  // Eventi che stiamo per trasferire (creati dall'utente che esce)
  const { data: transferredEntries } = await supabase
    .from("entries")
    .select("id")
    .eq("group_id", groupId)
    .eq("created_by", user.id);
  const transferredEntryIds = (transferredEntries ?? []).map((e) => e.id);

  // 1. Trasferisci gli eventi creati dall'utente all'owner del gruppo
  const { error: transferError } = await supabase
    .from("entries")
    .update({ created_by: createdBy })
    .eq("group_id", groupId)
    .eq("created_by", user.id);
  if (transferError) {
    console.error("leaveGroup: errore trasferimento eventi", transferError);
    return { error: transferError.message || "Impossibile trasferire gli eventi." };
  }

  // Se l'owner non era tra i partecipanti, aggiungilo agli eventi trasferiti così l'evento ha un creatore in lista
  if (transferredEntryIds.length > 0 && createdBy) {
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", createdBy)
      .single();
    const ownerDisplayName = (ownerProfile as { display_name?: string | null } | null)?.display_name ?? "Utente";
    const { data: existingParticipation } = await supabase
      .from("entry_participants")
      .select("entry_id")
      .eq("user_id", createdBy)
      .in("entry_id", transferredEntryIds);
    const ownerAlreadyIn = new Set((existingParticipation ?? []).map((p) => p.entry_id));
    const toAdd = transferredEntryIds.filter((id) => !ownerAlreadyIn.has(id));
    if (toAdd.length > 0) {
      const { error: addOwnerError } = await supabase
        .from("entry_participants")
        .insert(
          toAdd.map((entry_id) => ({
            entry_id,
            user_id: createdBy,
            cached_display_name: ownerDisplayName,
          }))
        );
      if (addOwnerError) {
        console.error("leaveGroup: errore aggiunta owner come partecipante", addOwnerError);
      }
    }
  }

  // 2. Elimina le recensioni dell'utente (e le foto da Storage) prima di uscire
  if (entryIds.length > 0) {
    const { data: reviewsWithPhoto } = await supabase
      .from("reviews")
      .select("id, photo_path")
      .eq("user_id", user.id)
      .in("entry_id", entryIds)
      .not("photo_path", "is", null);
    const reviewPhotoPaths = (reviewsWithPhoto ?? []).map((r) => (r as { photo_path: string }).photo_path).filter(Boolean);
    if (reviewPhotoPaths.length > 0) {
      await supabase.storage.from("review-photos").remove(reviewPhotoPaths);
    }
    const { error: reviewsError } = await supabase
      .from("reviews")
      .delete()
      .eq("user_id", user.id)
      .in("entry_id", entryIds);
    if (reviewsError) {
      console.error("leaveGroup: errore cancellazione recensioni", reviewsError);
    }

    // Rimuovi l'utente dalla lista partecipanti di tutti gli eventi del gruppo
    const { error: participantsError } = await supabase
      .from("entry_participants")
      .delete()
      .eq("user_id", user.id)
      .in("entry_id", entryIds);
    if (participantsError) {
      console.error("leaveGroup: errore rimozione partecipanti", participantsError);
      return { error: "Impossibile rimuovere i partecipanti dagli eventi. Verifica le policy RLS su entry_participants (consenti DELETE dove user_id = auth.uid())." };
    }
  }

  // 3. Rimuovi da group_members
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  if (error) {
    console.error("leaveGroup error:", error);
    return { error: error.message || "Impossibile uscire dal gruppo." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/group/${groupId}`);
  revalidatePath(`/group/${groupId}`, "layout");
  return { data: true, error: null };
}
