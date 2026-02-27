import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAvatarPublicUrl } from "@/lib/avatar";
import { EntryFormPageLayout } from "@/components/EntryFormPageLayout";
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
    .select("user_id, profiles(id, display_name, avatar_url, avatar_updated_at)")
    .eq("group_id", groupId);

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

  return (
    <EntryFormPageLayout
      title="Nuovo evento"
      backHref={`/group/${groupId}`}
    >
      <EntryForm
        mode="create"
        groupId={groupId}
        members={membersWithProfile}
        currentUserId={user.id}
      />
    </EntryFormPageLayout>
  );
}
