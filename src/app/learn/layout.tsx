import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { ThemeToggle } from "@/components/theme-toggle";
import { DiscordIcon } from "@/components/icons";
import { getCurrentUser } from "@/utils/supabase/auth";
import { learnBase } from "@/lib/learn/paths";
import { site } from "@/lib/site";

const APEX = "https://binarysemaphore.com";

export const metadata: Metadata = {
  title: {
    default: "Study Notebooks",
    template: "%s · Learn",
  },
  description:
    "Printed study manuals on backend and systems engineering. One book, one question, worked properly.",
};

/**
 * Chrome for learn.binarysemaphore.com. Unlike the resume product, this keeps
 * the Binary Semaphore canvas: the notebooks are the studio's own writing, so
 * they should look like it.
 */
export default async function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, base] = await Promise.all([getCurrentUser(), learnBase()]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <a href={APEX} aria-label="Binary Semaphore home" className="shrink-0">
              <Wordmark textClassName="max-sm:hidden" />
            </a>
            {/* The wordmark is an SVG (viewBox "0 0 1036.28 150") whose text
                baseline sits at y=103.6, i.e. 69% down, so at h-[18px] its
                baseline is ~3.4px below the box centre. Mono text at this size
                puts its own baseline ~5px below centre, so plain items-center
                leaves "/ learn" sitting about 1.5px low against the lockup.
                Nudge the pair back up so the baselines read as one line. */}
            <span className="flex -translate-y-[1.5px] items-center gap-2">
              <span aria-hidden className="select-none text-subtle/70">
                /
              </span>
              <Link
                href={base || "/"}
                className="font-mono text-sm font-medium leading-none text-foreground"
              >
                learn
              </Link>
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <ThemeToggle />
            {user ? (
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="rounded-full border border-border px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:text-foreground"
                >
                  sign out
                </button>
              </form>
            ) : (
              <Link
                href={`${base}/login`}
                className="rounded-full bg-foreground px-3.5 py-1.5 font-mono text-xs text-background transition-opacity hover:opacity-90"
              >
                sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <p className="font-mono text-xs text-subtle">
            {"// study notebooks · by "}
            <a
              href={APEX}
              className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              binary semaphore
            </a>
          </p>

          {site.discord ? (
            <a
              href="/discord"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-mono text-xs text-muted transition-colors hover:text-foreground"
            >
              <DiscordIcon className="h-4 w-4" />
              discord
            </a>
          ) : null}
        </div>
      </footer>
    </div>
  );
}
