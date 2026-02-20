import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/Topbar";
import LogoutButton from "./LogoutButton";

function getInitials(name: string | null | undefined, fallback: string): string {
  if (!name || !name.trim()) return fallback.slice(0, 2).toUpperCase();
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", user.id)
    .single();

  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, groups(id, name, invite_code, created_at)")
    .eq("user_id", user.id);

  type GroupRow = {
    id: string;
    name: string;
    invite_code: string;
    created_at: string;
  };
  const groups: GroupRow[] =
    memberships?.flatMap((m) => {
      const g = m.groups as unknown;
      if (Array.isArray(g)) return g as GroupRow[];
      return g != null ? [g as GroupRow] : [];
    }) ?? [];

  const groupIds = groups.map((g) => g.id);

  const entryCountByGroup: Record<string, number> = {};
  if (groupIds.length > 0) {
    const { data: entries } = await supabase
      .from("entries")
      .select("group_id")
      .in("group_id", groupIds);
    entries?.forEach((e) => {
      entryCountByGroup[e.group_id] = (entryCountByGroup[e.group_id] ?? 0) + 1;
    });
  }

  const membersByGroup: Record<string, string[]> = {};
  if (groupIds.length > 0) {
    const { data: members } = await supabase
      .from("group_members")
      .select("group_id, profiles(display_name)")
      .in("group_id", groupIds);
    members?.forEach((m) => {
      const raw = (m as { profiles: { display_name: string | null } | { display_name: string | null }[] | null }).profiles;
      const p = Array.isArray(raw) ? raw[0] : raw;
      const name = p?.display_name ?? null;
      const initials = getInitials(name, "?");
      if (!membersByGroup[m.group_id]) membersByGroup[m.group_id] = [];
      membersByGroup[m.group_id].push(initials);
    });
  }

  const userInitials = getInitials(profile?.display_name ?? user.email ?? "", "?");

  return (
    <main className="min-h-screen p-6 pb-24">
      <div className="mx-auto max-w-2xl">
        <Topbar
          title={
            <Link
              href="/dashboard"
              className="text-xl font-semibold text-brand-header"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              Cenette
            </Link>
          }
          right={
            <>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full bg-avatar-user-bg text-sm font-medium text-foreground"
                title={profile?.display_name ?? user.email ?? ""}
              >
                {userInitials}
              </span>
              <LogoutButton />
            </>
          }
        />

        <section className="mt-6 mb-8">
          <h2 className="mb-4 text-lg font-medium text-foreground">
            I tuoi gruppi
          </h2>
          {groups.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-separator-line bg-surface p-8 text-center text-text-secondary shadow-sm">
              Non sei in nessun gruppo. Crea un gruppo o entra con un codice
              invito.
            </p>
          ) : (
            <ul className="space-y-3">
              {groups.map((g) => {
                const count = entryCountByGroup[g.id] ?? 0;
                const initials = membersByGroup[g.id] ?? [];
                return (
                  <li key={g.id}>
                    <Link
                      href={`/group/${g.id}`}
                      className="block rounded-2xl bg-surface p-4 shadow-sm transition hover:shadow-md"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="min-w-0 font-semibold text-foreground">
                            {g.name}
                          </span>
                          <span
                            className={
                              count > 0
                                ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rating-medium text-xs font-medium text-white"
                                : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-medium text-foreground"
                            }
                          >
                            {count > 0 ? "7.5" : "—"}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5 text-sm text-text-tertiary">
                          <svg
                            className="h-4 w-4 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span>
                            {count} {count === 1 ? "evento" : "eventi"}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center">
                          {(initials.length === 0 ? [null] : initials.slice(0, 5)).map((init, i) => (
                            <span
                              key={init === null ? `${g.id}-empty` : `${g.id}-${i}-${init}`}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-surface bg-avatar-member-bg text-xs font-medium text-brand first:ml-0 -ml-2.5"
                            >
                              {init ?? "—"}
                            </span>
                          ))}
                          {initials.length > 5 && (
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-surface bg-surface-muted -ml-2.5 text-xs font-medium text-foreground">
                              +{initials.length - 5}
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

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
        <Link
          href="/dashboard/new"
          className="flex items-center justify-center gap-2 rounded-xl bg-accent-strong px-6 py-3 text-sm font-medium text-accent-foreground shadow-lg transition hover:opacity-90"
        >
          <span className="text-lg leading-none" aria-hidden>+</span>
          Nuovo gruppo
        </Link>
      </div>
    </main>
  );
}
