"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type EntryType = "HOME" | "OUT";
export type VoteMode = "SIMPLE" | "DETAILED";

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
  const voteMode = formData.get("vote_mode") as VoteMode | null;
  const happenedAtRaw = formData.get("happened_at") as string | null;
  const description = (formData.get("description") as string | null)?.trim() || null;

  if (!title?.trim()) {
    return { error: "Inserisci un titolo per l'evento." };
  }
  if (!type || (type !== "HOME" && type !== "OUT")) {
    return { error: "Seleziona il tipo di evento (Casa o Fuori)." };
  }
  if (!voteMode || (voteMode !== "SIMPLE" && voteMode !== "DETAILED")) {
    return { error: "Seleziona la modalità di voto (Semplice o Dettagliata)." };
  }
  if (!happenedAtRaw?.trim()) {
    return { error: "Inserisci la data dell'evento." };
  }

  const happenedAt = new Date(happenedAtRaw);
  if (Number.isNaN(happenedAt.getTime())) {
    return { error: "Data non valida." };
  }

  const participantIdsRaw = formData.getAll("participants");
  const participantIds = Array.isArray(participantIdsRaw)
    ? (participantIdsRaw as string[]).filter((id) => typeof id === "string" && id.length > 0)
    : [];

  const { data: newEntry, error } = await supabase
    .from("entries")
    .insert({
      group_id: groupId,
      title: title.trim(),
      type,
      vote_mode: voteMode,
      happened_at: happenedAt.toISOString(),
      description,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    console.error("createEntry error:", error);
    return { error: error.message || "Impossibile creare l'evento." };
  }
  if (!newEntry?.id) {
    return { error: "Impossibile creare l'evento." };
  }

  const finalParticipantIds = [...new Set([user.id, ...participantIds])];
  const { error: participantsError } = await supabase
    .from("entry_participants")
    .insert(
      finalParticipantIds.map((uid) => ({
        entry_id: newEntry.id,
        user_id: uid,
      }))
    );

  if (participantsError) {
    console.error("createEntry participants error:", participantsError);
    return { error: participantsError.message || "Impossibile salvare i partecipanti." };
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
  const voteMode = formData.get("vote_mode") as VoteMode | null;
  const happenedAtRaw = formData.get("happened_at") as string | null;
  const description = (formData.get("description") as string | null)?.trim() || null;

  if (!title?.trim()) {
    return { error: "Inserisci un titolo per l'evento." };
  }
  if (!type || (type !== "HOME" && type !== "OUT")) {
    return { error: "Seleziona il tipo di evento (Casa o Fuori)." };
  }
  if (!voteMode || (voteMode !== "SIMPLE" && voteMode !== "DETAILED")) {
    return { error: "Seleziona la modalità di voto (Semplice o Dettagliata)." };
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
      vote_mode: voteMode,
      happened_at: happenedAt.toISOString(),
      description,
    })
    .eq("id", entryId);

  if (error) {
    console.error("updateEntry error:", error);
    return { error: error.message || "Impossibile aggiornare l'evento." };
  }

  const participantIdsRaw = formData.getAll("participants");
  const participantIds = Array.isArray(participantIdsRaw)
    ? (participantIdsRaw as string[]).filter((id) => typeof id === "string" && id.length > 0)
    : [];
  const finalParticipantIds = [...new Set([entry.created_by, ...participantIds])];

  await supabase.from("entry_participants").delete().eq("entry_id", entryId);
  if (finalParticipantIds.length > 0) {
    const { error: participantsError } = await supabase
      .from("entry_participants")
      .insert(
        finalParticipantIds.map((uid) => ({
          entry_id: entryId,
          user_id: uid,
        }))
      );
    if (participantsError) {
      console.error("updateEntry participants error:", participantsError);
      return { error: participantsError.message || "Impossibile aggiornare i partecipanti." };
    }
  }

  // Le recensioni di chi non è più partecipante vengono cancellate dal trigger
  // delete_review_when_participant_removed su entry_participants (DELETE)

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
    .select("group_id, vote_mode")
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

  const { data: participants } = await supabase
    .from("entry_participants")
    .select("user_id")
    .eq("entry_id", entryId);
  const participantIds = (participants ?? []).map((p) => p.user_id);
  const canReview =
    participantIds.length === 0 || participantIds.includes(user.id);
  if (!canReview) {
    return { error: "Solo i partecipanti all'evento possono scrivere una recensione." };
  }

  const ratingRaw = formData.get("rating_overall") as string | null;
  const comment = (formData.get("comment") as string | null)?.trim() || null;

  const rating = ratingRaw != null ? parseInt(ratingRaw, 10) : NaN;
  if (Number.isNaN(rating) || rating < 1 || rating > 10) {
    return { error: "Inserisci un voto complessivo tra 1 e 10." };
  }

  const isDetailed = (entry.vote_mode ?? "SIMPLE") === "DETAILED";
  const payload: {
    entry_id: string;
    user_id: string;
    rating_overall: number;
    comment: string | null;
    rating_cost?: number | null;
    rating_service?: number | null;
    rating_food?: number | null;
    rating_location?: number | null;
  } = {
    entry_id: entryId,
    user_id: user.id,
    rating_overall: rating,
    comment,
  };

  if (isDetailed) {
    const parseRating = (raw: string | null) => {
      const n = raw != null ? parseInt(raw, 10) : NaN;
      return Number.isNaN(n) || n < 1 || n > 10 ? null : n;
    };
    const ratingCost = parseRating(formData.get("rating_cost") as string | null);
    const ratingService = parseRating(formData.get("rating_service") as string | null);
    const ratingFood = parseRating(formData.get("rating_food") as string | null);
    const ratingLocation = parseRating(formData.get("rating_location") as string | null);
    if (
      ratingCost == null ||
      ratingService == null ||
      ratingFood == null ||
      ratingLocation == null
    ) {
      return { error: "Inserisci tutti i voti dettagliati (1–10) per costo, servizio, cibo e location." };
    }
    payload.rating_cost = ratingCost;
    payload.rating_service = ratingService;
    payload.rating_food = ratingFood;
    payload.rating_location = ratingLocation;
  } else {
    payload.rating_cost = null;
    payload.rating_service = null;
    payload.rating_food = null;
    payload.rating_location = null;
  }

  const { error } = await supabase.from("reviews").upsert(
    payload,
    { onConflict: "user_id,entry_id" }
  );

  if (error) {
    console.error("createOrUpdateReview error:", error);
    return { error: error.message || "Impossibile salvare la recensione." };
  }

  revalidatePath(`/entry/${entryId}`);
  redirect(`/entry/${entryId}`);
}
