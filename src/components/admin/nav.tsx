"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The admin's own navigation.
 *
 * A client component for one reason: the active item. Without it every page
 * looked identical in the sidebar, so the only way to know where you were was
 * to read the heading. That is the cheapest orientation fix there is and it was
 * missing.
 *
 * `aria-current="page"` carries the same information for a screen reader, since
 * the visual marker is a rule and a weight change.
 */
export function AdminNav({
  base,
  items,
}: {
  base: string;
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();

  // On the subdomain the base is "" and the overview is "/". Everywhere else it
  // is "/admin". Comparing the resolved href keeps one rule for both.
  const overview = `${base}/`;

  return (
    <nav className="mt-6 flex flex-wrap gap-x-1 gap-y-0.5 lg:flex-col">
      {items.map((item) => {
        const active =
          item.href === overview
            ? pathname === overview || pathname === base || pathname === "/admin"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`-ml-3 rounded-lg border-l-2 px-3 py-1.5 text-sm transition-colors ${
              active
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
