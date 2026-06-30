import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { rich } from "@/lib/resume/richtext";

// Normalize non-breaking spaces (used in list prefixes) to plain spaces.
const html = (s: string) =>
  renderToStaticMarkup(<>{rich(s)}</>).replace(/\u00A0/g, " ");

describe("rich", () => {
  it("renders nothing for empty input", () => {
    expect(rich("")).toBeNull();
    expect(rich("   ")).toBeNull();
  });

  it("renders bold, italic, and underline", () => {
    expect(html("a **b** c")).toContain("<strong>b</strong>");
    expect(html("a *b* c")).toContain("<em>b</em>");
    expect(html("a ++b++ c")).toContain("<u>b</u>");
  });

  it("renders safe links and upgrades bare domains", () => {
    expect(html("[site](https://x.com)")).toContain('href="https://x.com"');
    expect(html("[site](x.com)")).toContain('href="https://x.com"');
  });

  it("does not emit javascript: links", () => {
    const out = html("[x](javascript:alert(1))");
    expect(out).not.toContain("javascript:");
    expect(out).not.toContain("<a");
  });

  it("renders bullet and numbered lines", () => {
    // A bullet line gets a marker prefix (so it differs from plain text).
    expect(html("- one")).toContain("one");
    expect(html("- one")).not.toEqual(html("one"));
    expect(html("1. one")).toContain("1. one");
  });
});
