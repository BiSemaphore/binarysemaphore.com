import Image from "next/image";
import { site } from "@/lib/site";
import { getInstagramPosts } from "@/lib/instagram";
import { SectionHeading } from "@/components/section-heading";
import { ArrowUpRightIcon, InstagramIcon } from "@/components/icons";

export async function Instagram() {
  // No profile configured — render nothing.
  if (!site.instagram) return null;

  const posts = await getInstagramPosts(6);
  const handle = `@${site.instagramHandle}`;

  return (
    <section id="instagram" className="section scroll-mt-20">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading label="Instagram" title="From the feed" />
          <a
            href={site.instagram}
            target="_blank"
            rel="noreferrer noopener"
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-hover"
          >
            <InstagramIcon className="h-4 w-4" />
            {handle}
            <ArrowUpRightIcon className="h-3.5 w-3.5 text-subtle" />
          </a>
        </div>

        {posts.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {posts.map((post) => (
              <li key={post.id}>
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group relative block aspect-square overflow-hidden rounded-card border border-border bg-card"
                  aria-label={post.caption?.slice(0, 80) || "View on Instagram"}
                >
                  <Image
                    src={post.image}
                    alt={post.caption?.slice(0, 120) || "Instagram post"}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          // No token configured (or fetch failed): show a follow card instead.
          <a
            href={site.instagram}
            target="_blank"
            rel="noreferrer noopener"
            className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-12 text-center transition-colors hover:bg-card-hover"
          >
            <InstagramIcon className="h-8 w-8 text-accent-strong" />
            <p className="text-base font-medium text-foreground">
              Follow {handle} on Instagram
            </p>
            <p className="max-w-sm text-sm text-muted">
              Build notes, releases, and work-in-progress from the workshop.
            </p>
          </a>
        )}
      </div>
    </section>
  );
}
