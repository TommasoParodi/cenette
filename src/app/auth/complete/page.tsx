"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCompletePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-separator-line border-t-accent" aria-hidden />
    </div>
  );
}
