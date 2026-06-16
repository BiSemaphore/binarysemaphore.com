import { site } from "@/lib/site";
import { SectionHeading } from "@/components/section-heading";

export function About() {
  return (
    <section
      id="about"
      className="scroll-mt-20 border-t border-border py-16 sm:py-20"
    >
      <SectionHeading label="01 / about" title="Behind the work" />
      <div className="max-w-2xl space-y-4 text-base leading-7 text-muted">
        {site.about.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
