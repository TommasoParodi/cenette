import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const REPLACE_HTML = (target: string) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><script>window.location.replace(${JSON.stringify(target)});</script><p>Reindirizzamento…</p></body></html>`;

function safeRedirectPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const target = safeRedirectPath(requestUrl.searchParams.get("next"));

  const response = new NextResponse(REPLACE_HTML(target), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

  if (code) {
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
              response.cookies.set(name, value, {
                path: "/",
                ...(options && typeof options === "object" ? options : {}),
              });
            });
          },
        },
      }
    );

    await supabase.auth.exchangeCodeForSession(code);
  }

  return response;
}
