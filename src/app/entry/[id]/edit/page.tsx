import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAvatarPublicUrl } from "@/lib/avatar";
import { EntryFormPageLayout } from "@/components/EntryFormPageLayout";
import { EntryForm } from "@/components/EntryForm";

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

  const rawGroups = entry.groups as { id: string; name: string } | { id: string; name: string }[] | null;
  const group = Array.isArray(rawGroups) ? rawGroups[0] ?? null : rawGroups;
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
    .select("user_id, profiles(id, display_name, avatar_url, avatar_updated_at)")
    .eq("group_id", entry.group_id);

  const membersWithProfile = (members ?? []).map((m) => {
    const raw = m.profiles as unknown;
    const profile = Array.isArray(raw) ? raw[0] : raw;
    const p = profile as {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
      avatar_updated_at?: string | null;
    } | null | undefined;
    return {
      id: m.user_id,
      displayName: p?.display_name ?? "Utente",
      avatarUrl: p
        ? getAvatarPublicUrl(p.avatar_url ?? null, p.avatar_updated_at ?? null)
        : null,
    };
  });

  const { data: participants } = await supabase
    .from("entry_participants")
    .select("user_id")
    .eq("entry_id", entryId);

  const participantIds = (participants ?? []).map((p) => p.user_id);

  const { data: entryPhotos } = await supabase
    .from("entry_photos")
    .select("id, storage_path")
    .eq("entry_id", entryId)
    .order("created_at", { ascending: true });

  const currentPhotos: { id: string; url: string }[] = [];
  if (entryPhotos?.length) {
    const bucket = "entry-photos";
    for (const p of entryPhotos) {
      const { data: signed } = await supabase.storage
        .from(bucket)
        .createSignedUrl(p.storage_path, 3600);
      if (signed?.signedUrl) currentPhotos.push({ id: p.id, url: signed.signedUrl });
    }
  }

  return (
    <EntryFormPageLayout
      title="Modifica evento"
      backHref={`/entry/${entryId}`}
    >
      <EntryForm
        mode="edit"
        entryId={entryId}
        defaultTitle={entry.title}
        defaultType={entry.type as "HOME" | "OUT"}
        defaultVoteMode={(entry.vote_mode as "SIMPLE" | "DETAILED") ?? "SIMPLE"}
        defaultHappenedAt={entry.happened_at}
        defaultDescription={entry.description}
        members={membersWithProfile}
        defaultParticipantIds={participantIds}
        creatorId={entry.created_by}
        currentPhotos={currentPhotos}
      />
    </EntryFormPageLayout>
  );
}
