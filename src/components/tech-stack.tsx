import Image from "next/image";
import { site } from "@/lib/site";
import { SectionHeading } from "@/components/section-heading";

function ToolPill({
  slug,
  name,
  hidden = false,
}: {
  slug: string;
  name: string;
  hidden?: boolean;
}) {
  return (
    <div
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
    >
      {/* White tile keeps every logo legible in both themes (some marks are dark). */}
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
        <Image
          src={`/tech/${slug}.svg`}
          alt=""
          width={24}
          height={24}
          unoptimized
          className="h-6 w-6"
        />
      </span>
      <span className="whitespace-nowrap font-mono text-sm font-medium text-foreground">
        {name}
      </span>
    </div>
  );
}

/**
 * Tech stack: a continuous logo marquee of the tools we use (pauses on hover,
 * frozen under reduced-motion), plus the concept-level items (which have no
 * logos) shown as text chips. Used on the homepage and /services.
 */
export function TechStack({ showHeading = true }: { showHeading?: boolean }) {
  const { label, title, lead, tools, concepts } = site.techStack;
  return (
    <section id="stack" className="section scroll-mt-20">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        {showHeading ? (
          <div className="mb-8 max-w-2xl">
            <SectionHeading label={label} title={title} />
            <p className="text-lg leading-8 text-muted">{lead}</p>
          </div>
        ) : null}
      </div>

      {/* Full-bleed marquee. Items are duplicated for a seamless loop; the
          second copy is hidden from assistive tech. */}
      <div className="marquee py-2" role="group" aria-label="Technologies we use">
        <div className="marquee-track">
          {tools.map((t) => (
            <ToolPill key={t.slug} slug={t.slug} name={t.name} />
          ))}
          {tools.map((t) => (
            <ToolPill key={`${t.slug}-dup`} slug={t.slug} name={t.name} hidden />
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <ul className="mt-6 flex flex-wrap gap-2">
          {concepts.map((c) => (
            <li key={c}>
              <span className="inline-block rounded-full border border-border bg-card px-3 py-1 font-mono text-sm text-muted">
                {c}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
