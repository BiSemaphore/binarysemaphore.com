"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { GitHubIcon, GoogleIcon } from "@/components/icons";

type Provider = "github" | "google";

const buttonClass =
  "inline-flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-card-hover disabled:opacity-60";

export function SignInButtons({ next = "/account" }: { next?: string }) {
  const [loading, setLoading] = useState<Provider | null>(null);

  async function signIn(provider: Provider) {
    setLoading(provider);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    // On success the browser is redirected to the provider; only reset on error.
    if (error) setLoading(null);
  }

  return (
    <div className="grid gap-3">
      <button
        type="button"
        onClick={() => signIn("github")}
        disabled={loading !== null}
        className={buttonClass}
      >
        <GitHubIcon className="h-5 w-5" />
        {loading === "github" ? "Redirecting…" : "Continue with GitHub"}
      </button>
      <button
        type="button"
        onClick={() => signIn("google")}
        disabled={loading !== null}
        className={buttonClass}
      >
        <GoogleIcon className="h-5 w-5" />
        {loading === "google" ? "Redirecting…" : "Continue with Google"}
      </button>
    </div>
  );
}
