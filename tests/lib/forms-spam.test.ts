import { describe, expect, it } from "vitest";
import { isRateLimited, spamVerdict } from "@/lib/forms/spam";

describe("spamVerdict", () => {
  const now = 1_000_000;

  it("passes a normal submission", () => {
    expect(spamVerdict({ name: "A", website: "", started: String(now - 20_000) }, now)).toBe("ok");
  });

  it("catches a filled honeypot", () => {
    expect(spamVerdict({ website: "https://spam.example" }, now)).toBe("honeypot");
  });

  it("catches a form submitted within three seconds of rendering", () => {
    expect(spamVerdict({ started: String(now - 1_500) }, now)).toBe("too_fast");
    expect(spamVerdict({ started: String(now - 3_000) }, now)).toBe("ok");
  });

  it("does not punish a missing or unreadable timestamp", () => {
    expect(spamVerdict({}, now)).toBe("ok");
    expect(spamVerdict({ started: "yesterday" }, now)).toBe("ok");
  });
});

describe("isRateLimited", () => {
  it("recognises the database's cap message and nothing else", () => {
    expect(isRateLimited({ message: "too many messages from this address today" })).toBe(true);
    expect(isRateLimited({ message: "bad email" })).toBe(false);
    expect(isRateLimited(null)).toBe(false);
  });
});
