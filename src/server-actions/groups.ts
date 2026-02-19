"use server";

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
  return { data: data ?? undefined, error: null };
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
  return { data: data ?? undefined, error: null };
}
