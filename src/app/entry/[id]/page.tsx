import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EntryPage({
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
    .select("id, group_id, type, title, description, happened_at, created_by, created_at, groups(id, name)")
    .eq("id", entryId)
    .single();

  if (!entry) {
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

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, user_id, rating_overall, comment, created_at")
    .eq("entry_id", entryId)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <Link
            href={`/group/${entry.group_id}`}
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          >
            ← {group.name}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {entry.title}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {entry.type === "HOME" ? "Cena a casa" : "Uscita"}
            {" · "}
            {new Date(entry.happened_at).toLocaleDateString("it-IT", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </header>

        {entry.description && (
          <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-zinc-700 dark:text-zinc-300">{entry.description}</p>
          </section>
        )}

        <section>
          <h2 className="mb-4 text-lg font-medium text-zinc-800 dark:text-zinc-200">
            Recensioni
          </h2>
          {!reviews?.length ? (
            <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
              Nessuna recensione. Presto potrai aggiungerne una da qui.
            </p>
          ) : (
            <ul className="space-y-3">
              {reviews.map((r) => (
                <li
                  key={r.id}
                  className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    ★ {r.rating_overall}/10
                  </span>
                  {r.comment && (
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {r.comment}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
