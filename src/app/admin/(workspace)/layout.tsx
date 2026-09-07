import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { adminBase } from "@/lib/admin/paths";
import { signOutAction } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/nav";

/**
 * Everything that requires being an admin.
 *
 * This check is for the person, not for the data. It stops the UI rendering for
 * someone who should not see it; it is not what stops them writing. Every write
 * policy calls `is_admin()` in the database independently, which is the only
 * reason it is safe for this file to be the friendly layer.
 */
export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  const base = await adminBase();

  const nav = [
    { href: `${base}/`, label: "Overview" },
    { href: `${base}/threads`, label: "Threads" },
    { href: `${base}/topics`, label: "Topics" },
    { href: `${base}/inbox`, label: "Inbox" },
  ];

  return (
    <div className="min-h-dvh">
      {/*
        There is no staging copy of this. Every save from here lands on the site
        people are reading, so the bar says so rather than leaving it to be
        remembered.
      */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-[1680px] items-center justify-between gap-4 px-6 py-2.5 lg:px-10">
          <span className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-coral" />
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted">
              Live
            </span>
            <span className="hidden text-xs text-subtle sm:inline">
              edits are published straight to binarysemaphore.com
            </span>
          </span>

          <a
            href="https://binarysemaphore.com"
            target="_blank"
            rel="noreferrer noopener"
            className="whitespace-nowrap text-xs text-muted underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
          >
            View the site
          </a>
        </div>
      </div>

      {/*
        Wide, because one page here genuinely needs it: the editor puts the MDX
        and its preview side by side, and at max-w-6xl each pane was about
        350px with several hundred pixels of empty screen beside it. The lists
        do not want that width, so they set their own measure rather than the
        shell imposing one on everything.
      */}
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-8 px-6 py-8 lg:flex-row lg:gap-14 lg:px-10 lg:py-10">
        <aside className="shrink-0 lg:sticky lg:top-8 lg:h-fit lg:w-48">
          <Link
            href={`${base}/`}
            className="font-display text-sm font-semibold tracking-tight text-foreground"
          >
            Binary Semaphore
          </Link>
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-subtle">
            Admin
          </p>

          <AdminNav base={base} items={nav} />

          <div className="mt-8 border-t border-border pt-4">
            <p className="truncate text-xs text-subtle" title={user.email}>
              {user.email}
            </p>
            <form action={signOutAction} className="mt-1.5">
              <button
                type="submit"
                className="rounded text-xs text-muted underline decoration-border underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
