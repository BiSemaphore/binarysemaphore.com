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
import { TRIAL_DAYS, daysLeft, type Access } from "@/lib/learn/state";
import { startTrialAction } from "@/app/learn/actions";
import { DiscordIcon, DownloadIcon, LockIcon } from "@/components/icons";
import { site } from "@/lib/site";

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
    const left = access.expiresAt ? daysLeft(access.expiresAt) : null;

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
          {left === null ? null : (
            <p className="font-mono text-xs text-accent-strong">
              {left <= 1 ? "last day" : `${left} days left`}
            </p>
          )}
        </div>

        <p className="mt-1.5 text-sm leading-6 text-muted">
          Three cuts of the same book. Take the one that matches how you read.
        </p>

        <Downloads notebook={notebook} />

        {left === null ? null : (
          <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-subtle">
            Download the files while you have them. They are yours to keep
            offline once saved.
          </p>
        )}
      </section>
    );
  }

  if (access.state === "expired") {
    return (
      <section
        aria-labelledby="access-heading"
        className="rounded-panel border border-border bg-card p-6 shadow-soft sm:p-7"
      >
        <h2
          id="access-heading"
          className="font-display text-lg font-semibold tracking-tight text-foreground"
        >
          Your {TRIAL_DAYS} days are up
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Paid access is not open yet, so there is nothing to buy today. Join the
          Discord and we will say when it is. Anything you already downloaded is
          still yours.
        </p>

        {site.discord ? (
          <a
            href={site.discord}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            <DiscordIcon className="h-4 w-4" />
            Join the Discord
          </a>
        ) : null}
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
          The whole notebook is free for {TRIAL_DAYS} days. No card, no payment.
          We ask for an account so the download link belongs to someone.
        </p>

        <Link
          href={`${base}/login?next=${encodeURIComponent(`${base}/${notebook.slug}`)}`}
          className="mt-5 inline-flex items-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
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
        Open it free for {TRIAL_DAYS} days
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        All {notebook.pages} pages, every edition, nothing withheld. The clock
        starts when you click, and it only runs once for this notebook, so start
        it when you have time to read.
      </p>

      <form action={startTrialAction} className="mt-5">
        <input type="hidden" name="slug" value={notebook.slug} />
        <button
          type="submit"
          className="inline-flex items-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Start reading
        </button>
      </form>
    </section>
  );
}
