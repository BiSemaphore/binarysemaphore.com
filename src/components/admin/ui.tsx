/**
 * The small shared pieces of the admin.
 *
 * Kept together because consistency matters more here than anywhere else on the
 * site: this is a tool someone uses for an hour at a time, and a status that
 * looks different on two pages is a status you stop trusting.
 */

export const FIELD =
  "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-subtle focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground/15 disabled:opacity-60";

export const LABEL =
  "font-mono text-[0.65rem] uppercase tracking-[0.16em] text-subtle";

export const BUTTON =
  "rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50";

export const QUIET_BUTTON =
  "rounded-xl border border-border bg-card px-3.5 py-2 text-sm text-muted transition-colors hover:bg-card-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

type Status = "draft" | "published" | "archived" | string;

/**
 * State as a shape, not only as a word.
 *
 * The lists are scanned, not read, and "published" in the same weight as
 * everything else is invisible at a glance. A dot plus a bounded pill lets you
 * find the one draft in ninety rows without reading any of them.
 *
 * The word is always present, so this never depends on colour alone.
 */
export function StatusChip({ status }: { status: Status }) {
  const tone =
    status === "published"
      ? "text-muted"
      : status === "draft"
        ? "text-foreground"
        : "text-subtle";

  const dot =
    status === "published"
      ? "bg-foreground/35"
      : status === "draft"
        ? "bg-coral"
        : "bg-subtle/50";

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-2 py-0.5 font-mono text-[0.65rem] ${tone}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      {status}
    </span>
  );
}

/** A page heading and its one line of explanation. */
export function PageHead({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="border-b border-border pb-5">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {children ? (
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">
          {children}
        </p>
      ) : null}
    </header>
  );
}

/**
 * A date a person can read.
 *
 * `toLocaleString` was printing "06/09/2026, 17:21:45", which is ambiguous
 * between British and American reading and carries seconds nobody needs.
 */
export function When({ iso }: { iso: string }) {
  const d = new Date(iso);
  return (
    <time
      dateTime={iso}
      title={d.toISOString()}
      className="whitespace-nowrap tabular-nums"
    >
      {d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}
    </time>
  );
}
