import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRightIcon } from "@/components/icons";

/*
 * A white card resting in an off-white tray, with a footer line printed on
 * the tray below it. Neutral on purpose: the tray is the page ink mixed a few
 * percent into the background, so it reads one step off the page in both
 * themes without introducing a colour.
 */
const tray =
  "border-border bg-[color-mix(in_oklab,var(--foreground)_4%,var(--background))]";

export function TrayCard({
  href,
  internal = false,
  footer,
  children,
}: {
  href?: string;
  /** Internal routes use next/link; everything else opens in a new tab. */
  internal?: boolean;
  /** Short line printed on the tray under the card, e.g. where it lives. */
  footer: ReactNode;
  children: ReactNode;
}) {
  const body = (
    <div
      className={`flex h-full flex-col rounded-[1.75rem] border p-1.5 pb-0 shadow-soft transition-shadow duration-300 group-hover:shadow-lg ${tray}`}
    >
      <div className="flex flex-1 flex-col rounded-[1.4rem] border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_20px_-8px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out motion-safe:group-hover:-translate-y-1.5 motion-safe:group-hover:-rotate-1">
        {children}
      </div>
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 text-xs font-medium tracking-wide text-subtle transition-colors duration-300 group-hover:text-foreground">
        <span className="min-w-0 truncate">{footer}</span>
        {href ? (
          <ArrowUpRightIcon className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5" />
        ) : null}
      </div>
    </div>
  );

  const wrap =
    "group block h-full min-w-0 rounded-[1.75rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

  if (!href) return <div className="h-full">{body}</div>;
  return internal ? (
    <Link href={href} className={wrap}>
      {body}
    </Link>
  ) : (
    <a href={href} target="_blank" rel="noreferrer noopener" className={wrap}>
      {body}
    </a>
  );
}

/** The initial-letter tile standing in for a logo. */
export function CardTile({ label }: { label: string }) {
  return (
    <span
      aria-hidden
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-display text-base font-bold text-foreground ring-1 ring-inset ring-border ${tray}`}
    >
      {label.trim()[0]?.toUpperCase()}
    </span>
  );
}

/** Small tag chip. */
export function CardChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
      {children}
    </span>
  );
}
