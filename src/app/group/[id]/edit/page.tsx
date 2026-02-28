import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/Topbar";
import { EditGroupSection } from "./EditGroupSection";

export default async function GroupEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: groupId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, created_by")
    .eq("id", groupId)
    .single();

  if (!group) notFound();

  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership) notFound();

  return (
    <main className="min-h-screen pb-24">
      <div className="mx-auto max-w-2xl">
        <Topbar
          showBack
          backHref={`/group/${groupId}`}
          backReplace
          title={
            <Link
              href={`/group/${groupId}`}
              className="block truncate text-lg font-semibold text-foreground"
            >
              Modifica gruppo
            </Link>
          }
        />

        <div className="px-6 pt-6">
          <section className="mt-6">
            <EditGroupSection
              groupId={group.id}
              defaultName={group.name}
              isCreator={(group as { created_by?: string | null }).created_by === user.id}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
