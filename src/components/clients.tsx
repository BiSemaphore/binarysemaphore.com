import { site } from "@/lib/site";

/**
 * "Used by teams at" logo row. Renders client names as wordmark-style chips.
 * Names are placeholders in site.ts (`clients`); swap for <Image> logos when
 * real assets exist.
 */
export function Clients() {
  if (site.clients.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-10">
      <p className="text-center font-mono text-xs uppercase tracking-[0.2em] text-subtle">
        Used by teams at
      </p>
      <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
        {site.clients.map((name) => (
          <li
            key={name}
            className="font-display text-xl font-bold text-foreground/35 transition-colors hover:text-foreground/60"
          >
            {name}
          </li>
        ))}
      </ul>
    </section>
  );
}
