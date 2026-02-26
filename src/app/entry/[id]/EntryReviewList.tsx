"use client";

import { EntryReviewMenu } from "./EntryReviewMenu";
import { ReviewComment } from "./ReviewComment";
import { ReviewPhotoLightbox } from "./ReviewPhotoLightbox";

const RATING_CATEGORIES = [
  { key: "rating_food", label: "CIBO" },
  { key: "rating_service", label: "SERVIZIO" },
  { key: "rating_cost", label: "COSTO" },
  { key: "rating_location", label: "LOCATION" },
] as const;

const RATING_DISPLAY_ORDER = [
  "rating_food",
  "rating_cost",
  "rating_service",
  "rating_location",
] as const;

function getInitials(name: string | null | undefined, fallback: string): string {
  if (!name || !name.trim()) return fallback.slice(0, 2).toUpperCase();
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
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
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type ReviewRow = {
  id: string;
  user_id: string;
  rating_overall: number | null;
  comment: string | null;
  rating_cost?: number | null;
  rating_service?: number | null;
  rating_food?: number | null;
  rating_location?: number | null;
  photo_path?: string | null;
  created_at: string;
};

export function EntryReviewList({
  entryId,
  isDetailed,
  reviewsOrdered,
  userId,
  displayNameByUserId,
  participantCachedNameByUserId,
  avatarUrlByUserId,
  reviewPhotoUrls,
}: {
  entryId: string;
  isDetailed: boolean;
  reviewsOrdered: ReviewRow[];
  userId: string;
  displayNameByUserId: Record<string, string>;
  participantCachedNameByUserId: Record<string, string>;
  avatarUrlByUserId: Record<string, string | null>;
  reviewPhotoUrls: Record<string, string>;
}) {
  return (
    <ul id="recensioni" className="space-y-4">
      {reviewsOrdered.map((r) => {
        const isMine = r.user_id === userId;
        const authorName =
          displayNameByUserId[r.user_id] ??
          participantCachedNameByUserId[r.user_id] ??
          "Utente";
        const authorInitials = getInitials(authorName, "?");
        const authorAvatarUrl = avatarUrlByUserId[r.user_id] ?? null;
        const reviewPhotoUrl = reviewPhotoUrls[r.id];

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
                    const value = (r as unknown as Record<string, number | null>)[key] ?? 0;
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
  );
}
