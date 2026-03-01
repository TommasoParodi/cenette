import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const REPLACE_HTML = (target: string) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><script>window.location.replace(${JSON.stringify(target)});</script><p>Reindirizzamento…</p></body></html>`;

export async function POST(request: NextRequest) {
  const target = "/";
  const response = new NextResponse(REPLACE_HTML(target), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  await supabase.auth.signOut();

  return response;
}

