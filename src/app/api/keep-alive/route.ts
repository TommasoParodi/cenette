import "server-only";

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase keep-alive is missing its Supabase configuration");
    return NextResponse.json(
      { ok: false, error: "Supabase keep-alive failed" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { error } = await supabase.from("groups").select("id").limit(1);

  if (error) {
    console.error("Supabase keep-alive query failed", error);
    return NextResponse.json(
      { ok: false, error: "Supabase keep-alive failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Supabase keep-alive completed",
  });
}
