import { describe, it, expect } from "vitest";
import { summarise } from "@/lib/learn/progress";

describe("summarise", () => {
  it("counts what has been read", () => {
    expect(summarise(new Set(["a", "b", "c"]), 10)).toMatchObject({
      count: 3,
      total: 10,
      percent: 30,
      complete: false,
    });
  });

  it("is complete when every section is read", () => {
    expect(summarise(new Set(["a", "b"]), 2).complete).toBe(true);
  });

  // A renamed section leaves a dead row, so read can exceed the section count.
  // That must read as finished, not as 120%.
  it("does not exceed complete when a stale section is counted", () => {
    const done = summarise(new Set(["a", "b", "gone"]), 2);
    expect(done.complete).toBe(true);
  });

  it("is zero, not NaN, for a book with no sections", () => {
    expect(summarise(new Set(), 0)).toMatchObject({ percent: 0, complete: false });
  });

  it("rounds the percentage", () => {
    expect(summarise(new Set(["a"]), 3).percent).toBe(33);
  });
});
