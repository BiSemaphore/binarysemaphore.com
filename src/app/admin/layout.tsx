import type { Metadata } from "next";

/**
 * Nothing under /admin is ever static.
 *
 * Every page here reads the session, so none of them can be prerendered
 * meaningfully. Next normally works that out on its own when `cookies()` is
 * called, but it cannot when the Supabase client throws on missing config
 * first: the throw happens before the dynamic API is touched, so the page looks
 * static and the build fails trying to render it. That is exactly what broke
 * the first preview deploy, on /admin/inbox.
 *
 * Saying it here is also simply true, and true is better than inferred.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

/**
 * The admin tree.
 *
 * Deliberately does NOT gate. Login and the denied page live under /admin too,
 * and a gate here would either lock people out of the login page or have to
 * special-case it by path, which is the kind of check that quietly stops
 * matching after a rename. The gate is one level down, in (workspace), where
 * every route under it needs exactly the same answer.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-dvh bg-background">{children}</div>;
}
