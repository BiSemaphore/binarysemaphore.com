import { site } from "@/lib/site";
import { SectionHeading } from "@/components/section-heading";

export function Features() {
  return (
    <section
      id="features"
      className="scroll-mt-20 border-t border-border"
    >
      <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
        <SectionHeading label="Features" title="What inode does" />

        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {site.features.map((feature, i) => (
            <div
              key={feature.title}
              className="flex flex-col bg-card p-7 transition-colors hover:bg-card-hover"
            >
              <span className="mb-5 font-mono text-xs text-accent-strong">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm leading-6 text-muted">{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
