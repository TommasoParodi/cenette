import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/Topbar";
import { EventFilterTabs, type EventFilter } from "./EventFilterTabs";
import { GroupTopbarMenu } from "./GroupTopbarMenu";
import { CopyableInviteCode } from "../CopyableInviteCode";

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

export default async function GroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { id: groupId } = await params;
  const { filter: filterParam } = await searchParams;
  const filter = (filterParam === "home" || filterParam === "out" ? filterParam : "tutti") as EventFilter;

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

  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership) notFound();

  let entriesQuery = supabase
    .from("entries")
    .select("id, title, type, happened_at, created_at")
    .eq("group_id", groupId)
    .order("happened_at", { ascending: false });

  if (filter === "home") entriesQuery = entriesQuery.eq("type", "HOME");
  if (filter === "out") entriesQuery = entriesQuery.eq("type", "OUT");

  const { data: entries } = await entriesQuery;

  const entryIds = (entries ?? []).map((e) => e.id);
  const ratingByEntry: Record<string, number> = {};
  const participantsByEntry: Record<string, string[]> = {};
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
      .select("entry_id, user_id")
      .in("entry_id", entryIds);
    const userIds = [...new Set((participants ?? []).map((p) => p.user_id))];
    const { data: profiles } =
      userIds.length > 0
        ? await supabase.from("profiles").select("id, display_name").in("id", userIds)
        : { data: null };
    const nameByUserId = new Map<string, string>();
    profiles?.forEach((p) => nameByUserId.set(p.id, p.display_name ?? "?"));
    participants?.forEach((p) => {
      if (!participantsByEntry[p.entry_id]) participantsByEntry[p.entry_id] = [];
      participantsByEntry[p.entry_id].push(
        getInitials(nameByUserId.get(p.user_id), "?")
      );
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

  return (
    <main className="min-h-screen p-6 pb-24">
      <div className="mx-auto max-w-2xl">
        <Topbar
          showBack
          backHref="/dashboard"
          title={group.name}
          right={
            <>
              <CopyableInviteCode inviteCode={group.invite_code ?? ""} />
              <GroupTopbarMenu
                groupId={groupId}
                groupName={group.name}
                isCreator={(group as { created_by?: string | null }).created_by === user.id}
              />
            </>
          }
        />

        <div className="mt-4 mb-6">
          <EventFilterTabs groupId={groupId} />
        </div>

        <section>
          {!entries?.length ? (
            <p className="rounded-2xl border border-dashed border-separator-line bg-surface p-8 text-center text-text-secondary shadow-sm">
              Nessun evento. Aggiungine uno con il pulsante in basso.
            </p>
          ) : (
            <ul className="space-y-3">
              {entries.map((e) => {
                const rating = ratingByEntry[e.id];
                const participantInitials = participantsByEntry[e.id] ?? [];
                const imageUrl = firstPhotoUrlByEntry[e.id];
                const isHome = e.type === "HOME";
                const ratingColor =
                  rating != null && rating >= 8
                    ? "bg-rating-high"
                    : rating != null
                      ? "bg-rating-medium"
                      : "bg-surface-muted";

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
                        {rating != null && (
                          <span
                            className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white ${ratingColor}`}
                          >
                            {rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <h2 className="text-sm font-semibold text-foreground">
                          {e.title}
                        </h2>
                        <div className="mt-1 flex items-center gap-1 text-xs text-text-tertiary">
                          <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatEventDate(e.happened_at)}</span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-avatar-member-bg px-2 py-0.5 text-[11px] font-medium text-foreground">
                            {isHome ? (
                              <>
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                A casa
                              </>
                            ) : (
                              <>
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Fuori
                              </>
                            )}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {participantInitials.slice(0, 4).map((init, i) => (
                              <span
                                key={`${e.id}-${i}-${init}`}
                                className="flex h-5 w-5 items-center justify-center rounded-full border border-brand bg-avatar-member-bg text-[10px] font-medium text-brand"
                              >
                                {init}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
        <Link
          href={`/group/${groupId}/new`}
          className="flex items-center justify-center gap-2 rounded-xl bg-accent-strong px-6 py-3 text-sm font-medium text-accent-foreground shadow-lg transition hover:opacity-90"
        >
          <span className="text-lg leading-none" aria-hidden>+</span>
          Aggiungi evento
        </Link>
      </div>
    </main>
  );
}
