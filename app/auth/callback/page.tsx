"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase/client";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Supabase salva la sessione automaticamente nel browser
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
      else router.replace("/");
    });
  }, [router]);

  return <p className="p-6">Signing you in...</p>;
}
