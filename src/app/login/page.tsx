import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { SignInButtons } from "@/components/auth/sign-in-buttons";
import { isSupabaseConfigured } from "@/utils/supabase/server";
import { getCurrentUser } from "@/utils/supabase/auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Binary Semaphore.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/login" },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Already signed in? Skip the login screen.
  if (await getCurrentUser()) redirect("/account");
  const { error } = await searchParams;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12">
      {/* soft brand wash behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-1/2"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, color-mix(in srgb, var(--accent) 10%, transparent), transparent)",
        }}
      />

      <div className="w-full max-w-md">
        <Link
          href="/"
          aria-label="Binary Semaphore home"
          className="mx-auto flex w-fit items-center gap-2.5"
        >
          <Image
            src="/brand/mark.svg"
            alt=""
            width={40}
            height={40}
            priority
            unoptimized
            className="h-9 w-9 rounded-[0.5rem] ring-1 ring-black/5 dark:ring-white/10"
          />
          <span className="font-display text-lg font-semibold tracking-tight text-foreground">
            Binary Semaphore
          </span>
        </Link>

        <div className="mt-8 rounded-panel border border-border bg-card p-8 shadow-soft sm:p-9">
          <h1 className="text-center font-display text-2xl font-semibold tracking-tight text-foreground">
            Sign in
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-center text-sm leading-6 text-muted">
            Use your developer identity to access members-only features.
          </p>

          {error ? (
            <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-center text-sm text-red-500">
              We couldn&apos;t sign you in. Please try again.
            </p>
          ) : null}

          <div className="mt-7">
            {isSupabaseConfigured() ? (
              <SignInButtons />
            ) : (
              <p className="rounded-xl border border-border bg-background p-4 text-center text-sm text-muted">
                Sign-in is not configured yet.
              </p>
            )}
          </div>

          <p className="mt-7 text-center text-xs leading-5 text-subtle">
            We only use this to sign you in. We never post on your behalf.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          <Link
            href="/"
            className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Back to binarysemaphore.com
          </Link>
        </p>
      </div>
    </main>
  );
}
