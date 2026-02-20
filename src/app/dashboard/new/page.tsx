import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
        <header className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm text-text-secondary hover:text-foreground"
          >
            ← Lista gruppi
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-foreground">
            Nuovo gruppo
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Crea un gruppo o entra con un codice invito
          </p>
        </header>

        <div className="flex flex-col gap-6">
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
