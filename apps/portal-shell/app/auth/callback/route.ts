import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const res = NextResponse.redirect(`${origin}${next}`, { status: 302 });
      res.headers.set("Cache-Control", "no-store");
      return res;
    }
  }

  const res = NextResponse.redirect(`${origin}/auth?error=auth_callback_failed`, { status: 302 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
