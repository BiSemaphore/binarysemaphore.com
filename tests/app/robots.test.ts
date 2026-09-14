import { describe, expect, it } from "vitest";
import robots from "@/app/robots";

describe("robots.txt", () => {
  it("allows the public site, blocks admin and auth, and points at the sitemap", () => {
    const r = robots();
    const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rule.allow).toBe("/");
    expect(rule.disallow).toEqual(expect.arrayContaining(["/admin", "/api/", "/auth/"]));
    expect(r.sitemap).toBe("https://binarysemaphore.com/sitemap.xml");
  });
});
