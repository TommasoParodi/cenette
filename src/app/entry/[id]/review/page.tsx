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

  const { data: participantRows } = await supabase
    .from("entry_participants")
    .select("user_id")
    .eq("entry_id", entryId);
  const participantIds = (participantRows ?? []).map((p) => p.user_id);
  const isParticipant =
    participantIds.length === 0 || participantIds.includes(user.id);

  if (!isParticipant) {
    redirect(`/entry/${entryId}`);
  }

  const { data: myReview } = await supabase
    .from("reviews")
    .select("id, rating_overall, comment, rating_cost, rating_service, rating_food, rating_location, photo_path")
    .eq("entry_id", entryId)
    .eq("user_id", user.id)
    .maybeSingle();

  let myReviewPhotoUrl: string | null = null;
  if (myReview?.photo_path) {
    const { data: signed } = await supabase.storage
      .from("review-photos")
      .createSignedUrl(myReview.photo_path, 3600);
    if (signed?.signedUrl) myReviewPhotoUrl = signed.signedUrl;
  }

  const isEdit = !!myReview;

  return (
    <main className="min-h-screen pb-8">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center gap-3 border-b border-separator-line bg-background px-4 py-3">
          <Link
            href={`/entry/${entryId}`}
            className="flex shrink-0 items-center justify-center text-foreground"
            aria-label="Indietro"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7 7" />
            </svg>
          </Link>
          <h1 className="min-w-0 flex-1 text-lg font-semibold text-foreground">
            {isEdit ? "Modifica recensione" : "Nuova recensione"}
          </h1>
        </header>

        <div className="px-4 pt-6">
          <ReviewForm
            entryId={entryId}
            voteMode={(entry.vote_mode ?? "SIMPLE") as "SIMPLE" | "DETAILED"}
            initialRating={myReview?.rating_overall}
            initialComment={myReview?.comment}
            initialRatingCost={myReview?.rating_cost}
            initialRatingService={myReview?.rating_service}
            initialRatingFood={myReview?.rating_food}
            initialRatingLocation={myReview?.rating_location}
            initialPhotoUrl={myReviewPhotoUrl}
          />
        </div>
      </div>
    </main>
  );
}
