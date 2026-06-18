import { site } from "@/lib/site";
import { Reveal } from "@/components/reveal";

/** At-a-glance facts strip under the hero. Honest facts, not vanity metrics. */
export function Stats() {
  if (site.stats.length === 0) return null;
  return (
    <section className="border-y border-border bg-card/40">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-y-8 px-6 py-12 sm:grid-cols-4 lg:px-10">
        {site.stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 60}>
            <div>
              <div className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {s.value}
              </div>
              <div className="mt-1.5 font-mono text-xs uppercase tracking-[0.15em] text-subtle">
                {s.label}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
