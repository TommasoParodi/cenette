import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EntryForm } from "@/components/EntryForm";

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

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, profiles(id, display_name)")
    .eq("group_id", groupId);

  const membersWithProfile = (members ?? []).map((m) => {
    const raw = m.profiles as unknown;
    const profile = Array.isArray(raw) ? raw[0] : raw;
    const p = profile as { id: string; display_name: string | null } | null | undefined;
    return {
      id: m.user_id,
      displayName: p?.display_name ?? "Utente",
    };
  });

  return (
    <main className="min-h-screen pb-8">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center gap-3 border-b border-separator-line bg-background px-4 py-3">
          <Link
            href={`/group/${groupId}`}
            className="flex shrink-0 items-center justify-center text-foreground"
            aria-label="Indietro"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7 7" />
            </svg>
          </Link>
          <h1 className="min-w-0 flex-1 text-lg font-semibold text-foreground">
            Nuovo evento
          </h1>
        </header>

        <div className="px-4 pt-6">
          <EntryForm
            mode="create"
            groupId={groupId}
            members={membersWithProfile}
            currentUserId={user.id}
          />
        </div>
      </div>
    </main>
  );
}
