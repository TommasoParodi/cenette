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

  // Foto evento (max 3): bucket entry-photos, path entries/<entry_id>/<file>
  const acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
  const photoFiles = (formData.getAll("photos") as File[]).filter(
    (f): f is File => f instanceof File && f.size > 0
  ).slice(0, 3);

  for (const file of photoFiles) {
    if (!acceptedTypes.includes(file.type)) {
      return { error: "Formato foto non consentito. Usa JPEG, PNG, WebP o GIF." };
    }
    if (file.size > maxSizeBytes) {
      return { error: "Ogni foto deve essere al massimo 5 MB." };
    }
  }

  const bucket = "entry-photos";
  const prefix = `entries/${newEntry.id}`;

  for (let i = 0; i < photoFiles.length; i++) {
    const file = photoFiles[i];
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["jpeg", "jpg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
    const storagePath = `${prefix}/${crypto.randomUUID()}.${safeExt}`;

    const bytes = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, bytes, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("createEntry photo upload error:", uploadError);
      return { error: "Impossibile caricare una foto. Verifica che il bucket entry-photos esista." };
    }

    const { error: insertError } = await supabase.from("entry_photos").insert({
      entry_id: newEntry.id,
      storage_path: storagePath,
    });

    if (insertError) {
      console.error("createEntry entry_photos insert error:", insertError);
      return { error: insertError.message || "Impossibile salvare il riferimento alla foto." };
    }
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

  // Nuove foto (rispettando max 3 totali)
  const { count } = await supabase
    .from("entry_photos")
    .select("id", { count: "exact", head: true })
    .eq("entry_id", entryId);
  const currentPhotoCount = count ?? 0;
  const acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const maxSizeBytes = 5 * 1024 * 1024;
  const photoFiles = (formData.getAll("photos") as File[]).filter(
    (f): f is File => f instanceof File && f.size > 0
  ).slice(0, Math.max(0, 3 - currentPhotoCount));

  for (const file of photoFiles) {
    if (!acceptedTypes.includes(file.type)) {
      return { error: "Formato foto non consentito. Usa JPEG, PNG, WebP o GIF." };
    }
    if (file.size > maxSizeBytes) {
      return { error: "Ogni foto deve essere al massimo 5 MB." };
    }
  }

  const bucket = "entry-photos";
  const prefix = `entries/${entryId}`;
  for (const file of photoFiles) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["jpeg", "jpg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
    const storagePath = `${prefix}/${crypto.randomUUID()}.${safeExt}`;
    const bytes = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, bytes, { contentType: file.type, upsert: false });
    if (uploadError) {
      console.error("updateEntry photo upload error:", uploadError);
      return { error: "Impossibile caricare una foto." };
    }
    const { error: insertError } = await supabase.from("entry_photos").insert({
      entry_id: entryId,
      storage_path: storagePath,
    });
    if (insertError) {
      console.error("updateEntry entry_photos insert error:", insertError);
      return { error: insertError.message || "Impossibile salvare il riferimento alla foto." };
    }
  }

  revalidatePath(`/entry/${entryId}`);
  revalidatePath(`/group/${entry.group_id}`);
  redirect(`/entry/${entryId}`);
}

export async function deleteEntryPhoto(formData: FormData) {
  const photoId = formData.get("photoId") as string | null;
  if (!photoId?.trim()) {
    return { error: "Foto non specificata." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Non autenticato." };
  }

  const { data: photo } = await supabase
    .from("entry_photos")
    .select("id, entry_id, storage_path, entries(created_by, group_id)")
    .eq("id", photoId)
    .single();

  if (!photo) {
    return { error: "Foto non trovata." };
  }
  const rawEntry = photo.entries as { created_by: string; group_id: string } | { created_by: string; group_id: string }[] | null;
  const entry = Array.isArray(rawEntry) ? rawEntry[0] : rawEntry;
  if (!entry || entry.created_by !== user.id) {
    return { error: "Solo il creatore dell'evento può rimuovere le foto." };
  }

  await supabase.storage.from("entry-photos").remove([photo.storage_path]);
  const { error } = await supabase.from("entry_photos").delete().eq("id", photoId);
  if (error) {
    console.error("deleteEntryPhoto error:", error);
    return { error: error.message || "Impossibile rimuovere la foto." };
  }

  revalidatePath(`/entry/${photo.entry_id}`);
  revalidatePath(`/group/${entry.group_id}`);
  redirect(`/entry/${photo.entry_id}/edit`);
}

/** Carica subito le foto selezionate (senza salvare il resto del form). Redirect alla stessa pagina modifica. */
export async function uploadEntryPhotos(entryId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Devi essere autenticato." };
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
    return { error: "Solo il creatore dell'evento può aggiungere foto." };
  }

  const { count } = await supabase
    .from("entry_photos")
    .select("id", { count: "exact", head: true })
    .eq("entry_id", entryId);
  const currentPhotoCount = count ?? 0;
  const acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const maxSizeBytes = 5 * 1024 * 1024;
  const photoFiles = (formData.getAll("photos") as File[]).filter(
    (f): f is File => f instanceof File && f.size > 0
  ).slice(0, Math.max(0, 3 - currentPhotoCount));

  if (photoFiles.length === 0) {
    return { error: "Seleziona almeno una foto da caricare." };
  }

  for (const file of photoFiles) {
    if (!acceptedTypes.includes(file.type)) {
      return { error: "Formato foto non consentito. Usa JPEG, PNG, WebP o GIF." };
    }
    if (file.size > maxSizeBytes) {
      return { error: "Ogni foto deve essere al massimo 5 MB." };
    }
  }

  const bucket = "entry-photos";
  const prefix = `entries/${entryId}`;
  for (const file of photoFiles) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["jpeg", "jpg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
    const storagePath = `${prefix}/${crypto.randomUUID()}.${safeExt}`;
    const bytes = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, bytes, { contentType: file.type, upsert: false });
    if (uploadError) {
      console.error("uploadEntryPhotos error:", uploadError);
      return { error: "Impossibile caricare una foto." };
    }
    const { error: insertError } = await supabase.from("entry_photos").insert({
      entry_id: entryId,
      storage_path: storagePath,
    });
    if (insertError) {
      console.error("uploadEntryPhotos insert error:", insertError);
      return { error: insertError.message || "Impossibile salvare il riferimento alla foto." };
    }
  }

  revalidatePath(`/entry/${entryId}`);
  revalidatePath(`/group/${entry.group_id}`);
  return { success: true };
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
