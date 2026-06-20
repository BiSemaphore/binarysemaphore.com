import { site } from "@/lib/site";
import { SectionHeading } from "@/components/section-heading";

/**
 * Grouped tech stack: a short honest lead, then each capability group as a
 * labeled row of chips. Used on the homepage and the /services page.
 */
export function TechStack({ showHeading = true }: { showHeading?: boolean }) {
  const { label, title, lead, groups } = site.techStack;
  return (
    <section id="stack" className="section scroll-mt-20">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        {showHeading ? (
          <div className="mb-8 max-w-2xl">
            <SectionHeading label={label} title={title} />
            <p className="text-lg leading-8 text-muted">{lead}</p>
          </div>
        ) : null}

        <div className="border-t border-border">
          {groups.map((group) => (
            <div
              key={group.label}
              className="grid gap-3 border-b border-border py-6 sm:grid-cols-[200px_1fr] sm:gap-8"
            >
              <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-subtle">
                {group.label}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li key={item}>
                    <span className="inline-block rounded-full border border-border bg-card px-3 py-1 font-mono text-sm text-foreground">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
