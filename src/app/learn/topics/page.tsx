import type { Metadata } from "next";
import Link from "next/link";
import {
  countCovered,
  countTopics,
  groups,
  topicState,
} from "@/lib/learn/topics";
import { learnBase } from "@/lib/learn/paths";
import { GroupIcon } from "@/components/learn/topics/group-icons";

export const metadata: Metadata = {
  title: "Topics",
  description:
    "The papers and tools a computer science degree covers, listed with what we have written on each and what we have not.",
};

export default async function TopicsIndex() {
  const base = await learnBase();
  const total = countTopics();
  const covered = countCovered();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10 lg:px-10 lg:py-14">
      <h1 className="font-mono text-3xl font-bold leading-tight tracking-[-0.04em] text-foreground sm:text-4xl">
        Topics
      </h1>
      <p className="mt-5 text-lg leading-8 text-muted">
        The papers and tools a computer science degree actually covers, laid out
        so you can find the one that is giving you trouble.
      </p>
      <p className="mt-4 leading-7 text-muted">
        {covered} of the {total} have something written by us so far. The other{" "}
        {total - covered} are listed anyway, with what they are and where to
        read about them, and each says plainly that we have not got to it yet.
        We are working through them.
      </p>

      {/* One column. A topic list is read down, not scanned across, and two
          columns made the eye jump between unrelated groups. */}
      <div className="mt-14 space-y-12">
        {groups.map((group) => (
          <section
            key={group.slug}
            id={`group-${group.slug}`}
            className="scroll-mt-6"
          >
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <GroupIcon
                group={group.slug}
                className="h-5 w-5 shrink-0 text-subtle"
              />
              <h2 className="font-mono text-sm font-semibold tracking-tight text-foreground">
                {group.name}
              </h2>
              <span className="ml-auto font-mono text-[0.65rem] text-subtle">
                {group.topics.length}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-subtle">
              {group.tagline}
            </p>

            <ul className="mt-5 space-y-1">
              {group.topics.map((topic) => {
                const state = topicState(topic);
                return (
                  <li key={topic.slug}>
                    <Link
                      href={`${base}/topics/${topic.slug}`}
                      className="flex items-baseline gap-3 rounded px-2 py-2 transition-colors hover:bg-card-hover"
                    >
                      <span className="channel shrink-0 font-mono text-[0.82rem] text-foreground">
                        {topic.slug}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-subtle">
                        {topic.blurb}
                      </span>
                      {state === "soon" ? null : (
                        <span
                          className="shrink-0 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-muted"
                          title={
                            state === "notebook"
                              ? "A notebook of ours covers this"
                              : "A roadmap of ours passes through this"
                          }
                        >
                          {state}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
