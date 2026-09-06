"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { TopicGroup } from "@/lib/learn/topics";
import { GroupIcon } from "@/components/learn/topics/group-icons";
import { Tooltip } from "@/components/tooltip";
import { MenuIcon, CloseIcon } from "@/components/icons";

/**
 * The topic shell: group rail, channel sidebar, reading pane.
 *
 * **The height model is the whole thing.** Discord never scrolls the page; each
 * pane scrolls itself. That needs a bounded height at the top and `min-h-0` on
 * every flex child down the chain, because a flex item defaults to
 * `min-height: auto` and refuses to shrink below its content, which silently
 * defeats `overflow-y`. The first version of this file had `overflow-y-auto` on
 * panes that had grown to 2564px inside a 911px viewport, so the property did
 * nothing and the page scrolled instead. Do not remove the
 * `h-[calc(100dvh-3.5rem)]` or any of the `min-h-0`s.
 *
 * `100dvh` rather than `100vh`, so collapsing mobile browser chrome does not
 * leave a dead strip under the sidebar.
 *
 * **The rail filters, it does not scroll.** The first version listed all twelve
 * groups in the sidebar at once and used the rail as anchor links, which is not
 * what a Discord rail does: picking a server shows that server's channels and
 * hides every other server's. Picking a group here does the same, so the
 * sidebar only ever holds one group's channels.
 *
 * With no group selected (the `/topics` index) the sidebar lists the groups
 * themselves, the way Discord's home shows conversations rather than channels.
 *
 * The rail and sidebar are one instance, moved off-canvas by transform below
 * `md`, rather than rendered twice.
 */
export function TopicsShell({
  groups,
  base,
  children,
}: {
  groups: TopicGroup[];
  base: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const activeSlug = pathname.split("/topics/")[1]?.split("/")[0] ?? "";
  const activeGroup = groups.find((g) =>
    g.topics.some((t) => t.slug === activeSlug),
  );

  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="topics-shell flex h-[calc(100dvh-3.5rem)] overflow-hidden bg-background text-foreground">
      {drawerOpen ? (
        <button
          type="button"
          aria-label="Close topics"
          onClick={closeDrawer}
          className="fixed inset-0 z-30 bg-black/70 md:hidden"
        />
      ) : null}

      {/* Rail plus sidebar. One instance; slides off-canvas below md. */}
      <div
        className={`z-40 flex h-full shrink-0 transition-transform duration-200 ease-out max-md:fixed max-md:bottom-0 max-md:left-0 max-md:top-14 md:translate-x-0 ${
          drawerOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"
        }`}
      >
        <nav
          aria-label="Topic groups"
          className="rail-surface thin-scroll flex min-h-0 w-[72px] shrink-0 flex-col items-center gap-2 overflow-y-auto py-3"
        >
          {groups.map((group) => {
            const current = group.slug === activeGroup?.slug;
            return (
              <Tooltip
                key={group.slug}
                label={group.name}
                side="right"
                delay={120}
              >
                <Link
                  href={`${base}/topics/${group.topics[0].slug}`}
                  onClick={closeDrawer}
                  aria-current={current ? "true" : undefined}
                  className={`rail-item relative grid h-12 w-12 shrink-0 place-items-center ${
                    current
                      ? "bg-foreground text-background"
                      : "bg-card text-muted hover:bg-card-hover hover:text-foreground"
                  }`}
                >
                  <GroupIcon group={group.slug} className="h-[22px] w-[22px]" />
                  <span className="sr-only">{group.name}</span>
                </Link>
              </Tooltip>
            );
          })}
        </nav>

        <div className="sidebar-surface flex h-full min-h-0 w-60 flex-col">
          {/* Discord's server header: a fixed bar with a shadow separating it
              from the list that scrolls beneath. */}
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4 shadow-[0_1px_0_rgba(0,0,0,0.45)]">
            <span className="truncate font-mono text-[0.78rem] font-semibold text-foreground">
              {activeGroup ? activeGroup.name : "Topics"}
            </span>
            <button
              type="button"
              onClick={closeDrawer}
              aria-label="Close topics"
              className="text-subtle transition-colors hover:text-foreground md:hidden"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          <nav
            aria-label="Topics"
            className="thin-scroll min-h-0 flex-1 overflow-y-auto px-2 py-3"
          >
            {activeGroup ? (
              <ul>
                {activeGroup.topics.map((topic) => {
                  const current = topic.slug === activeSlug;
                  return (
                    <li key={topic.slug}>
                      <Tooltip
                        label={topic.slug}
                        side="right"
                        onlyWhenTruncated
                      >
                        <Link
                          href={`${base}/topics/${topic.slug}`}
                          onClick={closeDrawer}
                          aria-current={current ? "page" : undefined}
                          className={`channel mx-2 flex h-8 items-center rounded-[4px] px-2 font-mono text-[0.9rem] font-medium transition-colors ${
                            current
                              ? "row-active text-foreground"
                              : "row-hover text-subtle hover:text-muted"
                          }`}
                        >
                          <span data-truncate className="truncate">
                            {topic.slug}
                          </span>
                        </Link>
                      </Tooltip>
                    </li>
                  );
                })}
              </ul>
            ) : (
              /* No group selected: list the groups, the way Discord's home
                 shows conversations rather than one server's channels. */
              <ul>
                {groups.map((group) => (
                  <li key={group.slug}>
                    <Link
                      href={`${base}/topics/${group.topics[0].slug}`}
                      onClick={closeDrawer}
                      className="row-hover mx-2 flex h-9 items-center gap-2.5 rounded-[4px] px-2 text-[0.85rem] text-subtle transition-colors hover:text-foreground"
                    >
                      <GroupIcon
                        group={group.slug}
                        className="h-4 w-4 shrink-0"
                      />
                      <span className="truncate">{group.name}</span>
                      <span className="ml-auto font-mono text-[0.7rem] text-subtle">
                        {group.topics.length}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </nav>
        </div>
      </div>

      {/* The reading pane, and the only other scroll container. */}
      <main className="thin-scroll flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="sticky top-0 z-20 flex shrink-0 items-center gap-2 border-b border-border bg-background/95 px-4 py-3 font-mono text-xs text-subtle backdrop-blur md:hidden"
        >
          <MenuIcon className="h-4 w-4" />
          {activeGroup ? activeGroup.name : "All topics"}
        </button>
        {children}
      </main>
    </div>
  );
}
