import type { Metadata } from "next";
import { signOutAction } from "@/app/admin/actions";
import { getCurrentUser } from "@/utils/supabase/auth";

export const metadata: Metadata = {
  title: "No access",
  robots: { index: false, follow: false },
};

/**
 * Signed in, but not an admin.
 *
 * Says so plainly rather than 404ing. Anyone who reaches this is a real
 * signed-in reader who typed a URL, and a blank 404 would read as a broken
 * site. It exposes nothing: the account already knows it exists, and the
 * database refuses every write regardless of what this page says.
 */
export default async function DeniedPage() {
  const user = await getCurrentUser();

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Not your door
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          You are signed in as{" "}
          <span className="text-foreground">{user?.email ?? "someone"}</span>,
          and that account is not an admin. Nothing is wrong with it: reading
          and the notebooks work as usual.
        </p>

        <form action={signOutAction} className="mt-8">
          <button
            type="submit"
            className="text-sm font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
