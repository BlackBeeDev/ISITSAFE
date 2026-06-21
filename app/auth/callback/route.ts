import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * OAuth callback. After Google sign-in, Supabase redirects the browser here
 * with a `code` query param, which we exchange for a session cookie before
 * sending the user on to their destination (defaults to the home page).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Only allow a same-origin relative path. This rejects //host, /\host,
  // @host, and absolute URLs, closing the open-redirect via a crafted `next`.
  const rawNext = searchParams.get("next") ?? "/";
  const next = /^\/(?!\/|\\)/.test(rawNext) ? rawNext : "/";

  // Prefer the configured public URL (mirrors getAppUrl in
  // services/email-forwarding.ts), then proxy-forwarded headers, then the
  // request origin. Keeps the post-login redirect on the real public host
  // when running behind a reverse proxy / load balancer.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ??
    (forwardedHost ? `${forwardedProto}://${forwardedHost}` : origin)
  ).replace(/\/$/, "");

  if (code) {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, base));
    }
  }

  // No code, or the exchange failed — bounce home with a flag the UI surfaces.
  return NextResponse.redirect(new URL("/?auth_error=1", base));
}
