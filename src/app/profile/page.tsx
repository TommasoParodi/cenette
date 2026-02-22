import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/Topbar";
import { updateProfileDisplayName, uploadAvatar, removeAvatar } from "@/server-actions/profile";
import { AvatarUpload } from "./AvatarUpload";
import { RemoveAvatarButton } from "./RemoveAvatarButton";
import { DisplayNameForm } from "./DisplayNameForm";

function getInitials(name: string | null | undefined, fallback: string): string {
  if (!name || !name.trim()) return fallback.slice(0, 2).toUpperCase();
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", user.id)
    .single();

  let avatarSignedUrl: string | null = null;
  if (profile?.avatar_url) {
    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrl(profile.avatar_url, 3600);
    avatarSignedUrl = signed?.signedUrl ?? null;
  }

  const displayName = profile?.display_name ?? user.email ?? "";
  const initials = getInitials(displayName, "?");

  return (
    <main className="min-h-screen p-6 pb-24">
      <div className="mx-auto max-w-2xl">
        <Topbar
          title="Profilo"
          showBack
          backHref="/dashboard"
        />

        <section className="mt-8 flex flex-col items-center gap-6">
          {/* Avatar cliccabile per caricare immagine */}
          <AvatarUpload
            avatarSignedUrl={avatarSignedUrl}
            initials={initials}
            uploadAvatar={uploadAvatar}
          />
          <p className="text-center text-sm text-text-tertiary">
            Clicca sull&apos;avatar per cambiare l&apos;immagine (JPG, PNG, WebP o GIF, max 5 MB)
          </p>
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
          <div className="w-full max-w-sm rounded-2xl border border-separator-line bg-surface p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-medium text-foreground">
              Nome visualizzato
            </h2>
            <DisplayNameForm
              initialDisplayName={profile?.display_name ?? null}
              updateProfileDisplayName={updateProfileDisplayName}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
