const APEX = "https://binarysemaphore.com";

/** Thin footer for the resume app. */
export function AppFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-6 text-sm text-subtle">
        <p className="font-mono text-xs">
          © {year} Resume, by{" "}
          <a
            href={APEX}
            className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Binary Semaphore
          </a>
        </p>
        <p className="font-mono text-xs">Runs on your account. Yours to export.</p>
      </div>
    </footer>
  );
}
