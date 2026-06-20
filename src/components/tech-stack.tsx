import Image from "next/image";
import { site } from "@/lib/site";
import { SectionHeading } from "@/components/section-heading";

/**
 * Tech stack: a wall of larger logos shown faded + grayscale, each returning to
 * its own color on hover. Concept-level items (no logos) sit below as text
 * chips. Used on the homepage and /services.
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

        <div className="flex flex-wrap items-center gap-x-9 gap-y-8">
          {tools.map((tool) => (
            <Image
              key={tool.slug}
              src={`/tech/${tool.slug}.svg`}
              alt={tool.name}
              title={tool.name}
              width={48}
              height={48}
              unoptimized
              className="h-10 w-10 opacity-55 grayscale transition duration-300 ease-out hover:scale-110 hover:opacity-100 hover:grayscale-0 sm:h-12 sm:w-12"
            />
          ))}
        </div>

        <ul className="mt-10 flex flex-wrap gap-2">
          {concepts.map((concept) => (
            <li key={concept}>
              <span className="inline-block rounded-full border border-border px-3 py-1 font-mono text-sm text-subtle">
                {concept}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
