import Link from "next/link";

/**
 * The 404.
 *
 * Reached by `notFound()` as well as by unmatched URLs, so it is on the path of
 * every wrong notebook slug, topic and roadmap. It should offer somewhere to go
 * rather than just stating the obvious.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-subtle">
        404
      </p>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        There is nothing here.
      </h1>
      <p className="mt-5 leading-7 text-muted">
        The page has moved or never existed. Neither is your fault.
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {[
          { href: "/", label: "Home" },
          { href: "/threads", label: "Threads" },
          { href: "/learn", label: "Learn" },
          { href: "/projects", label: "Projects" },
        ].map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="block rounded-card border border-border bg-card px-5 py-4 text-sm font-medium text-foreground transition-colors hover:bg-card-hover"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
