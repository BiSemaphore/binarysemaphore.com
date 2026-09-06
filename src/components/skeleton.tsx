/**
 * The shape of a page before its content arrives.
 *
 * A skeleton is a promise about layout, so these mirror the real pages closely.
 * A generic spinner would be less work and worse: it says "something is
 * happening" where a skeleton says "the thing you asked for is coming, and it
 * will look like this", and it stops the page jumping when the content lands.
 *
 * Deliberately no shimmer sweep. On a page that usually resolves in under a
 * second, an animated gradient draws more attention than the content it is
 * standing in for. A calm pulse is enough, and it is gated behind
 * `prefers-reduced-motion` by Tailwind's own `animate-pulse`.
 */
export function Line({ className = "" }: { className?: string }) {
  return (
    <span
      className={`block rounded bg-border/70 ${className}`}
      style={{ height: "0.7em" }}
    />
  );
}

export function Skeleton({ children }: { children: React.ReactNode }) {
  return (
    <div aria-hidden className="animate-pulse">
      {children}
    </div>
  );
}

/** A list of rows, the shape the admin lists and the tree both use. */
export function RowsSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Skeleton>
      <ul className="divide-y divide-border border-y border-border">
        {Array.from({ length: rows }, (_, i) => (
          <li
            key={i}
            className="flex items-center justify-between gap-6 py-4"
          >
            <span className="min-w-0 flex-1">
              <Line className="w-1/2" />
              <Line className="mt-2 w-1/3 opacity-60" />
            </span>
            <Line className="w-16 shrink-0 opacity-60" />
          </li>
        ))}
      </ul>
    </Skeleton>
  );
}
