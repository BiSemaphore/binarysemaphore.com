import type { Metadata } from "next";
import Link from "next/link";
import {
  channelState,
  countChannels,
  countCovered,
  getSubjects,
} from "@/lib/learn/topics";
import { learnBase } from "@/lib/learn/paths";
import { SubjectIcon } from "@/components/learn/topics/subject-icons";

export const metadata: Metadata = {
  title: "Topics",
  description:
    "Subjects you already work in, with channels for what breaks, what gets asked, and where people get stuck.",
};

export default async function TopicsIndex() {
  const base = await learnBase();
  const [subjects, total, covered] = await Promise.all([
    getSubjects(),
    countChannels(),
    countCovered(),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10 lg:px-10 lg:py-14">
      <h1 className="font-reading text-3xl font-bold leading-tight tracking-[-0.04em] text-foreground sm:text-4xl">
        Topics
      </h1>
      <p className="mt-5 text-lg leading-8 text-muted">
        Pick the subject you are actually working in. The channels inside are
        angles on it: what breaks, what gets asked, where people freeze. Not a
        beginner ladder, because nobody opens a page called{" "}
        <span className="font-reading">#memory-and-gc</span> needing chapter
        one.
      </p>
      <p className="mt-4 leading-7 text-muted">
        {subjects.length} subjects, {total} channels. {covered} have something
        written by us so far. The rest say so, and asking for one moves it up
        the list.
      </p>

      <div className="mt-14 space-y-10">
        {subjects.map((subject) => (
          <section key={subject.slug}>
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <SubjectIcon
                subject={subject.slug}
                className="h-5 w-5 shrink-0 text-subtle"
              />
              <h2 className="font-reading text-base font-bold tracking-tight text-foreground">
                <Link
                  href={`${base}/topics/${subject.slug}`}
                  className="transition-colors hover:text-accent-strong"
                >
                  {subject.name}
                </Link>
              </h2>
              <span className="ml-auto font-mono text-[0.65rem] text-subtle">
                {subject.channels.length}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-subtle">
              {subject.blurb}
            </p>

            <ul className="mt-4 space-y-1">
              {subject.channels.map((channel) => {
                const state = channelState(channel);
                return (
                  <li key={channel.slug}>
                    <Link
                      href={`${base}/topics/${subject.slug}/${channel.slug}`}
                      className="flex items-baseline gap-3 rounded px-2 py-2 transition-colors hover:bg-card-hover"
                    >
                      <span className="channel shrink-0 font-mono text-[0.82rem] text-foreground">
                        {channel.slug}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-subtle">
                        {channel.blurb}
                      </span>
                      {state === "soon" ? null : (
                        <span className="shrink-0 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-muted">
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
