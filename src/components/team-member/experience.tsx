import type { Stint } from "@/lib/team";

/**
 * Work history as one card per company. Each role shows its title, period and
 * one-line summary up front; the detailed highlights sit behind a disclosure,
 * open for the most recent role only, so the page scans before it reads.
 */
export function Experience({ stints }: { stints: Stint[] }) {
  return (
    <ol className="space-y-5">
      {stints.map((stint, s) => (
        <li
          key={`${stint.company}-${s}`}
          className="rounded-panel border border-border bg-card p-6 shadow-soft sm:p-7"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 className="font-display text-xl font-bold tracking-tight text-foreground">
              {stint.company}
            </h3>
            {stint.location ? (
              <span className="text-sm text-subtle">{stint.location}</span>
            ) : null}
          </div>

          <ol
            className={`mt-5 space-y-6 ${
              stint.roles.length > 1 ? "border-l border-border pl-5" : ""
            }`}
          >
            {stint.roles.map((job, r) => (
              <li key={`${job.role}-${r}`} className="relative">
                {stint.roles.length > 1 ? (
                  <span
                    aria-hidden
                    className={`absolute -left-[1.6rem] top-2 h-2.5 w-2.5 rounded-full ring-4 ring-card ${
                      r === 0 ? "bg-accent" : "bg-border"
                    }`}
                  />
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <p className="font-semibold text-accent-strong">{job.role}</p>
                  {job.period ? (
                    <span className="rounded-full bg-background px-3 py-1 font-mono text-xs text-subtle ring-1 ring-inset ring-border">
                      {job.period}
                    </span>
                  ) : null}
                </div>
                {job.summary ? (
                  <p className="mt-2 text-[15px] leading-7 text-muted">{job.summary}</p>
                ) : null}

                {job.highlights && job.highlights.length > 0 ? (
                  <details className="group mt-3" open={s === 0 && r === 0}>
                    <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-full py-1 text-sm font-medium text-foreground transition-colors hover:text-accent-strong [&::-webkit-details-marker]:hidden">
                      <span
                        aria-hidden
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-background font-mono text-xs ring-1 ring-inset ring-border transition-transform group-open:rotate-90"
                      >
                        &rsaquo;
                      </span>
                      Highlights
                      <span className="font-mono text-xs text-subtle">
                        {job.highlights.length}
                      </span>
                    </summary>
                    <ul className="mt-3 space-y-2.5">
                      {job.highlights.map((point, j) => (
                        <li
                          key={j}
                          className="relative pl-5 text-[15px] leading-7 text-muted"
                        >
                          <span
                            aria-hidden
                            className="absolute left-0 top-[0.75em] h-1.5 w-1.5 rounded-full bg-accent/60"
                          />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}

                {job.stack && job.stack.length > 0 ? (
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {job.stack.map((tech) => (
                      <li
                        key={tech}
                        className="rounded-full bg-background px-2.5 py-1 font-mono text-[11px] text-subtle ring-1 ring-inset ring-border"
                      >
                        {tech}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  );
}
