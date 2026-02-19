"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type EntryType = "HOME" | "OUT";

export async function createEntry(groupId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Devi essere autenticato per creare un evento." };
  }

  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return { error: "Non fai parte di questo gruppo." };
  }

  const title = formData.get("title") as string | null;
  const type = formData.get("type") as EntryType | null;
  const happenedAtRaw = formData.get("happened_at") as string | null;
  const description = (formData.get("description") as string | null)?.trim() || null;

  if (!title?.trim()) {
    return { error: "Inserisci un titolo per l'evento." };
  }
  if (!type || (type !== "HOME" && type !== "OUT")) {
    return { error: "Seleziona il tipo di evento (Casa o Fuori)." };
  }
  if (!happenedAtRaw?.trim()) {
    return { error: "Inserisci la data dell'evento." };
  }

  const happenedAt = new Date(happenedAtRaw);
  if (Number.isNaN(happenedAt.getTime())) {
    return { error: "Data non valida." };
  }

  const { error } = await supabase.from("entries").insert({
    group_id: groupId,
    title: title.trim(),
    type,
    happened_at: happenedAt.toISOString(),
    description,
    created_by: user.id,
  });

  if (error) {
    console.error("createEntry error:", error);
    return { error: error.message || "Impossibile creare l'evento." };
  }

  revalidatePath(`/group/${groupId}`);
  redirect(`/group/${groupId}`);
}

export async function updateEntry(entryId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Devi essere autenticato per modificare un evento." };
  }

  const { data: entry } = await supabase
    .from("entries")
    .select("id, group_id, created_by")
    .eq("id", entryId)
    .single();

  if (!entry) {
    return { error: "Evento non trovato." };
  }
  if (entry.created_by !== user.id) {
    return { error: "Solo il creatore dell'evento può modificarlo." };
  }

  const title = formData.get("title") as string | null;
  const type = formData.get("type") as EntryType | null;
  const happenedAtRaw = formData.get("happened_at") as string | null;
  const description = (formData.get("description") as string | null)?.trim() || null;

  if (!title?.trim()) {
    return { error: "Inserisci un titolo per l'evento." };
  }
  if (!type || (type !== "HOME" && type !== "OUT")) {
    return { error: "Seleziona il tipo di evento (Casa o Fuori)." };
  }
  if (!happenedAtRaw?.trim()) {
    return { error: "Inserisci la data dell'evento." };
  }

  const happenedAt = new Date(happenedAtRaw);
  if (Number.isNaN(happenedAt.getTime())) {
    return { error: "Data non valida." };
  }

  const { error } = await supabase
    .from("entries")
    .update({
      title: title.trim(),
      type,
      happened_at: happenedAt.toISOString(),
      description,
    })
    .eq("id", entryId);

  if (error) {
    console.error("updateEntry error:", error);
    return { error: error.message || "Impossibile aggiornare l'evento." };
  }

  revalidatePath(`/entry/${entryId}`);
  revalidatePath(`/group/${entry.group_id}`);
  redirect(`/entry/${entryId}`);
}

export async function createOrUpdateReview(entryId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Devi essere autenticato per lasciare una recensione." };
  }

  const { data: entry } = await supabase
    .from("entries")
    .select("group_id")
    .eq("id", entryId)
    .single();

  if (!entry) {
    return { error: "Evento non trovato." };
  }

  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", entry.group_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return { error: "Non fai parte di questo gruppo." };
  }

  const ratingRaw = formData.get("rating_overall") as string | null;
  const comment = (formData.get("comment") as string | null)?.trim() || null;

  const rating = ratingRaw != null ? parseInt(ratingRaw, 10) : NaN;
  if (Number.isNaN(rating) || rating < 1 || rating > 10) {
    return { error: "Inserisci un voto tra 1 e 10." };
  }

  const { error } = await supabase.from("reviews").upsert(
    {
      entry_id: entryId,
      user_id: user.id,
      rating_overall: rating,
      comment,
    },
    { onConflict: "user_id,entry_id" }
  );

  if (error) {
    console.error("createOrUpdateReview error:", error);
    return { error: error.message || "Impossibile salvare la recensione." };
  }

  revalidatePath(`/entry/${entryId}`);
  redirect(`/entry/${entryId}`);
}
