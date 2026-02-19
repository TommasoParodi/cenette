import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ReviewForm } from "../ReviewForm";

export default async function EntryReviewPage({
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
    .select("id, group_id, title, vote_mode, groups(id, name)")
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

  const { data: myReview } = await supabase
    .from("reviews")
    .select("id, rating_overall, comment, rating_cost, rating_service, rating_food, rating_location")
    .eq("entry_id", entryId)
    .eq("user_id", user.id)
    .maybeSingle();

  const isEdit = !!myReview;

  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <Link
            href={`/entry/${entryId}`}
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          >
            ← {entry.title}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {isEdit ? "Modifica recensione" : "Scrivi la tua recensione"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {group.name}
          </p>
        </header>

        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <ReviewForm
            entryId={entryId}
            voteMode={(entry.vote_mode ?? "SIMPLE") as "SIMPLE" | "DETAILED"}
            initialRating={myReview?.rating_overall}
            initialComment={myReview?.comment}
            initialRatingCost={myReview?.rating_cost}
            initialRatingService={myReview?.rating_service}
            initialRatingFood={myReview?.rating_food}
            initialRatingLocation={myReview?.rating_location}
          />
        </section>
      </div>
    </main>
  );
}
