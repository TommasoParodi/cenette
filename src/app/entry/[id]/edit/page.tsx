import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EditEntryForm } from "./EditEntryForm";

export default async function EntryEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: entryId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/");
  }

  const { data: entry } = await supabase
    .from("entries")
    .select("id, group_id, title, type, description, happened_at, vote_mode, created_by, groups(id, name)")
    .eq("id", entryId)
    .single();

  if (!entry) {
    notFound();
  }
  if (entry.created_by !== user.id) {
    notFound();
  }

  const group = entry.groups as { id: string; name: string } | null;
  if (!group) {
    notFound();
  }

  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", entry.group_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    notFound();
  }

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, profiles(id, display_name)")
    .eq("group_id", entry.group_id);

  const membersWithProfile = (members ?? []).map((m) => {
    const raw = m.profiles as unknown;
    const profile = Array.isArray(raw) ? raw[0] : raw;
    const p = profile as { id: string; display_name: string | null } | null | undefined;
    return {
      id: m.user_id,
      displayName: p?.display_name ?? "Utente",
    };
  });

  const { data: participants } = await supabase
    .from("entry_participants")
    .select("user_id")
    .eq("entry_id", entryId);

  const participantIds = (participants ?? []).map((p) => p.user_id);

  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <Link
            href={`/entry/${entryId}`}
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          >
            ← {entry.title}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Modifica evento
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {group.name}
          </p>
        </header>

        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <EditEntryForm
            entryId={entryId}
            defaultTitle={entry.title}
            defaultType={entry.type as "HOME" | "OUT"}
            defaultVoteMode={(entry.vote_mode as "SIMPLE" | "DETAILED") ?? "SIMPLE"}
            defaultHappenedAt={entry.happened_at}
            defaultDescription={entry.description}
            members={membersWithProfile}
            defaultParticipantIds={participantIds}
            creatorId={entry.created_by}
          />
        </section>
      </div>
    </main>
  );
}
