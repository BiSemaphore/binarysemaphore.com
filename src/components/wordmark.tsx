import Image from "next/image";
import { site } from "@/lib/site";

/**
 * Official Binary Semaphore lockup. The brand mark already carries the nod to
 * the concurrency primitive — the accent dot is the semaphore's held state.
 * Light/dark variants are swapped via CSS so the wordmark stays legible.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <Image
        src="/brand/logo.svg"
        alt={site.wordmark}
        width={138}
        height={20}
        priority
        unoptimized
        className="h-5 w-auto dark:hidden"
      />
      <Image
        src="/brand/logo-dark.svg"
        alt={site.wordmark}
        width={138}
        height={20}
        priority
        unoptimized
        className="hidden h-5 w-auto dark:block"
      />
    </span>
  );
}
