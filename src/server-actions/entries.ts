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
