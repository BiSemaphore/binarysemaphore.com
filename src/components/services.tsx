import Link from "next/link";
import { site } from "@/lib/site";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { ArrowUpRightIcon } from "@/components/icons";

/**
 * Services showcase: the areas we work in, as cards. Used on the homepage (with
 * its own heading) and on the /services page (heading off, since PageIntro
 * supplies the title + lead there).
 */
export function Services({ showHeading = true }: { showHeading?: boolean }) {
  const { label, title, lead, items } = site.services;
  return (
    <section id="services" className="section scroll-mt-20">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        {showHeading ? (
          <div className="mb-8 max-w-2xl">
            <SectionHeading label={label} title={title} />
            <p className="text-lg leading-8 text-muted">{lead}</p>
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <Reveal key={item.title} delay={(i % 3) * 80} className="flex">
              <Link
                href={`/services/${item.slug}`}
                className="group flex w-full flex-col rounded-panel border border-border bg-card p-6 shadow-soft transition-transform duration-200 hover:-translate-y-1"
              >
                <h3 className="flex items-start justify-between gap-3 font-display text-xl font-semibold tracking-tight text-foreground">
                  <span className="transition-colors group-hover:text-accent-strong">
                    {item.title}
                  </span>
                  <ArrowUpRightIcon className="mt-1 h-4 w-4 shrink-0 text-subtle transition-colors group-hover:text-accent" />
                </h3>
                <p className="mt-2 text-[15px] leading-7 text-muted">
                  {item.body}
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
