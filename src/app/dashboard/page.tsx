import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";
import { CreateGroupForm } from "./CreateGroupForm";
import { JoinGroupForm } from "./JoinGroupForm";

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

  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              Cenette
            </h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Ciao, <b>{profile?.display_name ?? user.email}</b>
            </p>
          </div>
          <LogoutButton />
        </header>

        <section className="mb-8">
          <h2 className="mb-4 text-lg font-medium text-zinc-800 dark:text-zinc-200">
            I tuoi gruppi
          </h2>
          {groups.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
              Non sei in nessun gruppo. Crea un gruppo o entra con un codice
              invito.
            </p>
          ) : (
            <ul className="space-y-2">
              {groups.map((g) => (
                <li key={g.id}>
                  <Link
                    href={`/group/${g.id}`}
                    className="block rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
                  >
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {g.name}
                    </span>
                    <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                      Codice: <code className="font-mono">{g.invite_code}</code>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid gap-8 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <CreateGroupForm />
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <JoinGroupForm />
          </div>
        </div>
      </div>
    </main>
  );
}
