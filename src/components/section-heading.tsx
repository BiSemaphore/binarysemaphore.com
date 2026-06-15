/** Small monospace section label + heading used across sections. */
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
      <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}
