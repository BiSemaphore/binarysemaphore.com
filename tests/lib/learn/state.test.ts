import { describe, it, expect } from "vitest";
import {
  accessLabel,
  canRead,
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
    expires_at: inDays(7),
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
      expiresAt: inDays(7),
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

describe("accessLabel", () => {
  // No countdown any more: access does not expire, and a clock ticking towards
  // a payment prompt would be the wrong thing on someone else's teaching.
  it("says 'yours' for a grant", () => {
    expect(
      accessLabel({ state: "active", expiresAt: null, source: "account" }),
    ).toBe("yours");
  });

  it("shows nothing for a reader without one", () => {
    expect(accessLabel({ state: "none" })).toBeNull();
    expect(accessLabel({ state: "anonymous" })).toBeNull();
  });

  it("shows nothing for an old expired row rather than nagging", () => {
    expect(accessLabel({ state: "expired", expiresAt: inDays(-1) })).toBeNull();
  });
});
