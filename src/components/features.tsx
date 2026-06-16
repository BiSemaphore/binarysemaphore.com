import { site } from "@/lib/site";
import { Reveal } from "@/components/reveal";

/**
 * Superlist-style feature panels: alternating, softly color-tinted blocks with
 * a big headline + copy on one side and a bold color tile on the other. Each
 * feature gets a color from the candy palette.
 */
const palette = [
  { tile: "var(--coral)", ink: "#fff" },
  { tile: "var(--blue)", ink: "#fff" },
  { tile: "var(--lime)", ink: "var(--foreground)" },
  { tile: "var(--violet)", ink: "#fff" },
];

export function Features() {
  return (
    <section id="features" className="section scroll-mt-20">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        {/* Centered intro */}
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
            How we work
          </p>
          <h2 className="text-4xl text-foreground sm:text-5xl">
            From brainstorm to <span className="text-gradient">production</span>
          </h2>
        </div>

        <div className="flex flex-col gap-6 lg:gap-8">
          {site.features.map((feature, i) => {
            const c = palette[i % palette.length];
            const flip = i % 2 === 1;
            return (
              <Reveal key={feature.title} delay={(i % 2) * 80}>
                <div
                  className="grid items-center gap-8 rounded-panel border border-border bg-card p-7 shadow-soft sm:p-10 lg:grid-cols-2 lg:gap-12 lg:p-12"
                  style={{
                    backgroundColor: `color-mix(in oklab, ${c.tile} 7%, var(--card))`,
                  }}
                >
                {/* Copy */}
                <div className={flip ? "lg:order-last" : undefined}>
                  <span
                    className="mb-5 inline-flex h-9 items-center rounded-full px-3.5 font-mono text-sm font-semibold"
                    style={{ backgroundColor: c.tile, color: c.ink }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mb-3 text-2xl text-foreground sm:text-3xl">
                    {feature.title}
                  </h3>
                  <p className="max-w-md text-base leading-7 text-muted">
                    {feature.body}
                  </p>
                </div>

                {/* Bold color tile */}
                <div
                  className="relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-card"
                  style={{ backgroundColor: c.tile }}
                >
                  {/* halftone dots over the tile */}
                  <div
                    aria-hidden
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        "radial-gradient(currentColor 1.5px, transparent 1.5px)",
                      backgroundSize: "20px 20px",
                      color: c.ink,
                    }}
                  />
                  <span
                    className="font-display text-7xl font-extrabold sm:text-8xl"
                    style={{ color: c.ink }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
