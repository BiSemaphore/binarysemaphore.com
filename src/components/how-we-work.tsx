import { site } from "@/lib/site";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { Photo } from "@/components/photo";
import planningNotes from "@/images/planning-notes.jpg";
import teamCoding from "@/images/team-coding.jpg";

// One photo per step, in order.
const stepImages = [planningNotes, teamCoding];

export function HowWeWork() {
  const { label, title, lead, steps } = site.howWeWork;
  return (
    <section id="how-we-work" className="section scroll-mt-20">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <SectionHeading label={label} title={title} />
        <p className="max-w-2xl text-lg leading-8 text-muted">{lead}</p>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 80} className="flex">
              <div className="flex w-full flex-col overflow-hidden rounded-panel border border-border bg-card shadow-soft">
                <Photo
                  src={stepImages[i]}
                  alt=""
                  sizes="(min-width: 1024px) 600px, 100vw"
                  className="aspect-[3/2] w-full border-b border-border"
                />
                <div className="p-6">
                  <h3 className="font-display text-xl font-semibold tracking-tight text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-7 text-muted">
                    {step.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
