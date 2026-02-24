import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AuthForm } from "./AuthForm";
import packageJson from "../../package.json";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex h-[100dvh] flex-col items-center justify-center overflow-y-auto bg-background font-sans px-4">
      <AuthForm />
      <p className="mt-6 mb-8 text-center text-sm text-text-tertiary">
        Versione {packageJson.version}
      </p>
    </main>
  );
}
