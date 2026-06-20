import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getCurrentUser } from "@/utils/supabase/auth";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
  alternates: { canonical: "/account" },
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const meta = user.user_metadata ?? {};
  const name = (meta.full_name as string) || (meta.name as string) || user.email;
  const provider = user.app_metadata?.provider;

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-20">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
          Account
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
          You&apos;re signed in
        </h1>

        <div className="mt-8 rounded-panel border border-border bg-card p-6 shadow-soft">
          <div className="font-medium text-foreground">{name}</div>
          <div className="mt-1 text-sm text-muted">{user.email}</div>
          {provider ? (
            <div className="mt-2 font-mono text-xs text-subtle">
              signed in via {provider}
            </div>
          ) : null}
        </div>

        <p className="mt-8 max-w-xl leading-7 text-muted">
          This is a members-only page. It exists as the pattern for gating
          features behind sign-in: any page can call <code>getCurrentUser()</code>{" "}
          and redirect to <code>/login</code> when there is no session.
        </p>

        <form action="/auth/signout" method="post" className="mt-8">
          <button
            type="submit"
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-card-hover"
          >
            Sign out
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
}
