import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/Topbar";
import { CreateGroupForm } from "../CreateGroupForm";
import { JoinGroupForm } from "../JoinGroupForm";

export default async function NewGroupPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return (
    <main className="min-h-screen p-6 pb-24">
      <div className="mx-auto max-w-2xl">
        <Topbar showBack backHref="/dashboard" title="Nuovo gruppo" />
        <p className="mt-4 text-sm text-text-secondary">
          Crea un gruppo o entra con un codice invito
        </p>

        <div className="mt-6 flex flex-col gap-6">
          <div className="rounded-2xl bg-surface p-4 shadow-sm">
            <CreateGroupForm redirectToGroup />
          </div>
          <div className="rounded-2xl bg-surface p-4 shadow-sm">
            <JoinGroupForm redirectToGroup />
          </div>
        </div>
      </div>
    </main>
  );
}
