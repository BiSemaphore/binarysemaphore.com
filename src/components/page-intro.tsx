/** Standard heading block for dedicated pages: mono label + big display H1. */
export function PageIntro({
  label,
  title,
  lead,
}: {
  label: string;
  title: string;
  lead?: string;
}) {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 pt-16 pb-2 lg:px-10 lg:pt-24">
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
        {label}
      </p>
      <h1 className="max-w-3xl text-balance font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
        {title}
      </h1>
      {lead ? (
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">{lead}</p>
      ) : null}
    </section>
  );
}
