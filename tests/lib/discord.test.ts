import { describe, it, expect } from "vitest";
import { site } from "@/lib/site";

describe("the Discord invite", () => {
  // Everything on the site links to /discord, which redirects here. That is the
  // whole point: the invite can be replaced without breaking a link already
  // printed in a notebook or posted somewhere we do not control.
  it("is a discord invite url, or empty to hide the links", () => {
    if (site.discord === "") return;
    expect(site.discord).toMatch(
      /^https:\/\/(discord\.gg|discord\.com\/invite)\/[A-Za-z0-9-]+$/,
    );
  });
});
