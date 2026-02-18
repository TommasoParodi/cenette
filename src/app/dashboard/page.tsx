"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import LogoutButton from "./LogoutButton";

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace("/");
        return;
      }

      setEmail(user.email ?? null);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .eq("id", user.id)
        .single();

      setProfile(profileData ?? null);
      setLoading(false);
    }

    loadUser();
  }, [router]);

  if (loading) {
    return <main className="p-6">Caricamento...</main>;
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2">
        Ciao, <b>{profile?.display_name ?? email}</b>
      </p>
      <LogoutButton />
    </main>
  );
}
