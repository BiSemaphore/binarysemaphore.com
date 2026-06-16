import { site } from "@/lib/site";
import { Reveal } from "@/components/reveal";
import { CheckIcon } from "@/components/icons";

/**
 * Dense capability grid (Superlist's "everyday superpowers" list): a wide grid
 * of short label + one-line descriptions. Driven by site.featureList.
 */
export function FeatureList() {
  if (site.featureList.length === 0) return null;

  return (
    <section className="section bg-card/40">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
            What we bring
          </p>
          <h2 className="text-4xl text-foreground sm:text-5xl">
            Fundamentals we build on
          </h2>
        </div>

        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {site.featureList.map((item, i) => (
            <Reveal key={item.label} delay={(i % 3) * 60}>
              <div className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-strong">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {item.label}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-muted">{item.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
