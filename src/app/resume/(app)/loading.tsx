import { Spinner } from "@/components/resume/spinner";

/** Route-level loading UI for the resume app pages (home, templates, etc.). */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <span className="inline-flex items-center gap-2 font-mono text-xs text-[color:var(--rx-muted)]">
        <Spinner />
        loading…
      </span>
    </div>
  );
}
