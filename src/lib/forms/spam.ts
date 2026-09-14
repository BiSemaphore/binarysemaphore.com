/**
 * Spam checks shared by the contact and mentorship forms.
 *
 * Two signals a browser with a person behind it never produces:
 *  - the honeypot: a field called `website` that is hidden from people and
 *    filled in by bots that complete every input they find;
 *  - the fill time: a form submitted under three seconds after it was
 *    rendered. Nobody types a message that fast.
 *
 * Either one means the message is dropped. The caller answers as if it had
 * been stored, so a bot learns nothing from the response. The third layer,
 * a cap per email address, lives in the database function that stores the
 * message, because that is the only place that can count.
 */

export const HONEYPOT_FIELD = "website";
export const STARTED_FIELD = "started";
const MIN_FILL_MS = 3_000;

export type SpamVerdict = "ok" | "honeypot" | "too_fast";

export function spamVerdict(
  data: Record<string, unknown>,
  now: number = Date.now(),
): SpamVerdict {
  if (String(data[HONEYPOT_FIELD] ?? "").trim() !== "") return "honeypot";
  const started = Number(data[STARTED_FIELD]);
  // A missing or unreadable timestamp is not held against the sender: an
  // older cached form, or a browser with scripts blocked, still gets through.
  if (Number.isFinite(started) && started > 0 && now - started < MIN_FILL_MS) {
    return "too_fast";
  }
  return "ok";
}

/** True when the database refused the message because the address hit its daily cap. */
export function isRateLimited(error: { message: string } | null): boolean {
  return Boolean(error && /too many messages/i.test(error.message));
}
