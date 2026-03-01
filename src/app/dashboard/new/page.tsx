import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/Topbar";
import { NewGroupSection } from "../NewGroupSection";

export default async function NewGroupPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return (
    <main className="min-h-screen pb-24">
      <div className="mx-auto max-w-2xl">
        <Topbar showBack backHref="/dashboard" backReplace title="Nuovo gruppo" />
        <div className="px-6 pt-6">
          <p className="text-sm text-text-secondary">
            Crea un gruppo o entra con un codice invito
          </p>

          <NewGroupSection />
        </div>
      </div>
    </main>
  );
}
