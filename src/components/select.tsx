import { ChevronDownIcon } from "@/components/icons";

/**
 * A select that looks like the rest of the site.
 *
 * There were three native selects across the admin and the resume builder, in
 * two different ad-hoc styles, and every one of them drew the operating
 * system's own chevron. That arrow is not ours: not its size, not its weight,
 * not its distance from the edge, and on macOS not even its shape. Beside a
 * button we do draw, it reads as a control borrowed from another application,
 * which is exactly what it is.
 *
 * `appearance: none` removes it. The replacement is our own icon, positioned
 * against the same edge and given the same colour as every other secondary mark
 * on the page.
 *
 * Two things that are easy to get wrong once the native chrome is gone:
 *
 * - **The icon must not eat the click.** `pointer-events-none` on the wrapper
 *   span means the whole control still opens the menu, including the arrow.
 * - **The text must not run under the icon.** The right padding is reserved for
 *   it, so a long option truncates before it collides rather than after.
 */
export function Select({
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative inline-flex items-center">
      <select
        {...props}
        className={`w-full appearance-none rounded-xl border border-border bg-card py-0 pl-3.5 pr-9 text-sm text-foreground outline-none transition-[border-color,box-shadow] focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground/15 disabled:opacity-60 ${className}`}
      >
        {children}
      </select>
      <ChevronDownIcon
        aria-hidden
        className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-subtle"
      />
    </span>
  );
}
