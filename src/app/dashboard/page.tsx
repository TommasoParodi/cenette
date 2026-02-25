import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAvatarPublicUrl } from "@/lib/avatar";
import { Topbar } from "@/components/Topbar";
import { CenetteLogo } from "@/components/CenetteLogo";
import { AdminIcon } from "@/components/AdminIcon";

function getInitials(name: string | null | undefined, fallback: string): string {
  if (!name || !name.trim()) return fallback.slice(0, 2).toUpperCase();
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function PeoplePlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

type MemberInfo = { initials: string; avatarUrl: string | null };

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const cookieStore = await cookies();
  const avatarRefreshCookie = cookieStore.get("avatar_refresh")?.value ?? null;

  type ProfileRow = { id: string; display_name: string | null; avatar_url: string | null; avatar_updated_at?: string | null };
  let profile: ProfileRow | null = null;
  let avatarPublicUrl: string | null = null;

  const { data: profileWithTs, error: profileErr } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, avatar_updated_at")
    .eq("id", user.id)
    .single();

  if (!profileErr && profileWithTs) {
    profile = profileWithTs;
    avatarPublicUrl = getAvatarPublicUrl(
      profile.avatar_url ?? null,
      profile.avatar_updated_at ?? avatarRefreshCookie ?? null
    );
  } else {
    const { data: profileFallback } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("id", user.id)
      .single();
    if (profileFallback) {
      profile = profileFallback;
      avatarPublicUrl = getAvatarPublicUrl(
        profile.avatar_url ?? null,
        avatarRefreshCookie ?? null
      );
    }
  }

  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, groups(id, name, invite_code, created_at, created_by)")
    .eq("user_id", user.id);

  type GroupRow = {
    id: string;
    name: string;
    invite_code: string;
    created_at: string;
    created_by: string | null;
  };
  const groups: GroupRow[] =
    memberships?.flatMap((m) => {
      const g = m.groups as unknown;
      if (Array.isArray(g)) return g as GroupRow[];
      return g != null ? [g as GroupRow] : [];
    }) ?? [];

  const groupIds = groups.map((g) => g.id);

  const entryCountByGroup: Record<string, number> = {};
  const entryIdsByGroup: Record<string, string[]> = {};
  if (groupIds.length > 0) {
    const { data: entries } = await supabase
      .from("entries")
      .select("id, group_id")
      .in("group_id", groupIds);
    entries?.forEach((e) => {
      entryCountByGroup[e.group_id] = (entryCountByGroup[e.group_id] ?? 0) + 1;
      if (!entryIdsByGroup[e.group_id]) entryIdsByGroup[e.group_id] = [];
      entryIdsByGroup[e.group_id].push(e.id);
    });
  }

  const membersByGroup: Record<string, MemberInfo[]> = {};
  if (groups.length > 0) {
    const { data: rpcRows } = await supabase.rpc("get_my_groups_members");
    const rows = (rpcRows ?? []) as Array<{ group_id: string; display_name: string | null }>;
    rows.forEach((r) => {
      if (!membersByGroup[r.group_id]) membersByGroup[r.group_id] = [];
      membersByGroup[r.group_id].push({
        initials: getInitials(r.display_name, "?"),
        avatarUrl: null,
      });
    });
  }

  const userInitials = getInitials(profile?.display_name ?? user.email ?? "", "?");
  groups.forEach((g) => {
    if (!membersByGroup[g.id] || membersByGroup[g.id].length === 0) {
      membersByGroup[g.id] = [{ initials: userInitials, avatarUrl: avatarPublicUrl }];
    }
  });

  return (
    <main className="min-h-screen pb-20">
      <div className="mx-auto max-w-2xl">
        <Topbar
          title={<CenetteLogo href="/dashboard" />}
          right={
            <Link
              href="/profile"
              className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-avatar-user-bg text-sm font-medium text-foreground transition hover:opacity-90"
              title={profile?.display_name ?? user.email ?? "Profilo"}
              aria-label="Apri profilo"
            >
              {avatarPublicUrl ? (
                <img
                  src={avatarPublicUrl}
                  alt=""
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                />
              ) : (
                userInitials
              )}
            </Link>
          }
        />

        <div className="px-4 pt-4">
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-foreground">
                I tuoi gruppi
              </h2>
              {groups.length > 0 && (
                <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-medium text-text-muted">
                  {groups.length} Attiv{groups.length === 1 ? "o" : "i"}
                </span>
              )}
            </div>

            {groups.length === 0 ? (
              <div className="flex flex-col items-center p-8">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <PeoplePlusIcon className="h-10 w-10" />
                </div>
                <h3 className="mt-4 text-center text-lg font-bold text-foreground">
                  Inizia a organizzare le tue cene!
                </h3>
                <p className="mt-2 text-center text-sm text-text-secondary">
                  Non hai ancora gruppi. Creane uno per invitare i tuoi amici!
                </p>
                <Link
                  href="/dashboard/come-funziona"
                  className="mt-6 rounded-xl border-2 border-accent px-5 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent/5"
                >
                  Scopri come funziona
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {groups.map((g) => {
                  const count = entryCountByGroup[g.id] ?? 0;
                  const members = membersByGroup[g.id] ?? [];
                  return (
                    <li key={g.id}>
                      <Link
                        href={`/group/${g.id}`}
                        className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm transition hover:shadow-md"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-foreground">
                              {g.name}
                            </span>
                            {g.created_by === user.id && (
                              <span className="shrink-0 text-brand" title="Sei l'admin di questo gruppo">
                                <AdminIcon className="h-5 w-5" />
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-text-tertiary">
                            {count} {count === 1 ? "evento" : "eventi"} organizzati
                          </p>
                          <div className="mt-3 flex items-center">
                            {(members.length === 0 ? [{ initials: "—", avatarUrl: null }] : members.slice(0, 4)).map((mem, i) => (
                              <span
                                key={`${g.id}-${i}-${mem.initials}`}
                                className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-surface bg-avatar-member-bg text-xs font-medium text-foreground first:ml-0 -ml-2.5"
                              >
                                {mem.avatarUrl ? (
                                  <img src={mem.avatarUrl} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  mem.initials
                                )}
                              </span>
                            ))}
                            {members.length > 4 && (
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-surface bg-surface-muted -ml-2.5 text-xs font-medium text-foreground">
                                +{members.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10 flex justify-center px-4 py-4">
        <Link
          href="/dashboard/new"
          className="flex items-center justify-center gap-3 rounded-full bg-accent px-8 py-4 text-base font-semibold text-accent-foreground shadow-lg transition hover:opacity-90"
          aria-label="Crea nuovo gruppo"
        >
          <span className="text-xl leading-none" aria-hidden>+</span>
          <PeoplePlusIcon className="h-5 w-5" />
          Nuovo gruppo
        </Link>
      </div>
    </main>
  );
}
