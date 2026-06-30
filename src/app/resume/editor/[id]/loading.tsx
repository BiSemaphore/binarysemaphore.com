import { Spinner } from "@/components/resume/spinner";

/** Shown while the editor loads the resume (auth check + DB read). */
export default function EditorLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <span className="inline-flex items-center gap-2 font-mono text-xs text-[color:var(--rx-muted)]">
        <Spinner />
        loading editor…
      </span>
    </div>
  );
}
