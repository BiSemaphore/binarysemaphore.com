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
    <header className="sticky top-0 z-50 bg-[#0d0f17] text-white">
      <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between px-6 py-3 lg:px-10">
        <Link href="/" className="rounded-full" aria-label="Binary Semaphore home">
          <Wordmark forceDark />
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          {/* Pill-grouped nav links */}
          <ul className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 sm:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-full px-3.5 py-1.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <ThemeToggle className="border-white/20 text-white/70 hover:bg-white/10 hover:text-white" />

          {/* Prominent primary CTA */}
          <Link
            href={site.hero.primary.href}
            className="inline-flex items-center rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-coral/20 transition-transform hover:-translate-y-0.5"
          >
            {site.hero.primary.label}
          </Link>
        </nav>
      </div>
    </header>
  );
}
