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
    .select("id, group_id, type, title, description, happened_at, vote_mode, created_by, created_at, groups(id, name)")
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
    .select("id, user_id, rating_overall, comment, rating_cost, rating_service, rating_food, rating_location, created_at")
    .eq("entry_id", entryId)
    .order("created_at", { ascending: false });

  const userIds = [...new Set((reviews ?? []).map((r) => r.user_id))];
  const { data: profiles } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", userIds)
      : { data: null };

  const displayNameByUserId = new Map<string, string>();
  profiles?.forEach((p) => {
    displayNameByUserId.set(p.id, p.display_name ?? "Utente");
  });

  const myReview = reviews?.find((r) => r.user_id === user.id) ?? null;
  const otherReviews = reviews?.filter((r) => r.user_id !== user.id) ?? [];
  const reviewsOrdered = myReview
    ? [myReview, ...otherReviews]
    : otherReviews;

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
          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
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
                {" · "}
                {(entry.vote_mode ?? "SIMPLE") === "DETAILED" ? "Voto dettagliato" : "Voto semplice"}
              </p>
            </div>
            {entry.created_by === user.id && (
              <Link
                href={`/entry/${entryId}/edit`}
                className="shrink-0 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Modifica evento
              </Link>
            )}
          </div>
        </header>

        {entry.description && (
          <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-zinc-700 dark:text-zinc-300">{entry.description}</p>
          </section>
        )}

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-zinc-800 dark:text-zinc-200">
              Recensioni
            </h2>
            {!myReview && (
              <Link
                href={`/entry/${entryId}/review`}
                className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Aggiungi recensione
              </Link>
            )}
          </div>

          {!reviews?.length ? (
            <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
              Nessuna recensione
            </p>
          ) : (
            <ul className="space-y-3">
              {!myReview && (
                <li>
                  <Link
                    href={`/entry/${entryId}/review`}
                    className="block rounded-xl border border-dashed border-zinc-300 p-6 text-center text-zinc-600 dark:border-zinc-600 dark:text-zinc-400"
                  >
                    Aggiungi la tua recensione
                  </Link>
                </li>
              )}
              {reviewsOrdered.map((r) => {
                const isMine = r.user_id === user.id;
                const authorName =
                  displayNameByUserId.get(r.user_id) ?? "Utente";
                return (
                  <li
                    key={r.id}
                    className={
                      isMine
                        ? "rounded-xl border-2 border-amber-400 bg-white p-4 dark:border-amber-500 dark:bg-zinc-900"
                        : "rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        {authorName}
                      </span>
                      {isMine && (
                        <Link
                          href={`/entry/${entryId}/review`}
                          className="text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                        >
                          Modifica
                        </Link>
                      )}
                    </div>
                    <span className="mt-1 block font-medium text-zinc-900 dark:text-zinc-100">
                      ★ {r.rating_overall}/10
                    </span>
                    {(entry.vote_mode ?? "SIMPLE") === "DETAILED" &&
                      "rating_cost" in r &&
                      r.rating_cost != null && (
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          Costo {r.rating_cost}
                          {" · "}
                          Servizio {r.rating_service}
                          {" · "}
                          Cibo {r.rating_food}
                          {" · "}
                          Location {r.rating_location}
                        </p>
                      )}
                    {r.comment && (
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {r.comment}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
