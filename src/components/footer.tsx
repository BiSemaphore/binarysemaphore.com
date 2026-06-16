import Link from "next/link";
import { site } from "@/lib/site";
import { Wordmark } from "@/components/wordmark";
import {
  GitHubIcon,
  InstagramIcon,
  LinkedInIcon,
  MailIcon,
} from "@/components/icons";

function FooterLink({ href, label }: { href: string; label: string }) {
  const external = /^https?:\/\//.test(href);
  const className =
    "text-sm text-muted transition-colors hover:text-foreground";
  return external ? (
    <a href={href} target="_blank" rel="noreferrer noopener" className={className}>
      {label}
    </a>
  ) : (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border py-12">
      <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        {/* Brand column */}
        <div>
          <Wordmark />
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted">
            {site.tagline}
          </p>
          <div className="mt-5 flex items-center gap-1">
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

        {/* Link columns */}
        {site.footerColumns.map((col) => (
          <div key={col.title}>
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-subtle">
              {col.title}
            </h3>
            <ul className="mt-4 space-y-3">
              {col.links.map((link) => (
                <li key={link.href + link.label}>
                  <FooterLink href={link.href} label={link.label} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-12 border-t border-border pt-6 font-mono text-xs text-subtle">
        © {year} {site.wordmark}
      </p>
    </footer>
  );
}
