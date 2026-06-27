import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentUser } from "@/utils/supabase/auth";

const APEX = "https://binarysemaphore.com";

/**
 * Minimal chrome for the resume app (not the marketing nav). The logo links
 * back to the apex; the rest is app navigation. Links inside the app are
 * root-relative so they resolve on the resume subdomain.
 */
export async function AppHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <a href={APEX} aria-label="Binary Semaphore home" className="shrink-0">
            <Wordmark />
          </a>
          <span aria-hidden className="text-subtle">
            /
          </span>
          <Link
            href="/"
            className="font-mono text-sm font-medium text-foreground"
          >
            Resume
          </Link>
        </div>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-card-hover sm:inline-flex"
              >
                Dashboard
              </Link>
              <ThemeToggle />
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-card-hover"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link
                href="/login"
                className="rounded-lg bg-foreground px-4 py-1.5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
              >
                Sign in
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
