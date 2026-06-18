import { DotGrid } from "@/components/decoration";

/**
 * The hero's wide brand panel: a static diagram of the studio's namesake, a
 * binary semaphore. Tasks wait in a queue (P), one holds the lock inside the
 * critical section while the counter reads s = 0, and a released task exits to
 * signal (V). No motion. Colors are driven off the theme tokens, so the panel
 * is white with a black frame in light mode and inverts in dark mode.
 */
export function SemaphorePanel({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative flex aspect-[16/8] w-full items-center justify-center overflow-hidden rounded-blob border border-foreground bg-card text-foreground ${className}`}
    >
      <DotGrid className="text-foreground/[0.06]" />
      <svg
        viewBox="0 0 720 360"
        preserveAspectRatio="xMidYMid meet"
        className="relative h-full w-full"
        role="img"
        aria-label="A binary semaphore: tasks wait in a queue, one holds the lock in the critical section while the counter reads s = 0, and a released task signals on exit."
      >
        {/* transit track */}
        <line
          x1="96"
          y1="180"
          x2="624"
          y2="180"
          stroke="currentColor"
          strokeOpacity="0.16"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="1 12"
        />

        {/* P(s) — acquire / wait */}
        <text x="70" y="176" className="sem-op" textAnchor="middle">
          P(s)
        </text>
        <text x="70" y="200" className="sem-cap" textAnchor="middle">
          wait
        </text>

        {/* waiting queue */}
        <circle cx="150" cy="180" r="8" fill="currentColor" fillOpacity="0.3" />
        <circle cx="184" cy="180" r="8" fill="currentColor" fillOpacity="0.3" />
        <circle cx="218" cy="180" r="8" fill="currentColor" fillOpacity="0.3" />

        {/* critical section, lock held (s = 0) */}
        <text x="360" y="98" className="sem-cap" textAnchor="middle">
          critical section
        </text>
        <rect
          x="300"
          y="118"
          width="120"
          height="124"
          rx="20"
          fill="currentColor"
          fillOpacity="0.04"
          stroke="currentColor"
          strokeOpacity="0.24"
          strokeWidth="1.5"
        />
        <text x="360" y="156" className="sem-count" textAnchor="middle">
          s = 0
        </text>
        <circle cx="360" cy="200" r="10" className="sem-token" />

        {/* V(s) — release / signal */}
        <text x="650" y="176" className="sem-op" textAnchor="middle">
          V(s)
        </text>
        <text x="650" y="200" className="sem-cap" textAnchor="middle">
          signal
        </text>
        {/* a released task heading out to signal */}
        <circle cx="560" cy="180" r="10" className="sem-token" opacity="0.35" />
      </svg>
    </div>
  );
}
