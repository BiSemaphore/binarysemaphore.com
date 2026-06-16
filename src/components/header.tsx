import Link from "next/link";
import { site } from "@/lib/site";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";

// Absolute hrefs so the links also work from sub-pages (e.g. /projects/inode).
const navLinks = [
  { href: "/#features", label: "Approach" },
  { href: "/#projects", label: "Products" },
  { href: "/#team", label: "Team" },
  { href: "/threads", label: "Threads" },
  { href: "/#contact", label: "Contact" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between px-6 py-3 lg:px-10">
        <Link href="/" className="rounded-full" aria-label="Binary Semaphore — home">
          <Wordmark />
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          {/* Pill-grouped nav links */}
          <ul className="hidden items-center gap-1 rounded-full border border-border bg-card/70 p-1 sm:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-full px-3.5 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-card-hover hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <ThemeToggle />

          {/* Prominent primary CTA */}
          <Link
            href={site.hero.primary.href}
            className="inline-flex items-center rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-soft transition-transform hover:-translate-y-0.5"
          >
            {site.hero.primary.label}
          </Link>
        </nav>
      </div>
    </header>
  );
}
