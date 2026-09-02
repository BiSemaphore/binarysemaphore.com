import { lectureSeries, type Notebook } from "@/lib/learn";
import { LectureEmbed } from "@/components/learn/lecture-embed";

/**
 * Who the notebook is built on.
 *
 * Six of the nine expand a lecture from one playlist. The books say so in their
 * own prose, but buried in a paragraph a reader may never open, and two of them
 * cite the wrong video. This states it plainly, links the lecture, and names the
 * person whose work it is.
 *
 * A notebook written from scratch says that instead. Claiming a source it does
 * not have would be as wrong as hiding one it does.
 */
/** The eleven-character id in a watch url. */
function videoId(url: string): string | null {
  return new URL(url).searchParams.get("v");
}

export function Credit({
  notebook,
  className = "",
}: {
  notebook: Notebook;
  className?: string;
}) {
  const { sources } = notebook;

  return (
    <aside
      className={`rounded-card border border-border bg-card px-5 py-4 ${className}`}
    >
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-subtle">
        {sources.length > 0 ? "Built on" : "Source"}
      </p>

      {sources.length === 0 ? (
        <p className="mt-2 text-sm leading-6 text-muted">
          Written from scratch. Not based on a lecture.
        </p>
      ) : (
        <>
          <ul className="mt-3 space-y-4">
            {sources.map((video) => {
              const id = videoId(video.url);
              return (
                <li key={video.url}>
                  {id ? (
                    <LectureEmbed videoId={id} title={video.title} />
                  ) : null}
                  <p className="mt-2 text-sm leading-6">
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent"
                    >
                      {video.title}
                    </a>
                    <span className="ml-2 font-mono text-xs text-subtle">
                      {video.duration}
                    </span>
                  </p>
                </li>
              );
            })}
          </ul>

          <p className="mt-3 text-sm leading-6 text-muted">
            {sources.length > 1 ? "Lectures" : "A lecture"} by{" "}
            <a
              href={lectureSeries.authorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent"
            >
              {lectureSeries.author}
            </a>
            , from the{" "}
            <a
              href={lectureSeries.playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent"
            >
              {lectureSeries.playlist}
            </a>{" "}
            playlist. The notebook expands it and goes further; the thinking it
            starts from is theirs.
          </p>
        </>
      )}
    </aside>
  );
}
