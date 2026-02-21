import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match tutte le richieste tranne:
     * - _next/static (file statici)
     * - _next/image (ottimizzazione immagini)
     * - favicon.ico
     * - file statici (svg, png, jpg, ecc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
