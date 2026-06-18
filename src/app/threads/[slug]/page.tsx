import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllThreads, getThread, formatDate } from "@/lib/threads";
import { threadCovers } from "@/lib/thread-covers";
import { Photo } from "@/components/photo";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

type Params = { slug: string };

// Only slugs returned here exist; anything else 404s.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllThreads().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const thread = getThread(slug);
  if (!thread) return {};

  return {
    title: thread.title,
    description: thread.description,
    keywords: thread.tags,
    openGraph: {
      type: "article",
      title: thread.title,
      description: thread.description,
      publishedTime: thread.date,
      tags: thread.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: thread.title,
      description: thread.description,
    },
    alternates: { canonical: `/threads/${slug}` },
  };
}

export default async function ThreadPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const thread = getThread(slug);
  if (!thread) notFound();

  const { default: Post } = await import(`@/content/threads/${slug}.mdx`);

  return (
    <>
      <Header />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-20">
        <nav className="pt-10 pb-8 text-sm" aria-label="Breadcrumb">
          <Link
            href="/threads"
            className="inline-flex items-center gap-1.5 font-mono text-subtle transition-colors hover:text-foreground"
          >
            <span aria-hidden="true">&larr;</span> Threads
          </Link>
        </nav>

        <header>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-subtle">
            <time dateTime={thread.date}>{formatDate(thread.date)}</time>
            <span aria-hidden="true">·</span>
            <span>{thread.readingMinutes} min read</span>
          </div>

          <h1 className="mt-4 text-balance font-display text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
            {thread.title}
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-7 text-muted">
            {thread.description}
          </p>

          {thread.tags.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {thread.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-card px-2.5 py-1 font-mono text-xs text-subtle ring-1 ring-inset ring-border"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </header>

        {threadCovers[slug] ? (
          <Photo
            src={threadCovers[slug]}
            alt=""
            priority
            sizes="(min-width: 768px) 768px, 100vw"
            className="mt-8 aspect-[2/1] w-full rounded-panel border border-border shadow-soft"
          />
        ) : null}

        <hr className="my-10 border-0 border-t border-border" />

        <article className="thread">
          <Post />
        </article>

        <div className="mt-14 border-t border-border pt-8">
          <Link
            href="/threads"
            className="inline-flex items-center gap-1.5 font-mono text-sm text-subtle transition-colors hover:text-foreground"
          >
            <span aria-hidden="true">&larr;</span> All threads
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
