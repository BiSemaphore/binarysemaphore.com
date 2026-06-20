import { site } from "@/lib/site";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";

/**
 * The studio's working process as a numbered 01..04 sequence. Copy lives in
 * site.howWeWork.steps.
 */
export function HowWeWork() {
  const { label, title, lead, steps } = site.howWeWork;
  return (
    <section id="how-we-work" className="section scroll-mt-20">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div className="max-w-2xl">
          <SectionHeading label={label} title={title} />
          <p className="text-lg leading-8 text-muted">{lead}</p>
        </div>

        <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 80}>
              <li className="border-t border-border pt-5">
                <span className="font-mono text-sm font-medium text-accent-strong">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-xl font-semibold tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-[15px] leading-7 text-muted">
                  {step.body}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
