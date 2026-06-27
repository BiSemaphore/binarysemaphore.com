import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

/**
 * Renders a `<Link>` for in-app (relative) hrefs and a plain `<a>` for absolute
 * URLs. Lets shared chrome (Header, MobileMenu) point links at the apex when a
 * `linkBase` is applied on a product subdomain. Mirrors `FooterLink`.
 */
export function NavLink({
  href,
  className,
  children,
  onClick,
  "aria-label": ariaLabel,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  "aria-label"?: string;
}) {
  const external = /^https?:\/\//.test(href);
  return external ? (
    <a href={href} className={className} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </a>
  ) : (
    <Link
      href={href}
      className={className}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
}
