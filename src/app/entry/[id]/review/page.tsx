import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getReviewPhotoPublicUrl } from "@/lib/storage-public-url";
import { Topbar } from "@/components/Topbar";
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

  const myReviewPhotoUrl = myReview?.photo_path
    ? getReviewPhotoPublicUrl(myReview.photo_path)
    : null;

  const isEdit = !!myReview;

  return (
    <main className="min-h-screen pb-8">
      <div className="mx-auto max-w-2xl">
        <Topbar
          showBack
          backHref={`/entry/${entryId}`}
          backReplace
          title="La tua opinione"
        />

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
