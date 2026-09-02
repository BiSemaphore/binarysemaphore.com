import { describe, it, expect, afterEach } from "vitest";
import { isDevUnlocked } from "@/lib/learn/access";

const NODE_ENV = process.env.NODE_ENV;
const FLAG = process.env.LEARN_UNLOCK;

function set(nodeEnv: string, flag: string | undefined) {
  // NODE_ENV is read-only in the types but writable at runtime.
  (process.env as Record<string, string>).NODE_ENV = nodeEnv;
  if (flag === undefined) delete process.env.LEARN_UNLOCK;
  else process.env.LEARN_UNLOCK = flag;
}

afterEach(() => set(NODE_ENV ?? "test", FLAG));

describe("isDevUnlocked", () => {
  it("unlocks only when both conditions hold", () => {
    set("development", "1");
    expect(isDevUnlocked()).toBe(true);
  });

  // The one that matters. Every Vercel build runs with NODE_ENV=production, so
  // the flag alone must never open the paywall.
  it("stays locked in production even with the flag set", () => {
    set("production", "1");
    expect(isDevUnlocked()).toBe(false);
  });

  it("stays locked in development without the flag", () => {
    set("development", undefined);
    expect(isDevUnlocked()).toBe(false);
    set("development", "0");
    expect(isDevUnlocked()).toBe(false);
    set("development", "true");
    expect(isDevUnlocked()).toBe(false);
  });
});
