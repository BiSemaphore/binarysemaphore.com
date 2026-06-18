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
    "text-sm text-white/60 transition-colors duration-300 hover:text-white";
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
    <footer className="bg-band text-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-10">
      <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        {/* Brand column */}
        <div>
          <Wordmark forceDark />
          <p className="mt-4 max-w-xs text-sm leading-6 text-white/60">
            {site.tagline}
          </p>
          <div className="mt-5 flex items-center gap-1">
            <a
              href={`mailto:${site.email}`}
              aria-label="Email"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors duration-300 hover:bg-white/10 hover:text-white"
            >
              <MailIcon className="h-[18px] w-[18px]" />
            </a>
            <a
              href={site.org}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="GitHub"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors duration-300 hover:bg-white/10 hover:text-white"
            >
              <GitHubIcon className="h-[18px] w-[18px]" />
            </a>
            {site.linkedin ? (
              <a
                href={site.linkedin}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="LinkedIn"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors duration-300 hover:bg-white/10 hover:text-white"
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors duration-300 hover:bg-white/10 hover:text-white"
              >
                <InstagramIcon className="h-[18px] w-[18px]" />
              </a>
            ) : null}
          </div>
        </div>

        {/* Link columns */}
        {site.footerColumns.map((col) => (
          <div key={col.title}>
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
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

      <p className="mt-12 border-t border-white/10 pt-6 font-mono text-xs text-white/40">
        © {year} {site.wordmark}
      </p>
      </div>

      {/* Oversized brand wordmark, in the current "big footer type" style. */}
      <div aria-hidden className="overflow-hidden px-2 pb-3 pt-2 sm:pb-5">
        <div className="whitespace-nowrap text-center font-display text-[12.5vw] font-semibold leading-[0.9] tracking-[-0.04em] text-white/[0.08]">
          {site.wordmark}
        </div>
      </div>
    </footer>
  );
}
