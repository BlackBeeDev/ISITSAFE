import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * OAuth callback. After Google sign-in, Supabase redirects the browser here
 * with a code query param, which we exchange for a session cookie before
 * sending the user on to their destination.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const providerError =
    searchParams.get("error_description") ??
    searchParams.get("error_code") ??
    searchParams.get("error");

  const rawNext = searchParams.get("next") ?? "/";
  const next = /^\/(?!\/|\\)/.test(rawNext) ? rawNext : "/";

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const base = (
    forwardedHost ? `${forwardedProto}://${forwardedHost}` : origin
  ).replace(/\/$/, "");

  if (providerError) {
    return redirectWithAuthError(base, providerError);
  }

  if (code) {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, base));
    }

    console.error("Supabase auth callback failed", error.message);
    return redirectWithAuthError(base, error.message);
  }

  return redirectWithAuthError(base, "Missing OAuth code");
}

function redirectWithAuthError(base: string, message: string) {
  const url = new URL("/", base);
  url.searchParams.set("auth_error", message);
  return NextResponse.redirect(url);
}
