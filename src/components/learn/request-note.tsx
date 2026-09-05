import Link from "next/link";
import { getCurrentUser } from "@/utils/supabase/auth";
import { hasRequested, MAX_NOTE } from "@/lib/learn/note-requests";
import { learnBase } from "@/lib/learn/paths";
import { requestNoteAction, withdrawNoteAction } from "@/app/learn/actions";
import { CheckIcon, ArrowRightIcon } from "@/components/icons";

/**
 * "Ask us to write this up."
 *
 * Reusable on purpose: it takes a subject slug and nothing else, so the same
 * component works on a topic page, a roadmap stop, or anywhere else we have not
 * written something yet. It is a server component, so the signed-in and
 * already-asked states are resolved before render with no loading flicker and no
 * client JavaScript beyond the form post.
 *
 * Signing in is required, and that is the point rather than friction: an
 * anonymous vote is noise, and a request is only useful if we can tell one
 * person asking five times from five people asking once. The email is never
 * collected here; `auth.users` already has it.
 */
export async function RequestNote({
  subject,
  title,
}: {
  /** Stored verbatim. For a topic this is its slug. */
  subject: string;
  /** What to call it in the copy, e.g. "Operating Systems". */
  title: string;
}) {
  const [user, base] = await Promise.all([getCurrentUser(), learnBase()]);
  const requested = user ? await hasRequested(subject) : false;

  if (!user) {
    return (
      <div className="rounded-card border border-border bg-card px-6 py-6">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-subtle">
          Want this written up?
        </p>
        <p className="mt-3 leading-7 text-muted">
          Sign in and tell us. We write the ones people actually ask for, and
          asking takes one click.
        </p>
        <Link
          href={`${base}/login`}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-transform duration-300 hover:-translate-y-0.5"
        >
          Sign in to ask
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  if (requested) {
    return (
      <div className="rounded-card border border-border bg-card px-6 py-6">
        <p className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-subtle">
          <CheckIcon className="h-3.5 w-3.5" />
          You asked for this
        </p>
        <p className="mt-3 leading-7 text-muted">
          It is on the list. We work through these by how many people are
          waiting, so this genuinely moved it.
        </p>
        <form action={withdrawNoteAction} className="mt-4">
          <input type="hidden" name="topic" value={subject} />
          <button
            type="submit"
            className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-subtle underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
          >
            Withdraw
          </button>
        </form>
      </div>
    );
  }

  return (
    <form
      action={requestNoteAction}
      className="rounded-card border border-border bg-card px-6 py-6"
    >
      <input type="hidden" name="topic" value={subject} />

      <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-subtle">
        Want this written up?
      </p>
      <p className="mt-3 leading-7 text-muted">
        Ask for {title} and we will know somebody is waiting. We write the ones
        people actually ask for.
      </p>

      {/* Closed by default: one click should be enough, and a textarea nobody
          asked for makes the ask feel like a form. */}
      <details className="group mt-4">
        <summary className="cursor-pointer list-none font-mono text-[0.65rem] uppercase tracking-[0.16em] text-subtle transition-colors hover:text-foreground">
          Add what you are stuck on
          <span aria-hidden className="ml-2 group-open:hidden">
            +
          </span>
          <span aria-hidden className="ml-2 hidden group-open:inline">
            &minus;
          </span>
        </summary>
        <textarea
          name="note"
          rows={3}
          maxLength={MAX_NOTE}
          placeholder="Optional. The part that is not going in is the useful bit."
          className="mt-3 w-full rounded-card border border-border bg-background px-3 py-2 text-sm leading-6 text-foreground placeholder:text-subtle focus:border-foreground/40 focus:outline-none"
        />
      </details>

      <button
        type="submit"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-transform duration-300 hover:-translate-y-0.5"
      >
        Ask for these notes
        <ArrowRightIcon className="h-4 w-4" />
      </button>
    </form>
  );
}
