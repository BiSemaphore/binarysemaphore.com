import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInButtons } from "@/components/auth/sign-in-buttons";
import { isSupabaseConfigured } from "@/utils/supabase/server";
import { getCurrentUser } from "@/utils/supabase/auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to build and save your resume.",
  robots: { index: false, follow: false },
};

export default async function ResumeLoginPage() {
  // Already signed in? Go straight to the dashboard.
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="rounded-panel border border-border bg-card p-8 shadow-soft sm:p-9">
          <h1 className="text-center font-display text-2xl font-semibold tracking-tight text-foreground">
            Sign in to start
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-center text-sm leading-6 text-muted">
            Your resumes are saved to your account so you can pick up where you
            left off.
          </p>

          <div className="mt-7">
            {isSupabaseConfigured() ? (
              <SignInButtons next="/dashboard" />
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
            Back to the resume builder
          </Link>
        </p>
      </div>
    </main>
  );
}
