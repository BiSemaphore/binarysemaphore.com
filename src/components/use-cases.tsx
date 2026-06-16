import { site } from "@/lib/site";
import { Reveal } from "@/components/reveal";

/**
 * Three use-case columns (Superlist's "manage your entire life" section),
 * adapted to the studio's service areas. Driven by site.capabilities.
 */
const accents = ["bg-coral", "bg-blue", "bg-violet"];

export function UseCases() {
  if (site.capabilities.length === 0) return null;

  return (
    <section className="section">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
            What we do
          </p>
          <h2 className="text-4xl text-foreground sm:text-5xl">
            One team for the hard parts of software
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {site.capabilities.map((cap, i) => (
            <Reveal key={cap.title} delay={(i % 3) * 80} className="flex">
              <div className="flex w-full flex-col rounded-panel border border-border bg-card p-8 shadow-soft">
                <span
                  className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold text-white ${accents[i % accents.length]}`}
                  aria-hidden
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-2xl text-foreground">{cap.title}</h3>
                <p className="mt-3 text-base leading-7 text-muted">{cap.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
