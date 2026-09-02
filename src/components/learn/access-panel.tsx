import Link from "next/link";
import {
  editions,
  formatBytes,
  type Notebook,
  type EditionId,
} from "@/lib/learn";
// From state, not access: this component decides nothing, it only draws a
// state, so it has no reason to pull the server-only data layer into its module
// graph.
import { type Access } from "@/lib/learn/state";
import { openNotebookAction } from "@/app/learn/actions";
import { DownloadIcon, LockIcon } from "@/components/icons";

/** The one edition offered first. The others sit under it. */
const PRIMARY: EditionId = "reading";

function Downloads({ notebook }: { notebook: Notebook }) {
  const available = editions.filter((e) => notebook.assets[e.id]);

  return (
    <ul className="mt-5 grid gap-2.5">
      {available.map((edition) => {
        const asset = notebook.assets[edition.id]!;
        const primary = edition.id === PRIMARY;

        return (
          <li key={edition.id}>
            <a
              href={`/api/learn/${notebook.slug}/${edition.id}`}
              className={`group flex items-center gap-4 rounded-card border p-4 transition-colors ${
                primary
                  ? "border-accent/40 bg-accent/[0.06] hover:bg-accent/10"
                  : "border-border bg-background hover:bg-card-hover"
              }`}
            >
              <DownloadIcon
                className={`h-5 w-5 shrink-0 ${primary ? "text-accent-strong" : "text-subtle"}`}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">
                  {edition.name}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-muted">
                  {edition.description}
                </span>
              </span>
              <span className="shrink-0 font-mono text-xs text-subtle">
                {formatBytes(asset.bytes)}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The gate. Renders one of four states for a notebook, and is the only place a
 * download link is ever produced. `access` comes from getAccess(); this
 * component does not decide anything itself.
 */
export function AccessPanel({
  notebook,
  access,
  base,
}: {
  notebook: Notebook;
  access: Access;
  base: string;
}) {
  if (access.state === "active") {
    return (
      <section
        aria-labelledby="access-heading"
        className="rounded-panel border border-border bg-card p-6 shadow-soft sm:p-7"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2
            id="access-heading"
            className="font-display text-lg font-semibold tracking-tight text-foreground"
          >
            Yours to download
          </h2>
        </div>

        <p className="mt-1.5 text-sm leading-6 text-muted">
          Three cuts of the same book. Take the one that matches how you read.
        </p>

        <Downloads notebook={notebook} />


      </section>
    );
  }

  if (access.state === "anonymous") {
    return (
      <section
        aria-labelledby="access-heading"
        className="rounded-panel border border-border bg-card p-6 shadow-soft sm:p-7"
      >
        <div className="flex items-center gap-2.5">
          <LockIcon className="h-4 w-4 text-subtle" />
          <h2
            id="access-heading"
            className="font-display text-lg font-semibold tracking-tight text-foreground"
          >
            Sign in to read it
          </h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted">
          Sign in and the whole notebook opens, all three editions with it. An
          account is what makes a download belong to someone.
        </p>

        <Link
          href={`${base}/login?next=${encodeURIComponent(`${base}/notebooks/${notebook.slug}`)}`}
          className="mt-5 inline-flex items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-transform duration-300 hover:-translate-y-0.5"
        >
          Sign in with GitHub or Google
        </Link>
      </section>
    );
  }

  // Signed in, has never opened this one.
  return (
    <section
      aria-labelledby="access-heading"
      className="rounded-panel border border-border bg-card p-6 shadow-soft sm:p-7"
    >
      <h2
        id="access-heading"
        className="font-display text-lg font-semibold tracking-tight text-foreground"
      >
        Open this notebook
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        All {notebook.pages} pages, every edition, nothing withheld. It stays
        open: there is no clock on it.
      </p>

      <form action={openNotebookAction} className="mt-5">
        <input type="hidden" name="slug" value={notebook.slug} />
        <button
          type="submit"
          className="inline-flex items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-transform duration-300 hover:-translate-y-0.5"
        >
          Open the notebook
        </button>
      </form>
    </section>
  );
}
