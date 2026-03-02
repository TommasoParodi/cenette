"use client";

import { supabase } from "@/lib/supabase/client";

export function LoginButton() {
  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        skipBrowserRedirect: true,
      },
    });
    if (error) {
      throw error;
    }
    if (data?.url) {
      window.location.replace(data.url);
      return;
    }
    throw new Error("Impossibile avviare l'accesso con Google.");
  }

  return (
    <button
      type="button"
      onClick={signInWithGoogle}
      className="rounded-full bg-black px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
    >
      Accedi con Google
    </button>
  );
}
