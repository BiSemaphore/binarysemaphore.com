import Image from "next/image";
import type { TeamEvent } from "@/lib/site";
import { formatEventDate, groupEventsByYear } from "@/lib/team";
import { ArrowUpRightIcon } from "@/components/icons";
import { CardTile } from "@/components/team-member/tray-card";

// One candy colour per kind, used only as a dot so the label text keeps full
// contrast in both themes.
const kindDot: Record<TeamEvent["kind"], string> = {
  hackathon: "bg-coral",
  workshop: "bg-blue",
  meetup: "bg-violet",
  conference: "bg-sun",
};

/**
 * The event poster, square, with the host's logo pinned to its corner. Without
 * a cover the logo (or the initial tile) stands in on its own.
 */
function EventArt({ event }: { event: TeamEvent }) {
  const logo = event.logo ? (
    <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-soft ring-1 ring-black/5">
      <Image
        src={event.logo}
        alt=""
        width={40}
        height={40}
        unoptimized={event.logo.endsWith(".svg")}
        className="h-full w-full object-contain"
      />
    </span>
  ) : null;

  if (!event.cover) {
    return <div className="shrink-0">{logo ?? <CardTile label={event.host ?? event.name} />}</div>;
  }

  return (
    <div className="relative w-24 shrink-0 self-start sm:w-36">
      <div className="aspect-square overflow-hidden rounded-xl border border-border bg-background">
        <Image
          src={event.cover}
          alt={`${event.name} poster`}
          width={288}
          height={288}
          sizes="(min-width: 640px) 144px, 96px"
          className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03]"
        />
      </div>
      {logo ? <div className="absolute -right-2.5 -bottom-2.5">{logo}</div> : null}
    </div>
  );
}

function EventCard({ event }: { event: TeamEvent }) {
  const where = [event.host, event.location].filter(Boolean).join(", ");
  const body = (
    <>
      <EventArt event={event} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.15em] text-subtle">
            <span aria-hidden className={`h-2 w-2 rounded-full ${kindDot[event.kind]}`} />
            {event.kind}
          </p>
          <p className="font-mono text-xs text-subtle">{formatEventDate(event)}</p>
        </div>
        <div className="mt-2 flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-bold leading-snug tracking-tight text-foreground">
            {event.name}
          </h3>
          {event.href ? (
            <ArrowUpRightIcon className="mt-1.5 h-4 w-4 shrink-0 text-subtle transition-colors group-hover:text-foreground" />
          ) : null}
        </div>
        {where ? <p className="mt-1 text-sm text-muted">{where}</p> : null}
        {event.note ? (
          <p className="mt-3 hidden text-[15px] leading-7 text-muted sm:block">{event.note}</p>
        ) : null}
      </div>
      {event.note ? (
        <p className="basis-full text-[15px] leading-7 text-muted sm:hidden">{event.note}</p>
      ) : null}
    </>
  );
  const card =
    "group flex h-full flex-wrap gap-x-5 gap-y-4 rounded-2xl border border-border bg-card p-4 shadow-soft sm:flex-nowrap sm:gap-6 sm:p-5";
  return event.href ? (
    <a
      href={event.href}
      target="_blank"
      rel="noreferrer noopener"
      className={`${card} transition-transform duration-200 motion-safe:hover:-translate-y-0.5`}
    >
      {body}
    </a>
  ) : (
    <div className={card}>{body}</div>
  );
}

/** Hackathons, workshops and meetups, grouped by year, newest first. */
export function Events({ events }: { events: TeamEvent[] }) {
  return (
    <div className="space-y-8">
      {groupEventsByYear(events).map((group) => (
        <div key={group.year} className="sm:grid sm:grid-cols-[5.5rem_1fr] sm:gap-6">
          <p className="font-display text-2xl font-bold tracking-tight text-subtle sm:pt-4">
            {group.year}
          </p>
          <ul className="mt-3 space-y-4 sm:mt-0">
            {group.events.map((event) => (
              <li key={`${event.date}-${event.name}`} className="min-w-0">
                <EventCard event={event} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
