import type { Metadata } from "next";
import Link from "next/link";
import { figtree } from "@/lib/fonts";
import { Wordmark } from "@/components/wordmark";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentUser } from "@/utils/supabase/auth";

const APEX = "https://binarysemaphore.com";

export const metadata: Metadata = {
  title: {
    default: "Resume builder",
    template: "%s · Resume, by Binary Semaphore",
  },
  description:
    "Build a clean, professional resume from a few fields, pick a template, and export to PDF. By Binary Semaphore.",
};

/**
 * The resume product front-end (home, templates, preview, login) on the resumex
 * clone canvas: a full-page dot grid, green accent, mono chrome. Scoped to .rx
 * so the rest of the site keeps the Binary Semaphore brand. The editor has its
 * own full-bleed .rx layout.
 */
export default async function ResumeAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div
      className={`${figtree.variable} rx rx-canvas flex min-h-screen flex-col font-[family-name:var(--font-figtree)]`}
    >
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/70 backdrop-blur">
        <div className="mx-auto flex h-12 w-full max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <a
              href={APEX}
              aria-label="Binary Semaphore home"
              className="shrink-0"
            >
              <Wordmark />
            </a>
            <span aria-hidden className="text-[color:var(--rx-muted)]">
              /
            </span>
            <Link
              href="/"
              className="font-mono text-sm font-medium text-foreground"
            >
              resume
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <form action="/auth/signout" method="post">
                <button type="submit" className="rx-pill font-mono text-xs">
                  sign out
                </button>
              </form>
            ) : (
              <Link href="/login" className="rx-pill rx-accent font-mono text-xs">
                sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mx-auto w-full max-w-5xl px-5 py-8">
        <p className="font-mono text-xs text-[color:var(--rx-muted)]">
          {"// resume · by "}
          <a
            href={APEX}
            className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            binary semaphore
          </a>
        </p>
      </footer>
    </div>
  );
}
