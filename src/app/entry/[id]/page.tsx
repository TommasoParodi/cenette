import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAvatarPublicUrl } from "@/lib/avatar";
import { Topbar } from "@/components/Topbar";
import { EntryImageCarousel } from "./EntryImageCarousel";
import { EntryPageActionsProvider } from "./EntryPageActions";
import { EntryReviewMenu } from "./EntryReviewMenu";
import { ReviewComment } from "./ReviewComment";
import { ReviewPhotoLightbox } from "./ReviewPhotoLightbox";
import { EntryTopbarMenu } from "./EntryTopbarMenu";
import { cookies } from "next/headers";

function getInitials(name: string | null | undefined, fallback: string): string {
  if (!name || !name.trim()) return fallback.slice(0, 2).toUpperCase();
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatEventDateFull(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatReviewTimeAgo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return "Pochi minuti fa";
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "ora" : "ore"} fa`;
  if (diffDays === 1) return "Ieri";
  if (diffDays < 7) return `${diffDays} giorni fa`;
  return formatEventDateFull(iso);
}

const RATING_CATEGORIES = [
  { key: "rating_food", label: "CIBO" },
  { key: "rating_service", label: "SERVIZIO" },
  { key: "rating_cost", label: "COSTO" },
  { key: "rating_location", label: "LOCATION" },
] as const;

/** Ordine per la card: prima colonna CIBO/COSTO, seconda SERVIZIO/LOCATION */
const RATING_DISPLAY_ORDER = [
  "rating_food",
  "rating_cost",
  "rating_service",
  "rating_location",
] as const;

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5 ? 1 : 0;
  const empty = max - full - half;
  const gradientId = `star-half-${value}-${full}`;
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: full }).map((_, i) => (
        <svg key={`f-${i}`} className="h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      {half > 0 && (
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <defs>
            <linearGradient id={gradientId}>
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#d1d5db" />
            </linearGradient>
          </defs>
          <path fill={`url(#${gradientId})`} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <svg key={`e-${i}`} className="h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default async function EntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: entryId } = await params;
  const supabase = await createSupabaseServerClient();
  const cookieStore = await cookies();
  const avatarRefreshCookie = cookieStore.get("avatar_refresh")?.value ?? null;

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
    .select("user_id, cached_display_name")
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
  type ProfileRow = { id: string; display_name: string | null; avatar_url: string | null; avatar_updated_at?: string | null };
  const { data: profiles } =
    allUserIds.length > 0
      ? await supabase.from("profiles").select("id, display_name, avatar_url, avatar_updated_at").in("id", allUserIds)
      : { data: null as ProfileRow[] | null };

  const displayNameByUserId = new Map<string, string>();
  const avatarUrlByUserId = new Map<string, string | null>();
  profiles?.forEach((p) => {
    displayNameByUserId.set(p.id, p.display_name ?? "Utente");
    avatarUrlByUserId.set(
      p.id,
      getAvatarPublicUrl(p.avatar_url ?? null, p.avatar_updated_at ?? avatarRefreshCookie ?? null)
    );
  });
  const participantCachedNameByUserId = new Map<string, string>();
  (participantRows ?? []).forEach((p) => {
    const cached = (p as { cached_display_name?: string | null }).cached_display_name;
    if (cached?.trim()) participantCachedNameByUserId.set(p.user_id, cached.trim());
  });

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

  const participantsWithNames = (participantRows ?? []).map((p) => {
    const name = (p as { cached_display_name?: string | null }).cached_display_name ?? displayNameByUserId.get(p.user_id) ?? "Utente";
    return {
      id: p.user_id,
      name,
      initials: getInitials(name, "?"),
      avatarUrl: avatarUrlByUserId.get(p.user_id) ?? null,
    };
  });

  const isDetailed = (entry.vote_mode ?? "SIMPLE") === "DETAILED";
  const isHome = entry.type === "HOME";

  return (
    <main className="min-h-screen bg-background pb-20">
      <EntryPageActionsProvider entryId={entryId}>
        <div className="mx-auto max-w-2xl">
          <Topbar
            showBack
            backHref={`/group/${entry.group_id}`}
            title="Dettaglio Evento"
            right={
              entry.created_by === user.id ? (
                <EntryTopbarMenu entryId={entryId} entryTitle={entry.title} />
              ) : (
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground hover:bg-surface-muted"
                  aria-label="Condividi"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              )
            }
          />

          <div className="relative">
            <div className="overflow-hidden rounded-b-2xl">
              <EntryImageCarousel imageUrls={photoUrls} />
            </div>

            <div className="px-4 -mt-6 relative z-10">
              <div className="rounded-2xl bg-surface p-5 shadow-lg">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold uppercase ${isHome ? "bg-accent/20 text-accent" : "bg-gray-200 text-gray-700"}`}>
                    {isHome ? "A casa" : "Fuori"}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-foreground">{entry.title}</h1>
                <div className="mt-3 flex items-center gap-1.5 text-sm text-text-tertiary">
                  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatEventDateFull(entry.happened_at)}
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 pt-6">
            {avgRating != null && (
              <section className="mb-8 py-10 text-center">
                <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">Media voto</p>
                <p className="mt-3 text-5xl font-bold text-brand">{avgRating.toFixed(1)}</p>
                <div className="mt-4 flex justify-center">
                  <StarRating value={avgRating / 2} />
                </div>
              </section>
            )}

            {entry.description && (
              <section className="mb-8">
                <h2 className="mb-2 text-base font-bold text-foreground">Descrizione</h2>
                <p className="text-sm leading-relaxed text-foreground">{entry.description}</p>
              </section>
            )}

            {participantsWithNames.length > 0 && (
              <section className="mb-8">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-bold text-foreground">Partecipanti</h2>
                  <span className="text-sm text-text-tertiary">
                    {participantsWithNames.length} {participantsWithNames.length === 1 ? "persona" : "persone"}
                  </span>
                </div>
                <div className="flex items-center">
                  {participantsWithNames.slice(0, 5).map((p, i) => (
                    <span
                      key={p.id}
                      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-surface bg-avatar-member-bg text-sm font-medium text-foreground first:ml-0 -ml-2.5"
                    >
                      {p.avatarUrl ? (
                        <img src={p.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        p.initials
                      )}
                    </span>
                  ))}
                  {participantsWithNames.length > 5 && (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-surface bg-accent -ml-2.5 text-xs font-semibold text-accent-foreground">
                      +{participantsWithNames.length - 5}
                    </span>
                  )}
                </div>
              </section>
            )}

            <section className="mb-8">
              <div className="mb-3">
                <h2 className="text-base font-bold text-foreground">Recensioni</h2>
              </div>
              {!isParticipant && (
                <p className="mb-4 text-xs text-text-secondary">
                  Solo i partecipanti possono scrivere una recensione.
                </p>
              )}

              {!reviews?.length ? (
                <div className="flex flex-col items-center py-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="mt-4 text-center font-semibold text-foreground">Nessuna recensione</p>
                  <p className="mt-1 text-center text-sm text-text-secondary">
                    Scrivine una per condividere la tua esperienza!
                  </p>
                </div>
              ) : (
                <ul id="recensioni" className="space-y-4">
                  {reviewsOrdered.map((r) => {
                    const isMine = r.user_id === user.id;
                    const authorName =
                      displayNameByUserId.get(r.user_id) ??
                      participantCachedNameByUserId.get(r.user_id) ??
                      "Utente";
                    const authorInitials = getInitials(authorName, "?");
                    const authorAvatarUrl = avatarUrlByUserId.get(r.user_id) ?? null;
                    const reviewPhotoUrl = reviewPhotoUrls.get(r.id);

                    return (
                      <li key={r.id} className="rounded-2xl bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-avatar-member-bg text-sm font-medium text-brand">
                              {authorAvatarUrl ? (
                                <img src={authorAvatarUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                authorInitials
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-foreground">{authorName}</p>
                              <p className="text-sm text-text-tertiary">{formatReviewTimeAgo(r.created_at)}</p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <span className="rounded-full bg-brand/15 px-3 py-1.5 text-lg font-bold text-brand">
                              {(r.rating_overall ?? 0).toFixed(1)}
                            </span>
                            {isMine && (
                              <EntryReviewMenu entryId={entryId} reviewId={r.id} />
                            )}
                          </div>
                        </div>

                        {r.comment && (
                          <div className="mt-4">
                            <ReviewComment text={r.comment} quoted />
                          </div>
                        )}

                        {isDetailed && (
                          <div className="mt-4 rounded-xl bg-neutral-50 px-3 py-2">
                            <div className="mx-auto grid max-w-xs grid-cols-2 justify-items-center gap-x-4 gap-y-1">
                              {RATING_DISPLAY_ORDER.map((key) => {
                                const label = RATING_CATEGORIES.find((c) => c.key === key)?.label ?? key;
                                const value = (r as Record<string, number | null>)[key] ?? 0;
                                return (
                                  <div key={key} className="text-center">
                                    <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                      {label}
                                    </span>
                                    <p className="text-lg font-bold text-brand">{value}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {reviewPhotoUrl && (
                          <div className="mt-4">
                            <ReviewPhotoLightbox src={reviewPhotoUrl} alt="Foto recensione" />
                          </div>
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
          <div className="fixed bottom-0 left-0 right-0 z-10 flex justify-center px-4 py-4">
            <Link
              href={`/entry/${entryId}/review`}
              className="flex items-center justify-center gap-3 rounded-full bg-accent px-8 py-4 text-base font-semibold text-accent-foreground shadow-lg transition hover:opacity-90"
              aria-label="Aggiungi recensione"
            >
              <span className="text-xl leading-none" aria-hidden>+</span>
              <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Aggiungi recensione
            </Link>
          </div>
        )}
      </EntryPageActionsProvider>
    </main>
  );
}
