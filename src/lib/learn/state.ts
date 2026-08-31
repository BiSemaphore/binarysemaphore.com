/**
 * The access state machine, with no I/O in it.
 *
 * Split from `access.ts` (which talks to Supabase, and so can only run on the
 * server) purely so these can be unit-tested and imported anywhere. The rules
 * about who may read a notebook live here; the queries live next door.
 */

/**
 * How long a free trial lasts, for copy only. The authoritative value is the
 * `interval '7 days'` inside `public.start_learn_trial()`; a client cannot
 * choose its own expiry. Change both together.
 */
export const TRIAL_DAYS = 7;

export type Access =
  /** Not signed in. Nothing has been decided yet. */
  | { state: "anonymous" }
  /** Signed in, but has never opened this notebook. */
  | { state: "none" }
  /** May read it. `expiresAt` is null for a perpetual (paid) grant. */
  | { state: "active"; expiresAt: string | null; source: string }
  /** Had a trial, and it ran out. */
  | { state: "expired"; expiresAt: string };

/** One entitlements row, as selected. */
export type EntitlementRow = {
  product_id: string;
  status: string;
  source: string;
  expires_at: string | null;
};

/** True when the state permits downloading. The only test callers should make. */
export function canRead(access: Access): boolean {
  return access.state === "active";
}

/**
 * Turn a row (or its absence) into an Access. `now` is injectable so the
 * expiry boundary can be tested without waiting a week.
 */
export function toAccess(
  row: EntitlementRow | undefined | null,
  now: number = Date.now(),
): Access {
  if (!row || row.status !== "active") return { state: "none" };

  if (row.expires_at === null) {
    return { state: "active", expiresAt: null, source: row.source };
  }

  return Date.parse(row.expires_at) > now
    ? { state: "active", expiresAt: row.expires_at, source: row.source }
    : { state: "expired", expiresAt: row.expires_at };
}

/** Whole days left on a grant, rounded up. 0 once it has lapsed. */
export function daysLeft(expiresAt: string, now: number = Date.now()): number {
  const ms = Date.parse(expiresAt) - now;
  return ms <= 0 ? 0 : Math.ceil(ms / 86_400_000);
}

/** "6 days left" / "last day" / "expired", for a badge. Null when there is
 * nothing worth showing. */
export function accessLabel(access: Access, now: number = Date.now()): string | null {
  if (access.state === "expired") return "expired";
  if (access.state !== "active") return null;
  if (access.expiresAt === null) return "yours";
  return daysLeft(access.expiresAt, now) <= 1
    ? "last day"
    : `${daysLeft(access.expiresAt, now)} days left`;
}
