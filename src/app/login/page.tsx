import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SignInButtons } from "@/components/auth/sign-in-buttons";
import { isSupabaseConfigured } from "@/utils/supabase/server";
import { getCurrentUser } from "@/utils/supabase/auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Binary Semaphore.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/login" },
};

export default async function LoginPage() {
  // Already signed in? Skip the login screen.
  if (await getCurrentUser()) redirect("/account");

  return (
    <>
      <Header />
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Sign in
          </h1>
          <p className="mt-2 text-muted">
            Sign in to access members-only features.
          </p>

          <div className="mt-8">
            {isSupabaseConfigured() ? (
              <SignInButtons />
            ) : (
              <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted">
                Sign-in is not configured yet.
              </p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
