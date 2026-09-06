import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { adminBase } from "@/lib/admin/paths";
import { signOutAction } from "@/app/admin/actions";

/**
 * Everything that requires being an admin.
 *
 * This check is for the person, not for the data. It stops the UI rendering
 * for someone who should not see it; it is not what stops them writing. Every
 * write policy calls `is_admin()` in the database independently, which is the
 * only reason it is safe for this file to be the friendly layer.
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 lg:flex-row lg:gap-14 lg:px-10">
      <aside className="shrink-0 lg:w-52">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-subtle">
          Admin
        </p>

        <nav className="mt-5 flex flex-wrap gap-x-5 gap-y-2 lg:flex-col lg:gap-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 border-t border-border pt-5">
          <p className="truncate text-xs text-subtle">{user.email}</p>
          <form action={signOutAction} className="mt-2">
            <button
              type="submit"
              className="text-xs text-muted underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
