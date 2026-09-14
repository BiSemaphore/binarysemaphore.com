import Image from "next/image";
import type { TeamEvent } from "@/lib/site";
import { formatEventDate, sortEvents } from "@/lib/team";
import { Carousel } from "@/components/team-member/carousel";
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
 * The event poster across the top of the card, with the host's logo pinned
 * to its corner. Without a cover, a neutral band carries the logo or the
 * initial tile so every card is the same shape.
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

  return (
    <div className="relative">
      <div className="aspect-[16/10] overflow-hidden rounded-xl border border-border bg-background">
        {event.cover ? (
          <Image
            src={event.cover}
            alt={`${event.name} poster`}
            width={640}
            height={400}
            sizes="(min-width: 640px) 352px, 304px"
            className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <CardTile label={event.host ?? event.name} />
          </div>
        )}
      </div>
      {logo ? <div className="absolute right-3 -bottom-3">{logo}</div> : null}
    </div>
  );
}

function EventCard({ event }: { event: TeamEvent }) {
  const where = [event.host, event.location].filter(Boolean).join(", ");
  const body = (
    <>
      <EventArt event={event} />
      <div className="mt-5 flex flex-1 flex-col">
        <div className="flex items-center justify-between gap-3">
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
          <p className="mt-3 line-clamp-3 text-[15px] leading-7 text-muted">{event.note}</p>
        ) : null}
      </div>
    </>
  );
  const card = "group flex h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-soft";
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

/** Hackathons, workshops and meetups in one sideways row, newest first. */
export function Events({ events }: { events: TeamEvent[] }) {
  return (
    <Carousel
      label="Events and community"
      itemClassName="flex-[0_0_19rem] sm:flex-[0_0_22rem]"
      items={sortEvents(events).map((event) => ({
        key: `${event.date}-${event.name}`,
        node: <EventCard event={event} />,
      }))}
    />
  );
}
