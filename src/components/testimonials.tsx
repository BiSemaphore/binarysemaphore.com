import { site } from "@/lib/site";
import { Reveal } from "@/components/reveal";

/**
 * Testimonials wall: quote cards in a masonry-style multi-column layout
 * (Superlist's review section). Quotes are placeholders in site.ts.
 */
const accents = ["bg-coral", "bg-blue", "bg-violet", "bg-sun"];

export function Testimonials() {
  if (site.testimonials.length === 0) return null;

  return (
    <section className="section">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
            What people say
          </p>
          <h2 className="text-4xl text-foreground sm:text-5xl">
            Worth working with
          </h2>
        </div>

        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6">
          {site.testimonials.map((t, i) => (
            <Reveal key={i} delay={(i % 3) * 70}>
              <figure className="break-inside-avoid rounded-panel border border-border bg-card p-7 shadow-soft">
                <blockquote className="text-base leading-7 text-foreground">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${accents[i % accents.length]}`}
                    aria-hidden
                  >
                    {t.name.trim()[0] ?? "?"}
                  </span>
                  <span className="text-sm">
                    <span className="block font-semibold text-foreground">
                      {t.name}
                    </span>
                    <span className="block text-muted">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
