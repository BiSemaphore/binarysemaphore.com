import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";

/** One numbered section of a team member profile. */
export function ProfileSection({
  id,
  index,
  label,
  title,
  children,
}: {
  id: string;
  /** 1-based position, shown as "01", matching the section rail. */
  index: number;
  label: string;
  /** Optional display heading under the mono label. */
  title?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24">
      <Reveal>
        <p className="flex items-baseline gap-3 font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
          <span className="text-subtle">{String(index).padStart(2, "0")}</span>
          {title ? label : <span id={`${id}-heading`}>{label}</span>}
        </p>
        {title ? (
          <h2
            id={`${id}-heading`}
            className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            {title}
          </h2>
        ) : null}
        <div className="mt-6">{children}</div>
      </Reveal>
    </section>
  );
}
