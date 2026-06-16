import Link from "next/link";
import { site } from "@/lib/site";
import { Wordmark } from "@/components/wordmark";
import {
  GitHubIcon,
  InstagramIcon,
  LinkedInIcon,
  MailIcon,
} from "@/components/icons";

// Absolute hrefs so they also work from sub-pages (e.g. /threads).
const footerLinks = [
  { href: "/#features", label: "Approach" },
  { href: "/#projects", label: "Products" },
  { href: "/#team", label: "Team" },
  { href: "/threads", label: "Threads" },
  { href: "/#contact", label: "Contact" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="flex flex-col gap-8 border-t border-border py-10">
      <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
        {footerLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <Wordmark />
          <p className="mt-2 font-mono text-xs text-subtle">
            © {year} {site.wordmark}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <a
            href={`mailto:${site.email}`}
            aria-label="Email"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-card-hover hover:text-foreground"
          >
            <MailIcon className="h-[18px] w-[18px]" />
          </a>
          <a
            href={site.org}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="GitHub"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-card-hover hover:text-foreground"
          >
            <GitHubIcon className="h-[18px] w-[18px]" />
          </a>
          {site.linkedin ? (
            <a
              href={site.linkedin}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="LinkedIn"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-card-hover hover:text-foreground"
            >
              <LinkedInIcon className="h-[18px] w-[18px]" />
            </a>
          ) : null}
          {site.instagram ? (
            <a
              href={site.instagram}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Instagram"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-card-hover hover:text-foreground"
            >
              <InstagramIcon className="h-[18px] w-[18px]" />
            </a>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
