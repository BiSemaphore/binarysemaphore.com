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

        <nav className="flex items-center gap-5 sm:gap-7">
          {/* Plain nav links with an animated underline on hover. */}
          <ul className="hidden items-center gap-7 sm:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group/nav relative text-sm font-medium text-white/70 transition-colors hover:text-white"
                >
                  {link.label}
                  <span className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-coral transition-transform duration-200 group-hover/nav:scale-x-100" />
                </Link>
              </li>
            ))}
          </ul>

          <ThemeToggle className="border-white/15 text-white/70 hover:bg-white/10 hover:text-white" />

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
