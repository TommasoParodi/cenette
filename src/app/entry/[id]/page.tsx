import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/Topbar";
import { EntryImageCarousel } from "./EntryImageCarousel";

function getInitials(name: string | null | undefined, fallback: string): string {
  if (!name || !name.trim()) return fallback.slice(0, 2).toUpperCase();
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const RATING_CATEGORIES = [
  { key: "rating_food", label: "Cibo" },
  { key: "rating_service", label: "Servizio" },
  { key: "rating_cost", label: "Costo" },
  { key: "rating_location", label: "Location" },
] as const;

export default async function EntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: entryId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: entry } = await supabase
    .from("entries")
    .select("id, group_id, type, title, description, happened_at, vote_mode, created_by, created_at, groups(id, name)")
    .eq("id", entryId)
    .single();

  if (!entry) notFound();

  const rawGroups = entry.groups as { id: string; name: string } | { id: string; name: string }[] | null;
  const group = Array.isArray(rawGroups) ? rawGroups[0] ?? null : rawGroups;
  if (!group) notFound();

  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", entry.group_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) notFound();

  const { data: participantRows } = await supabase
    .from("entry_participants")
    .select("user_id")
    .eq("entry_id", entryId);
  const participantIds = (participantRows ?? []).map((p) => p.user_id);
  const isParticipant = participantIds.length === 0 || participantIds.includes(user.id);

  const { data: entryPhotos } = await supabase
    .from("entry_photos")
    .select("id, storage_path")
    .eq("entry_id", entryId)
    .order("created_at", { ascending: true });

  const photoUrls: { id: string; url: string }[] = [];
  if (entryPhotos?.length) {
    const bucket = "entry-photos";
    const expiresIn = 3600;
    for (const p of entryPhotos) {
      const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(p.storage_path, expiresIn);
      if (signed?.signedUrl) photoUrls.push({ id: p.id, url: signed.signedUrl });
    }
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, user_id, rating_overall, comment, rating_cost, rating_service, rating_food, rating_location, photo_path, created_at")
    .eq("entry_id", entryId)
    .order("created_at", { ascending: false });

  const allUserIds = [...new Set([...(reviews ?? []).map((r) => r.user_id), ...participantIds])];
  const { data: profiles } =
    allUserIds.length > 0
      ? await supabase.from("profiles").select("id, display_name").in("id", allUserIds)
      : { data: null };

  const displayNameByUserId = new Map<string, string>();
  profiles?.forEach((p) => displayNameByUserId.set(p.id, p.display_name ?? "Utente"));

  const myReview = reviews?.find((r) => r.user_id === user.id) ?? null;
  const otherReviews = reviews?.filter((r) => r.user_id !== user.id) ?? [];
  const reviewsOrdered = myReview ? [myReview, ...otherReviews] : otherReviews;

  const reviewPhotoUrls = new Map<string, string>();
  const reviewPhotosWithPath = (reviews ?? []).filter((r) => r.photo_path);
  if (reviewPhotosWithPath.length > 0) {
    const bucket = "review-photos";
    const expiresIn = 3600;
    for (const r of reviewPhotosWithPath) {
      const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(r.photo_path!, expiresIn);
      if (signed?.signedUrl) reviewPhotoUrls.set(r.id, signed.signedUrl);
    }
  }

  const avgRating =
    reviews?.length && reviews.length > 0
      ? Math.round((reviews.reduce((a, r) => a + (r.rating_overall ?? 0), 0) / reviews.length) * 10) / 10
      : null;

  const participantsWithNames = participantIds.map((uid) => ({
    id: uid,
    name: displayNameByUserId.get(uid) ?? "Utente",
    initials: getInitials(displayNameByUserId.get(uid), "?"),
  }));

  const isDetailed = (entry.vote_mode ?? "SIMPLE") === "DETAILED";
  const isHome = entry.type === "HOME";

  return (
    <main className="min-h-screen pb-24">
      <div className="mx-auto max-w-2xl">
        <Topbar
          showBack
          backHref={`/group/${entry.group_id}`}
          title={entry.title}
          right={
            entry.created_by === user.id ? (
              <Link
                href={`/entry/${entryId}/edit`}
                className="text-sm font-medium text-accent hover:underline"
              >
                Modifica
              </Link>
            ) : undefined
          }
        />

        <div className="mt-3 overflow-hidden rounded-b-2xl bg-surface shadow-sm">
          <EntryImageCarousel imageUrls={photoUrls} />
        </div>

        <div className="px-4 pt-6">
          {avgRating != null && (
            <div className="flex justify-center">
              <span className="inline-flex h-14 min-w-[3.5rem] items-center justify-center rounded-xl bg-accent-strong px-4 text-2xl font-semibold text-accent-foreground shadow-sm">
                {avgRating.toFixed(1)}
              </span>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-text-secondary">
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatEventDate(entry.happened_at)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-avatar-member-bg px-2.5 py-0.5 text-foreground">
              {isHome ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
              {isHome ? "A casa" : "Fuori"}
            </span>
          </div>

          {entry.description && (
            <section className="mt-8">
              <h2 className="mb-2 text-sm font-semibold text-foreground">Descrizione</h2>
              <p className="text-sm leading-relaxed text-text-secondary">{entry.description}</p>
            </section>
          )}

          {participantsWithNames.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Partecipanti</h2>
              <ul className="space-y-2">
                {participantsWithNames.map((p) => (
                  <li key={p.id} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-avatar-member-bg text-sm font-medium text-brand">
                      {p.initials}
                    </span>
                    <span className="text-sm text-foreground">{p.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Recensioni {reviews?.length ? `(${reviews.length})` : ""}
              </h2>
            </div>
            {!isParticipant && (
              <p className="mb-4 text-xs text-text-secondary">
                Solo i partecipanti possono scrivere una recensione.
              </p>
            )}

            {!reviews?.length ? (
              <p className="rounded-xl border border-dashed border-separator-line bg-surface p-6 text-center text-sm text-text-secondary">
                Nessuna recensione
              </p>
            ) : (
              <ul className="space-y-4">
                {reviewsOrdered.map((r) => {
                  const isMine = r.user_id === user.id;
                  const authorName = displayNameByUserId.get(r.user_id) ?? "Utente";
                  const authorInitials = getInitials(displayNameByUserId.get(r.user_id), "?");
                  const reviewPhotoUrl = reviewPhotoUrls.get(r.id);

                  return (
                    <li
                      key={r.id}
                      className="rounded-xl bg-surface p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-avatar-member-bg text-sm font-medium text-brand">
                            {authorInitials}
                          </span>
                          <span className="truncate text-sm font-medium text-foreground">{authorName}</span>
                        </div>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-strong text-sm font-semibold text-accent-foreground">
                          {(r.rating_overall ?? 0).toFixed(1)}
                        </span>
                      </div>

                      {isDetailed && (
                        <div className="mt-3 space-y-2">
                          {RATING_CATEGORIES.map(({ key, label }) => {
                            const value = (r as Record<string, number | null>)[key] ?? 0;
                            return (
                              <div key={key} className="flex items-center gap-2 text-xs">
                                <span className="w-16 shrink-0 text-text-secondary">{label}</span>
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                                  <div
                                    className="h-full rounded-full bg-accent"
                                    style={{ width: `${(value / 10) * 100}%` }}
                                  />
                                </div>
                                <span className="w-6 shrink-0 text-right font-medium text-foreground">{value}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {r.comment && (
                        <p className="mt-3 text-sm text-text-secondary">{r.comment}</p>
                      )}

                      {reviewPhotoUrl && (
                        <div className="mt-3">
                          <a
                            href={reviewPhotoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Foto recensione
                          </a>
                        </div>
                      )}

                      {isMine && (
                        <Link
                          href={`/entry/${entryId}/review`}
                          className="mt-2 inline-block text-xs font-medium text-accent hover:underline"
                        >
                          Modifica recensione
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>

      {!myReview && isParticipant && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
          <Link
            href={`/entry/${entryId}/review`}
            className="flex items-center justify-center gap-2 rounded-xl bg-accent-strong px-6 py-3 text-sm font-medium text-accent-foreground shadow-lg transition hover:opacity-90"
          >
            <span className="text-lg leading-none" aria-hidden>+</span>
            Aggiungi recensione
          </Link>
        </div>
      )}
    </main>
  );
}
