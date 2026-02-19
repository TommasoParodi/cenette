import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CreateEntryForm } from "./CreateEntryForm";

export default async function NewEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: groupId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/");
  }

  const { data: group } = await supabase
    .from("groups")
    .select("id, name")
    .eq("id", groupId)
    .single();

  if (!group) {
    notFound();
  }

  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <Link
            href={`/group/${groupId}`}
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          >
            ← {group.name}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Aggiungi evento
          </h1>
        </header>

        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <CreateEntryForm groupId={groupId} />
        </section>
      </div>
    </main>
  );
}
