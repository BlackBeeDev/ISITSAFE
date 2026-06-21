"use client";

import { useEffect, useMemo, useState } from "react";
import { LogIn, LogOut, UserRound } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

/**
 * Whether Supabase auth is configured in this environment. When the public env
 * vars are missing we fall back to a disabled button so the nav never crashes
 * (e.g. a teammate who pulls the repo without credentials).
 */
const isConfigured =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/**
 * Login control for the nav. Shows "Log in" (Google OAuth) when signed out and
 * the signed-in user plus a "Sign out" button when signed in. All auth logic is
 * isolated here so the shared `site-nav` only renders <AuthButton />.
 */
export function AuthButton() {
  // One memoized client per mount — avoids "Multiple GoTrueClient instances".
  const supabase = useMemo(
    () => (isConfigured ? createSupabaseBrowserClient() : null),
    []
  );
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isConfigured);
  const [authError, setAuthError] = useState(false);

  // Surface (and clear) the `?auth_error=1` flag the callback sets when the
  // OAuth exchange fails, so a failed login isn't silent and the flag doesn't
  // linger in a shareable URL.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has("auth_error")) return;
    setAuthError(true);
    params.delete("auth_error");
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (qs ? `?${qs}` : "")
    );
  }, []);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  // Supabase not configured — render the original disabled button.
  if (!supabase) {
    return (
      <button
        type="button"
        title="Sign-in not configured"
        className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white opacity-90 transition hover:bg-brand-800"
      >
        <LogIn className="h-4 w-4" />
        Log in
      </button>
    );
  }

  async function signIn() {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    // Optimistic update; the onAuthStateChange listener also fires SIGNED_OUT.
    setUser(null);
  }

  if (loading) {
    return (
      <div
        className="h-9 w-24 animate-pulse rounded-lg bg-slate-200"
        aria-hidden
      />
    );
  }

  if (user) {
    const name =
      (user.user_metadata?.full_name as string | undefined) ??
      user.email ??
      "Account";
    // Google sets the profile photo on `avatar_url` (sometimes `picture`).
    const avatarUrl =
      (user.user_metadata?.avatar_url as string | undefined) ??
      (user.user_metadata?.picture as string | undefined);
    return (
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={name}
            title={name}
            referrerPolicy="no-referrer"
            className="h-9 w-9 rounded-full border border-slate-200 object-cover"
          />
        ) : (
          <span
            title={name}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-600"
          >
            <UserRound className="h-5 w-5" />
          </span>
        )}
        <button
          type="button"
          onClick={signOut}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {authError && (
        <span className="hidden text-sm font-medium text-red-600 sm:block">
          Sign-in failed — try again.
        </span>
      )}
      <button
        type="button"
        onClick={signIn}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
      >
        <LogIn className="h-4 w-4" />
        Log in
      </button>
    </div>
  );
}
