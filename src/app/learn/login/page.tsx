import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInButtons } from "@/components/auth/sign-in-buttons";
import { isSupabaseConfigured } from "@/utils/supabase/server";
import { getCurrentUser } from "@/utils/supabase/auth";
import { learnBase } from "@/lib/learn/paths";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to open a study notebook.",
  robots: { index: false, follow: false },
};

/** Only same-origin paths are accepted, so `next` cannot bounce a signed-in
 * user off to another site. */
function safeNext(value: string | undefined, fallback: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  return value;
}

export default async function LearnLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const base = await learnBase();
  const { next } = await searchParams;
  const destination = safeNext(next, base || "/");

  if (await getCurrentUser()) redirect(destination);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="rounded-panel border border-border bg-card p-8 shadow-soft sm:p-9">
          <h1 className="text-center font-display text-2xl font-semibold tracking-tight text-foreground">
            Sign in to read
          </h1>
          <p className="mx-auto mt-2.5 max-w-xs text-center text-sm leading-6 text-muted">
            An account is all it takes, and it is what makes a download belong
            to someone.
          </p>

          <div className="mt-7">
            {isSupabaseConfigured() ? (
              <SignInButtons next={destination} />
            ) : (
              <p className="rounded-xl border border-border bg-background p-4 text-center text-sm text-muted">
                Sign-in is not configured yet.
              </p>
            )}
          </div>

          <p className="mt-7 text-center text-xs leading-5 text-subtle">
            We read your name and email from the provider, nothing else.
          </p>
        </div>
      </div>
    </main>
  );
}
