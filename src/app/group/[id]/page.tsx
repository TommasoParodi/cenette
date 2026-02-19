import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function GroupPage({
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
    .select("id, name, vote_mode, invite_code")
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

  const { data: entries } = await supabase
    .from("entries")
    .select("id, title, type, happened_at, created_at")
    .eq("group_id", groupId)
    .order("happened_at", { ascending: false });

  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {group.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Codice invito: <code className="font-mono">{group.invite_code}</code>
            {" · "}
            {group.vote_mode === "DETAILED" ? "Voto dettagliato" : "Voto semplice"}
          </p>
        </header>

        <section>
          <h2 className="mb-4 text-lg font-medium text-zinc-800 dark:text-zinc-200">
            Eventi
          </h2>
          {!entries?.length ? (
            <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
              Nessun evento. Presto potrai aggiungerne uno da qui.
            </p>
          ) : (
            <ul className="space-y-2">
              {entries.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/entry/${e.id}`}
                    className="block rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
                  >
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {e.title}
                    </span>
                    <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                      {e.type === "HOME" ? "Casa" : "Fuori"}
                      {" · "}
                      {new Date(e.happened_at).toLocaleDateString("it-IT")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
