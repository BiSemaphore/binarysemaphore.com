/**
 * The access state machine, with no I/O in it.
 *
 * Split from `access.ts` (which talks to Supabase, and so can only run on the
 * server) purely so these can be unit-tested and imported anywhere. The rules
 * about who may read a notebook live here; the queries live next door.
 */

export type Access =
  /** Not signed in. Nothing has been decided yet. */
  | { state: "anonymous" }
  /** Signed in, but has never opened this notebook. */
  | { state: "none" }
  /** May read it. `expiresAt` is null, which is every grant now. */
  | { state: "active"; expiresAt: string | null; source: string }
  /** A grant from before access became permanent, which had run out. Kept so an
   * old row cannot silently read as active. */
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

/**
 * The badge on a notebook card. Null when there is nothing worth showing.
 *
 * No countdown: access does not expire. These notebooks expand someone else's
 * lectures, so a clock ticking towards a payment prompt would be the wrong
 * thing to put on them.
 */
export function accessLabel(access: Access): string | null {
  if (access.state === "expired") return null;
  return access.state === "active" ? "yours" : null;
}
