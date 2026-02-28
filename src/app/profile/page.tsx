import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAvatarPublicUrl } from "@/lib/avatar";
import { Topbar } from "@/components/Topbar";
import { HelpIcon } from "@/components/HelpIcon";
import { updateProfileDisplayName, uploadAvatar, removeAvatar } from "@/server-actions/profile";
import { AvatarUpload } from "./AvatarUpload";
import { RemoveAvatarButton } from "./RemoveAvatarButton";
import { DisplayNameForm } from "./DisplayNameForm";
import ProfileLogoutButton from "./ProfileLogoutButton";
import packageJson from "../../../package.json";

function getInitials(name: string | null | undefined, fallback: string): string {
  if (!name || !name.trim()) return fallback.slice(0, 2).toUpperCase();
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

type ProfilePageProps = {
  searchParams?: Promise<{ avatar_refresh?: string }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};

  const avatarRefreshCookie = (await cookies()).get("avatar_refresh")?.value ?? null;

  // Prova con avatar_updated_at (cache busting); se la colonna non esiste, usa query/cookie
  let profile: { id: string; display_name: string | null; avatar_url: string | null; avatar_updated_at?: string | null } | null = null;
  let avatarPublicUrl: string | null = null;

  const { data: profileWithTimestamp, error: errWithTs } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, avatar_updated_at")
    .eq("id", user.id)
    .single();

  if (!errWithTs && profileWithTimestamp) {
    profile = profileWithTimestamp;
    const timestampForUrl =
      profile.avatar_updated_at ??
      resolvedSearchParams.avatar_refresh ??
      avatarRefreshCookie ??
      null;
    avatarPublicUrl = getAvatarPublicUrl(profile.avatar_url ?? null, timestampForUrl);
  } else {
    const { data: profileFallback } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("id", user.id)
      .single();
    if (profileFallback) {
      profile = profileFallback;
      const timestampForUrl =
        resolvedSearchParams.avatar_refresh ?? avatarRefreshCookie ?? null;
      avatarPublicUrl = getAvatarPublicUrl(profile.avatar_url ?? null, timestampForUrl);
    }
  }

  const displayName = profile?.display_name ?? user.email ?? "";
  const initials = getInitials(displayName, "?");

  return (
    <main className="flex h-[100dvh] flex-col overflow-y-auto pb-24">
      <div className="mx-auto w-full max-w-2xl">
        <Topbar
          title="Profilo"
          showBack
          backHref="/dashboard"
          right={
            <Link
              href="/dashboard/come-funziona"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-brand text-brand transition hover:opacity-90"
              aria-label="Come funziona l'app"
            >
              <HelpIcon className="h-6 w-6" />
            </Link>
          }
        />
        <div className="px-6 pt-6">
          <section className="flex flex-col items-center gap-6">
          {/* Avatar cliccabile per caricare immagine */}
          <AvatarUpload
            avatarSignedUrl={avatarPublicUrl}
            initials={initials}
            uploadAvatar={uploadAvatar}
          />
          {profile?.avatar_url ? (
            <RemoveAvatarButton removeAvatar={removeAvatar} />
          ) : null}

          <p className="text-lg font-medium text-foreground">
            {displayName || "Utente"}
          </p>
          {user.email ? (
            <p className="text-sm text-text-secondary">{user.email}</p>
          ) : null}

          {/* Form nome */}
          <div className="w-full max-w-sm rounded-2xl border border-card-border bg-surface p-4 shadow-card">
            <h2 className="mb-3 text-sm font-medium text-foreground">
              Nome visualizzato
            </h2>
            <DisplayNameForm
              initialDisplayName={profile?.display_name ?? null}
              updateProfileDisplayName={updateProfileDisplayName}
            />
          </div>

          <ProfileLogoutButton />

          <p className="text-xs text-text-tertiary" aria-label="Versione app">
            Versione {packageJson.version}
          </p>
          <p className="text-xs text-text-tertiary">
            <Link href="/termini" className="text-accent hover:underline">
              Termini e Condizioni
            </Link>
          </p>
          </section>
        </div>
      </div>
    </main>
  );
}
