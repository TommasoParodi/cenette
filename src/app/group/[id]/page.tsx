import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAvatarPublicUrl } from "@/lib/avatar";
import { Topbar } from "@/components/Topbar";
import { type EventFilter } from "./EventFilterTabs";
import { FilterAndListWrapper } from "./FilterAndListWrapper";
import { GroupTopbarMenu } from "./GroupTopbarMenu";
import { CopyableInviteCode } from "../CopyableInviteCode";
import { AdminIcon } from "@/components/AdminIcon";

const PLACEHOLDER_EVENT_IMAGE = "/images/placeholder-event.png";

function getInitials(name: string | null | undefined, fallback: string): string {
  if (!name || !name.trim()) return fallback.slice(0, 2).toUpperCase();
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatEventDateOnly(iso: string): string {
  const d = new Date(iso);
  const weekday = d.toLocaleDateString("it-IT", { weekday: "long" });
  const date = d.toLocaleDateString("it-IT", { day: "numeric", month: "long" });
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${date}`;
}

export default async function GroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string; sort?: string }>;
}) {
  const { id: groupId } = await params;
  const { filter: filterParam, sort: sortParam } = await searchParams;
  const filter = (filterParam === "home" || filterParam === "out" ? filterParam : "tutti") as EventFilter;
  const validSort = ["date_asc", "date_desc", "vote_asc", "vote_desc"].includes(sortParam ?? "")
    ? (sortParam as "date_asc" | "date_desc" | "vote_asc" | "vote_desc")
    : "date_desc";

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, invite_code, created_by")
    .eq("id", groupId)
    .single();

  if (!group) notFound();

  const isCreator = (group as { created_by?: string | null }).created_by === user.id;

  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership) notFound();

  let entriesQuery = supabase
    .from("entries")
    .select("id, title, type, happened_at, created_at, created_by")
    .eq("group_id", groupId)
    .order("happened_at", { ascending: false });

  if (filter === "home") entriesQuery = entriesQuery.eq("type", "HOME");
  if (filter === "out") entriesQuery = entriesQuery.eq("type", "OUT");

  const { data: entriesRaw } = await entriesQuery;
  const entriesList = entriesRaw ?? [];

  const entryIds = entriesList.map((e) => e.id);
  const ratingByEntry: Record<string, number> = {};
  const participantsByEntry: Record<string, { initials: string; userId: string; avatarUrl: string | null }[]> = {};
  const firstPhotoUrlByEntry: Record<string, string> = {};

  if (entryIds.length > 0) {
    const { data: reviews } = await supabase
      .from("reviews")
      .select("entry_id, rating_overall")
      .in("entry_id", entryIds);
    const ratingsPerEntry: Record<string, number[]> = {};
    reviews?.forEach((r) => {
      if (r.rating_overall == null) return;
      if (!ratingsPerEntry[r.entry_id]) ratingsPerEntry[r.entry_id] = [];
      ratingsPerEntry[r.entry_id].push(r.rating_overall);
    });
    Object.keys(ratingsPerEntry).forEach((id) => {
      const arr = ratingsPerEntry[id];
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      ratingByEntry[id] = Math.round(avg * 10) / 10;
    });

    const { data: participants } = await supabase
      .from("entry_participants")
      .select("entry_id, user_id, cached_display_name")
      .in("entry_id", entryIds);
    const userIds = [...new Set((participants ?? []).map((p) => p.user_id))];
    type ProfileRow = { id: string; display_name: string | null; avatar_url: string | null; avatar_updated_at?: string | null };
    const { data: profiles } =
      userIds.length > 0
        ? await supabase.from("profiles").select("id, display_name, avatar_url, avatar_updated_at").in("id", userIds)
        : { data: null as ProfileRow[] | null };
    const nameByUserId = new Map<string, string>();
    const avatarUrlByUserId = new Map<string, string | null>();
    profiles?.forEach((p) => {
      nameByUserId.set(p.id, p.display_name ?? "?");
      avatarUrlByUserId.set(
        p.id,
        getAvatarPublicUrl(p.avatar_url ?? null, p.avatar_updated_at ?? null)
      );
    });
    participants?.forEach((p) => {
      if (!participantsByEntry[p.entry_id]) participantsByEntry[p.entry_id] = [];
      const name = (p as { cached_display_name?: string | null }).cached_display_name ?? nameByUserId.get(p.user_id) ?? "?";
      participantsByEntry[p.entry_id].push({
        initials: getInitials(name, "?"),
        userId: p.user_id,
        avatarUrl: avatarUrlByUserId.get(p.user_id) ?? null,
      });
    });

    const { data: photos } = await supabase
      .from("entry_photos")
      .select("entry_id, storage_path")
      .in("entry_id", entryIds)
      .order("created_at", { ascending: true });
    const firstPathByEntry: Record<string, string> = {};
    photos?.forEach((p) => {
      if (!firstPathByEntry[p.entry_id]) firstPathByEntry[p.entry_id] = p.storage_path;
    });
    const bucket = "entry-photos";
    for (const entryId of Object.keys(firstPathByEntry)) {
      const { data: signed } = await supabase.storage
        .from(bucket)
        .createSignedUrl(firstPathByEntry[entryId], 3600);
      if (signed?.signedUrl) firstPhotoUrlByEntry[entryId] = signed.signedUrl;
    }
  }

  const entries = (() => {
    const list = [...entriesList];
    if (validSort === "vote_desc") {
      return list.sort((a, b) => (ratingByEntry[b.id] ?? -1) - (ratingByEntry[a.id] ?? -1));
    }
    if (validSort === "vote_asc") {
      return list.sort((a, b) => (ratingByEntry[a.id] ?? -1) - (ratingByEntry[b.id] ?? -1));
    }
    if (validSort === "date_asc") {
      return list.sort((a, b) => new Date(a.happened_at).getTime() - new Date(b.happened_at).getTime());
    }
    return list.sort((a, b) => new Date(b.happened_at).getTime() - new Date(a.happened_at).getTime());
  })();

  return (
    <main className="min-h-screen pb-20">
      <div className="mx-auto max-w-2xl">
        <Topbar
          showBack
          backHref="/dashboard"
          title={
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate text-lg font-semibold text-foreground">{group.name}</span>
              {isCreator && (
                <span className="shrink-0 text-brand" title="Sei l'admin del gruppo" aria-label="Admin del gruppo">
                  <AdminIcon />
                </span>
              )}
            </span>
          }
          right={
            <>
              <CopyableInviteCode inviteCode={group.invite_code ?? ""} />
              <GroupTopbarMenu
                groupId={groupId}
                groupName={group.name}
                isCreator={isCreator}
              />
            </>
          }
        />

        <div className="px-6 pt-3">
          <FilterAndListWrapper
          groupId={groupId}
          currentSort={validSort}
            listContent={
            <section>
              {!entries?.length ? (
                <div className="flex flex-col items-center p-8 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-foreground">
                    Nessun evento ancora
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary">
                    Aggiungine uno con il pulsante in basso.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {(() => {
                    const entriesWithRating = entries.filter((e) => ratingByEntry[e.id] != null);
                    const maxRating =
                      entriesWithRating.length > 0
                        ? Math.max(...entriesWithRating.map((e) => ratingByEntry[e.id]!))
                        : null;
                    const highestRatedEntryId =
                      maxRating != null
                        ? entriesWithRating.find((e) => ratingByEntry[e.id] === maxRating)?.id ?? null
                        : null;
                    return entries.map((e) => {
                const rating = ratingByEntry[e.id];
                const participantList = participantsByEntry[e.id] ?? [];
                const imageUrl = firstPhotoUrlByEntry[e.id];
                const isHome = e.type === "HOME";
                const creatorId = (e as { created_by?: string | null }).created_by ?? null;
                const isHighestRated = highestRatedEntryId === e.id;
                const extraCount = participantList.length > 3 ? participantList.length - 3 : 0;

                return (
                  <li key={e.id}>
                    <Link
                      href={`/entry/${e.id}`}
                      className="block overflow-hidden rounded-xl bg-surface shadow-sm transition hover:shadow-md"
                    >
                      <div className="relative aspect-[3/1] w-full bg-avatar-member-bg">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Image
                            src={PLACEHOLDER_EVENT_IMAGE}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 672px"
                          />
                        )}
                        <span
                          className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white ${
                            isHome ? "bg-accent" : "bg-gray-600"
                          }`}
                        >
                          {isHome ? "CASA" : "FUORI"}
                        </span>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h2 className="min-w-0 flex-1 text-base font-bold text-foreground">
                            {e.title}
                          </h2>
                          {rating != null && (
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                                rating >= 9
                                  ? "bg-amber-500 text-amber-950"
                                  : rating >= 7
                                    ? "bg-amber-400 text-amber-900"
                                    : rating >= 5
                                      ? "bg-amber-300 text-amber-800"
                                      : "bg-amber-200 text-amber-800"
                              }`}
                              aria-label={`Voto: ${rating.toFixed(1)}`}
                            >
                              {rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-text-tertiary">
                          {formatEventDateOnly(e.happened_at)}
                        </p>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center">
                            {participantList.slice(0, 3).map((part, i) => {
                              const isCreator = creatorId != null && part.userId === creatorId;
                              return (
                                <span
                                  key={`${e.id}-${i}-${part.userId}`}
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-surface text-xs font-medium first:ml-0 -ml-2 ${
                                    isCreator
                                      ? "bg-amber-400/90 text-amber-950 z-10"
                                      : "bg-avatar-member-bg text-brand"
                                  }`}
                                  title={isCreator ? "Creatore dell'evento" : undefined}
                                >
                                  {part.avatarUrl ? (
                                    <img src={part.avatarUrl} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    part.initials
                                  )}
                                </span>
                              );
                            })}
                            {extraCount > 0 && (
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-surface bg-accent -ml-2 text-xs font-semibold text-accent-foreground">
                                +{extraCount}
                              </span>
                            )}
                          </div>
                          {isHighestRated && (
                            <span
                              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-500"
                              title="Punteggio più alto"
                              aria-label="Evento con il voto più alto"
                            >
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                              Top
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
                  });
                  })()}
                </ul>
              )}
            </section>
          }
        />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10 flex justify-center px-4 py-4">
        <Link
          href={`/group/${groupId}/new`}
          className="flex items-center justify-center gap-3 rounded-full bg-accent px-8 py-4 text-base font-semibold text-accent-foreground shadow-lg transition hover:opacity-90"
          aria-label="Aggiungi evento"
        >
          <span className="text-xl leading-none" aria-hidden>+</span>
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Aggiungi evento
        </Link>
      </div>
    </main>
  );
}
