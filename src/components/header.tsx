import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";
import { ArrowUpRightIcon, ChevronDownIcon } from "@/components/icons";
import { RollText } from "@/components/roll-text";
import { MobileMenu } from "@/components/mobile-menu";
import { NavLink } from "@/components/nav-link";
import { getCurrentUser } from "@/utils/supabase/auth";

export type NavItem =
  | { type: "link"; href: string; label: string }
  | { type: "dropdown"; label: string; items: { href: string; label: string }[] };

// Company-style structure: a couple of flat links plus a grouped "Company"
// dropdown, mirroring the reference site's navbar. Absolute hrefs so links work
// from any sub-page.
export const navItems: NavItem[] = [
  { type: "link", href: "/", label: "Home" },
  {
    type: "dropdown",
    label: "Company",
    items: [
      { href: "/about", label: "About" },
      { href: "/team", label: "Team" },
      { href: "/contact", label: "Contact" },
    ],
  },
  { type: "link", href: "/services", label: "Services" },
  { type: "link", href: "/projects", label: "Products" },
  { type: "link", href: "/threads", label: "Threads" },
];

export async function Header({ linkBase = "" }: { linkBase?: string } = {}) {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="relative mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 lg:px-10">
        <NavLink
          href={`${linkBase}/`}
          className="rounded-full"
          aria-label="Binary Semaphore home"
        >
          <Wordmark />
        </NavLink>

        {/* Centered nav, like the reference's centered menu. */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 md:block">
          <ul className="flex items-center gap-8">
            {navItems.map((item) =>
              item.type === "dropdown" ? (
                <li key={item.label} className="group/dd relative">
                  <button
                    type="button"
                    aria-haspopup="menu"
                    className="roll-link inline-flex items-center gap-1 text-base font-medium text-foreground"
                  >
                    <RollText text={item.label} />
                    <ChevronDownIcon className="h-3.5 w-3.5 text-subtle transition-transform duration-200 group-hover/dd:rotate-180" />
                  </button>

                  {/* Dropdown panel (hover + keyboard focus-within). The pt-3
                      bridges the gap so hover doesn't drop. */}
                  <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 translate-y-1 pt-3 opacity-0 transition-all duration-150 group-hover/dd:visible group-hover/dd:translate-y-0 group-hover/dd:opacity-100 group-focus-within/dd:visible group-focus-within/dd:translate-y-0 group-focus-within/dd:opacity-100">
                    <ul className="min-w-44 rounded-card border border-border bg-card p-2 shadow-soft">
                      {item.items.map((sub) => (
                        <li key={sub.href}>
                          <NavLink
                            href={`${linkBase}${sub.href}`}
                            className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-hover hover:text-accent-strong"
                          >
                            {sub.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ) : (
                <li key={item.href}>
                  <NavLink
                    href={`${linkBase}${item.href}`}
                    className="roll-link text-base font-medium text-foreground"
                  >
                    <RollText text={item.label} />
                  </NavLink>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <NavLink
            href={`${linkBase}${user ? "/account" : "/login"}`}
            className="hidden text-sm font-medium text-foreground transition-colors hover:text-accent-strong md:inline-flex"
          >
            {user ? "Account" : "Sign in"}
          </NavLink>
          <ThemeToggle />
          <NavLink
            href={`${linkBase}/contact`}
            className="group hidden items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform duration-300 hover:-translate-y-0.5 md:inline-flex"
          >
            Get in touch
            <ArrowUpRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </NavLink>
          <MobileMenu items={navItems} authed={Boolean(user)} linkBase={linkBase} />
        </div>
      </div>
    </header>
  );
}
