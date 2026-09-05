import type { Metadata } from "next";
import Link from "next/link";
import {
  countCovered,
  countTopics,
  groups,
  topicState,
} from "@/lib/learn/topics";
import { learnBase } from "@/lib/learn/paths";

export const metadata: Metadata = {
  title: "Topics",
  description:
    "The computer science topic tree: 64 topics across languages, DSA, systems, data, security, cloud and AI, each honest about what we have written and what we have not.",
};

export default async function TopicsIndex() {
  const base = await learnBase();
  const total = countTopics();
  const covered = countCovered();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-subtle">
        binary semaphore / topics
      </p>
      <h1 className="mt-4 font-mono text-4xl font-bold leading-[1.05] tracking-[-0.045em] text-foreground sm:text-5xl">
        Everything, in one tree
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
        {total} topics in {groups.length} groups. Pick the one that is giving
        you trouble. Each says plainly whether we have written anything on it,
        and offers an hour where we have not.
      </p>

      <p className="mt-6 font-mono text-xs text-subtle">
        {covered} of {total} have something of ours behind them today. The rest
        say so.
      </p>

      <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <section key={group.slug}>
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <span
                aria-hidden
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-card font-mono text-[0.62rem] tracking-wider text-subtle"
              >
                {group.mark}
              </span>
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

            <ul className="mt-4 space-y-px">
              {group.topics.map((topic) => {
                const state = topicState(topic);
                return (
                  <li key={topic.slug}>
                    <Link
                      href={`${base}/topics/${topic.slug}`}
                      className="channel flex items-center rounded px-2 py-1.5 font-mono text-[0.78rem] text-subtle transition-colors hover:bg-card-hover hover:text-foreground"
                    >
                      <span className="truncate">{topic.slug}</span>
                      {state === "soon" ? null : (
                        <span
                          className="ml-auto pl-3 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-muted"
                          title={
                            state === "notebook"
                              ? "A notebook covers this"
                              : "A roadmap passes through this"
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
