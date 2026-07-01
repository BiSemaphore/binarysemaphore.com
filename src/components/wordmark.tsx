import Image from "next/image";
import { site } from "@/lib/site";

/**
 * Official Binary Semaphore lockup: the monogram tile (the "b." mark, where the
 * accent dot is the semaphore's held state) next to the wordmark. The tile is a
 * self-contained badge that stays navy in both themes; the wordmark text swaps
 * light/dark variants via CSS so it stays legible.
 */
export function Wordmark({
  className = "",
  forceDark = false,
  textClassName = "",
}: {
  className?: string;
  /** Always use the light-colored logo (for placing on a dark surface). */
  forceDark?: boolean;
  /** Extra classes on the wordmark-text wrapper (e.g. `max-sm:hidden` to show
   * only the "b." mark on small screens). Doesn't affect the mark tile. */
  textClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src="/brand/mark.svg"
        alt=""
        aria-hidden
        width={28}
        height={28}
        priority
        unoptimized
        className="h-7 w-7 rounded-[0.45rem] ring-1 ring-black/5 dark:ring-white/10"
      />
      <span className={`inline-flex items-center ${textClassName}`}>
        {forceDark ? (
          <Image
            src="/brand/logo-dark.svg"
            alt={site.wordmark}
            width={138}
            height={20}
            priority
            unoptimized
            className="h-[18px] w-auto"
          />
        ) : (
          <>
            <Image
              src="/brand/logo.svg"
              alt={site.wordmark}
              width={138}
              height={20}
              priority
              unoptimized
              className="h-[18px] w-auto dark:hidden"
            />
            <Image
              src="/brand/logo-dark.svg"
              alt={site.wordmark}
              width={138}
              height={20}
              priority
              unoptimized
              className="hidden h-[18px] w-auto dark:block"
            />
          </>
        )}
      </span>
    </span>
  );
}
