"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * A lecture, playable in place.
 *
 * Deliberately not a bare iframe. A YouTube embed pulls in roughly a megabyte
 * of player JavaScript and starts tracking on load, and some notebooks credit
 * two lectures, so two of them would sit on top of a page meant for reading.
 *
 * So: the thumbnail until someone asks for it, then the real player. The credit
 * is visible either way, and clicking counts as a view on the creator's video
 * exactly as it would on YouTube.
 *
 * `youtube-nocookie.com` is YouTube's privacy-enhanced host: no cookie until
 * playback actually starts.
 */
export function LectureEmbed({
  videoId,
  title,
}: {
  videoId: string;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-card border border-border">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play ${title} on YouTube`}
      className="group relative block aspect-video w-full overflow-hidden rounded-card border border-border bg-card"
    >
      <Image
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        fill
        unoptimized
        sizes="(min-width: 640px) 320px, 100vw"
        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
      <span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/10"
      >
        <span className="flex h-11 w-16 items-center justify-center rounded-xl bg-black/75 text-white transition-colors group-hover:bg-[#ff0000]">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  );
}
