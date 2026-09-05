"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { TopicGroup } from "@/lib/learn/topics";

const STORE = "topics:collapsed";

/** Group slugs the viewer has collapsed. Never throws: storage can be blocked. */
function readCollapsed(): Set<string> {
  try {
    const saved = localStorage.getItem(STORE);
    return new Set(saved ? (JSON.parse(saved) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeCollapsed(slugs: Set<string>) {
  try {
    localStorage.setItem(STORE, JSON.stringify([...slugs]));
  } catch {
    // Private window or blocked site data. The tree still works, it just will
    // not be remembered.
  }
}

/**
 * The topic shell: a rail of groups, a sidebar of channels, a main pane, and
 * both sides scrolling independently.
 *
 * Structure borrowed from Discord because the problem is Discord's, a tree too
 * big for a menu. The look is not borrowed: see docs/topics.md.
 *
 * The sidebar lists every group as a collapsible category rather than showing
 * only the selected one. With 64 topics that is still scannable, and hiding
 * eleven groups behind a rail click would defeat the point of a browse surface.
 *
 * Collapse is a native `<details>`, not React state. That means the tree opens
 * and closes with JavaScript disabled, there is no hydration mismatch to manage,
 * and restoring the viewer's saved state is a DOM write rather than a render.
 *
 * `children` is rendered by the server and passed straight through, so no topic
 * prose reaches this client bundle.
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
  const details = useRef(new Map<string, HTMLDetailsElement>());

  // Restore after mount by writing to the DOM, not by setting state: the server
  // has no localStorage, so the markup ships expanded and closes on arrival for
  // anyone who collapsed a group last time.
  useEffect(() => {
    const collapsed = readCollapsed();
    for (const [slug, el] of details.current) el.open = !collapsed.has(slug);
  }, []);

  const onToggle = useCallback((slug: string, open: boolean) => {
    const collapsed = readCollapsed();
    if (open) collapsed.delete(slug);
    else collapsed.add(slug);
    writeCollapsed(collapsed);
  }, []);

  // Closing on navigation belongs to the click, not to an effect watching the
  // path: an effect would fire on every route change including the first paint.
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const tree = (
    <>
      {/* Group rail. Two-letter marks, the way Discord abbreviates a server,
          with the full name carried for assistive tech. */}
      <nav
        aria-label="Topic groups"
        className="hidden w-[72px] shrink-0 flex-col items-center gap-2 overflow-y-auto border-r border-border bg-card py-4 lg:flex"
      >
        {groups.map((group) => {
          const current = group.slug === activeGroup?.slug;
          return (
            <a
              key={group.slug}
              href={`#group-${group.slug}`}
              title={group.name}
              aria-current={current ? "true" : undefined}
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl font-mono text-[0.7rem] tracking-wider transition-all duration-200 hover:rounded-xl ${
                current
                  ? "bg-foreground text-background"
                  : "bg-background text-subtle hover:bg-card-hover hover:text-foreground"
              }`}
            >
              <span aria-hidden>{group.mark}</span>
              <span className="sr-only">{group.name}</span>
            </a>
          );
        })}
      </nav>

      {/* Channel sidebar. */}
      <nav
        aria-label="Topics"
        className="w-[248px] shrink-0 overflow-y-auto border-r border-border bg-card px-2 py-4"
      >
        {groups.map((group) => (
          <details
            key={group.slug}
            id={`group-${group.slug}`}
            open
            ref={(el) => {
              if (el) details.current.set(group.slug, el);
              else details.current.delete(group.slug);
            }}
            onToggle={(event) => onToggle(group.slug, event.currentTarget.open)}
            className="group/cat mb-4 scroll-mt-4"
          >
            <summary className="flex cursor-pointer list-none items-center gap-1.5 px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-subtle transition-colors hover:text-foreground">
              <span
                aria-hidden
                className="inline-block transition-transform duration-200 group-open/cat:rotate-0 -rotate-90"
              >
                &#9662;
              </span>
              {group.name}
            </summary>

            <ul className="mt-1 space-y-px">
              {group.topics.map((topic) => {
                const current = topic.slug === activeSlug;
                return (
                  <li key={topic.slug}>
                    <Link
                      href={`${base}/topics/${topic.slug}`}
                      onClick={closeDrawer}
                      aria-current={current ? "page" : undefined}
                      className={`channel flex items-center rounded px-2 py-1.5 font-mono text-[0.78rem] transition-colors ${
                        current
                          ? "bg-card-hover text-foreground"
                          : "text-subtle hover:bg-card-hover hover:text-muted"
                      }`}
                    >
                      <span className="truncate">{topic.slug}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </details>
        ))}
      </nav>
    </>
  );

  return (
    <div className="topics-shell flex min-h-[calc(100vh-3.5rem)] bg-background text-foreground">
      <div className="hidden md:flex">{tree}</div>

      {/* Mobile drawer, the way Discord does it. Most of this audience is on a
          phone, so it is designed here rather than retrofitted. */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <button
            type="button"
            aria-label="Close topics"
            onClick={closeDrawer}
            className="absolute inset-0 bg-black/60"
          />
          <div className="relative flex h-full">{tree}</div>
        </div>
      ) : null}

      <main className="min-w-0 flex-1 overflow-y-auto">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="sticky top-0 z-30 flex w-full items-center gap-2 border-b border-border bg-background/90 px-5 py-3 font-mono text-xs text-subtle backdrop-blur md:hidden"
        >
          <span aria-hidden>&#9776;</span>
          {activeGroup ? activeGroup.name : "All topics"}
        </button>
        {children}
      </main>
    </div>
  );
}
