import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/server";

const PUBLIC_PATHS = ["/auth"];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  // Must run the Supabase middleware client on every request to refresh the
  // session cookie. Without this the token expires and the user is logged out.
  const supabase = createSupabaseMiddlewareClient(request, response);

  // getUser() re-validates the JWT with Supabase servers — more secure than
  // getSession() which trusts the cookie value directly.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!user && !isPublic) {
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("next", pathname);
    const res = NextResponse.redirect(loginUrl, { status: 302 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  // Redirect already-authenticated users away from the login page
  if (user && pathname.startsWith("/auth") && !pathname.startsWith("/auth/callback")) {
    const res = NextResponse.redirect(new URL("/", request.url), { status: 302 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  // IMPORTANT: return the response object that carries refreshed cookie headers
  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)",
  ],
};
