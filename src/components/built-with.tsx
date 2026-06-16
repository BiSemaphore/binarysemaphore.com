import { site } from "@/lib/site";

/** Slim "built with" tech strip — the studio's stack in place of customer logos. */
export function BuiltWith() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-10">
      <div className="flex flex-col items-center gap-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-subtle">
          Built with
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-3">
          {site.builtWith.map((tech) => (
            <li
              key={tech}
              className="rounded-full border border-border bg-card px-4 py-1.5 font-mono text-sm font-medium text-muted shadow-soft transition-colors hover:text-foreground"
            >
              {tech}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
