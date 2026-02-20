import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AuthForm } from "./AuthForm";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background font-sans">
      <header className="mb-8 flex flex-col items-center text-center">
        <h1
          className="text-4xl font-semibold tracking-tight text-brand"
          style={{ fontFamily: "var(--font-playfair), serif" }}
        >
          Cenette
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Ricorda le cene più belle
        </p>
      </header>
      <AuthForm />
    </main>
  );
}
