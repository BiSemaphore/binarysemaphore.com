import { describe, it, expect } from "vitest";
import {
  TRIAL_DAYS,
  accessLabel,
  canRead,
  daysLeft,
  toAccess,
  type EntitlementRow,
} from "@/lib/learn/state";

const NOW = Date.parse("2026-09-01T12:00:00Z");
const inDays = (n: number) => new Date(NOW + n * 86_400_000).toISOString();

function row(over: Partial<EntitlementRow> = {}): EntitlementRow {
  return {
    product_id: "postgres",
    status: "active",
    source: "trial",
    expires_at: inDays(TRIAL_DAYS),
    ...over,
  };
}

describe("toAccess", () => {
  it("is 'none' when there is no row", () => {
    expect(toAccess(undefined, NOW)).toEqual({ state: "none" });
    expect(toAccess(null, NOW)).toEqual({ state: "none" });
  });

  it("is 'active' for a live trial", () => {
    expect(toAccess(row(), NOW)).toEqual({
      state: "active",
      expiresAt: inDays(TRIAL_DAYS),
      source: "trial",
    });
  });

  it("is 'expired' once the trial is past", () => {
    expect(toAccess(row({ expires_at: inDays(-1) }), NOW)).toEqual({
      state: "expired",
      expiresAt: inDays(-1),
    });
  });

  it("expires exactly on the boundary rather than a moment after", () => {
    const at = new Date(NOW).toISOString();
    expect(toAccess(row({ expires_at: at }), NOW).state).toBe("expired");
  });

  // What a paid grant will look like once payments land. Written now so the
  // behaviour is pinned before there is a webhook to get it wrong.
  it("treats a null expiry as perpetual access", () => {
    expect(toAccess(row({ source: "stripe", expires_at: null }), NOW)).toEqual({
      state: "active",
      expiresAt: null,
      source: "stripe",
    });
  });

  it("ignores a revoked row even when its expiry is in the future", () => {
    expect(toAccess(row({ status: "revoked" }), NOW)).toEqual({ state: "none" });
  });
});

describe("canRead", () => {
  it("is true only for an active grant", () => {
    expect(canRead({ state: "active", expiresAt: null, source: "stripe" })).toBe(
      true,
    );
    expect(canRead({ state: "expired", expiresAt: inDays(-1) })).toBe(false);
    expect(canRead({ state: "none" })).toBe(false);
    expect(canRead({ state: "anonymous" })).toBe(false);
  });
});

describe("daysLeft", () => {
  it("rounds a part-day up, so a few hours still reads as a day", () => {
    expect(daysLeft(new Date(NOW + 3_600_000).toISOString(), NOW)).toBe(1);
  });

  it("counts a full trial", () => {
    expect(daysLeft(inDays(TRIAL_DAYS), NOW)).toBe(TRIAL_DAYS);
  });

  it("is 0 once lapsed", () => {
    expect(daysLeft(inDays(-2), NOW)).toBe(0);
  });
});

describe("accessLabel", () => {
  it("counts down, then says 'last day'", () => {
    const label = (days: number) =>
      accessLabel(
        { state: "active", expiresAt: inDays(days), source: "trial" },
        NOW,
      );
    expect(label(6)).toBe("6 days left");
    expect(label(2)).toBe("2 days left");
    expect(label(0.5)).toBe("last day");
  });

  it("says 'yours' for a perpetual grant", () => {
    expect(
      accessLabel({ state: "active", expiresAt: null, source: "stripe" }, NOW),
    ).toBe("yours");
  });

  it("shows nothing for states with no badge to draw", () => {
    expect(accessLabel({ state: "none" }, NOW)).toBeNull();
    expect(accessLabel({ state: "anonymous" }, NOW)).toBeNull();
  });

  it("says 'expired' after the trial", () => {
    expect(accessLabel({ state: "expired", expiresAt: inDays(-1) }, NOW)).toBe(
      "expired",
    );
  });
});
