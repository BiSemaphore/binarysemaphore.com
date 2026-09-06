"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * The route error boundary.
 *
 * Every route under `src/app` had none, so any throw in a server component fell
 * through to Next's default screen: unbranded, no way back, and nothing logged.
 *
 * Must be a client component; that is a framework requirement, not a choice.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is the only handle on the server-side stack, which is not sent
    // to the browser. Without logging it here there is nothing to correlate a
    // report against.
    console.error("Route error", {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-subtle">
        Something broke
      </p>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        That did not work.
      </h1>
      <p className="mt-5 leading-7 text-muted">
        The error is on our side, not yours. Trying again is worth a go, since
        plenty of these are transient.
      </p>

      {error.digest ? (
        <p className="mt-6 font-mono text-xs text-subtle">
          Reference: {error.digest}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-transform duration-300 hover:-translate-y-0.5"
        >
          Try again
        </button>
        <Link
          href="/"
          className="text-sm font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
