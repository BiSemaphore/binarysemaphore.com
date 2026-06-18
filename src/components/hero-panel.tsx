import { Photo } from "@/components/photo";
import heroImage from "@/images/torn-paper.jpg";

// Service / competency labels floated over the image, echoing the reference
// hero's frosted service pills.
const heroTags = [
  "Applied AI",
  "Distributed systems",
  "Developer tools",
  "Semantic search",
  "Concurrency",
];

/**
 * Hero brand panel: a wide, rounded, full-bleed photo (matching the reference
 * site's banner) with a cluster of frosted service pills overlaid top-right.
 * Eager-loaded since it anchors the hero; blur-up + shimmer handled by <Photo>.
 */
export function HeroPanel({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative aspect-[16/8] w-full overflow-hidden rounded-blob border border-border ${className}`}
    >
      <div className="absolute inset-0">
        <Photo
          src={heroImage}
          alt="A torn paper note taped to a coral background"
          priority
          sizes="(min-width: 1024px) 1200px, 100vw"
          className="h-full w-full"
        />
      </div>

      <div className="absolute right-4 top-4 flex max-w-[17rem] flex-wrap justify-end gap-2 sm:right-6 sm:top-6 sm:max-w-[27rem]">
        {heroTags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-black/35 px-3.5 py-1.5 text-xs font-medium text-white ring-1 ring-white/20 backdrop-blur-md sm:text-sm"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
