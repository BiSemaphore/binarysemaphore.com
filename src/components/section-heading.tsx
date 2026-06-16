import { Underline } from "@/components/doodle";

/** Small monospace section label + doodle-underlined display heading. */
export function SectionHeading({
  label,
  title,
}: {
  label: string;
  title: string;
}) {
  return (
    <div className="mb-8">
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
        {label}
      </p>
      <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        <Underline>{title}</Underline>
      </h2>
    </div>
  );
}
