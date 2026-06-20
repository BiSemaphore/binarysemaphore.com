import { site } from "@/lib/site";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { PlusIcon } from "@/components/icons";

/**
 * FAQ as a native <details> accordion (no JS, accessible). The plus icon
 * rotates into a cross when its item is open.
 */
export function Faq() {
  const { label, title, items } = site.faq;
  return (
    <section id="faq" className="section scroll-mt-20">
      <div className="mx-auto w-full max-w-3xl px-6 lg:px-10">
        <SectionHeading label={label} title={title} />

        <div className="mt-8 divide-y divide-border border-y border-border">
          {items.map((item, i) => (
            <Reveal key={item.q} delay={(i % 2) * 60}>
              <details className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium text-foreground [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <PlusIcon className="h-5 w-5 shrink-0 text-subtle transition-transform duration-200 group-open:rotate-45" />
                </summary>
                <p className="mt-3 text-[15px] leading-7 text-muted">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
