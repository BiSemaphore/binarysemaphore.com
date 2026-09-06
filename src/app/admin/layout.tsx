import type { Metadata } from "next";

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
