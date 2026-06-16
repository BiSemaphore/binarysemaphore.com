import { ImageResponse } from "next/og";
import { getAllThreads, getThread } from "@/lib/threads";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Binary Semaphore — Threads";

// Prerender an OG image for every thread.
export function generateStaticParams() {
  return getAllThreads().map((t) => ({ slug: t.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const thread = getThread(slug);
  const title = thread?.title ?? "Threads";
  const tags = thread?.tags ?? [];

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#fbfbfa",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* top accent bar */}
        <div style={{ display: "flex", height: "10px", width: "160px" }}>
          <div style={{ flex: 1, backgroundColor: "#00a6fb" }} />
          <div style={{ flex: 1, backgroundColor: "#14b8a6" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: "26px",
              letterSpacing: "6px",
              textTransform: "uppercase",
              color: "#0369a1",
            }}
          >
            Threads
          </div>
          <div
            style={{
              marginTop: "20px",
              fontSize: "68px",
              lineHeight: 1.1,
              fontWeight: 700,
              color: "#0a0a0a",
              maxWidth: "1000px",
            }}
          >
            {title}
          </div>
          {tags.length > 0 ? (
            <div
              style={{
                marginTop: "28px",
                fontSize: "26px",
                color: "#57534e",
              }}
            >
              {tags.map((t) => `#${t}`).join("   ")}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "28px",
            color: "#0a0a0a",
          }}
        >
          <span style={{ fontWeight: 700 }}>
            binary<span style={{ color: "#00a6fb" }}>.</span>semaphore
          </span>
          <span style={{ color: "#78716c" }}>binarysemaphore.com</span>
        </div>
      </div>
    ),
    size,
  );
}
