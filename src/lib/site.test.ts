import { describe, it, expect } from "vitest";
import { site, projects, team, getTeamMember } from "./site";

describe("site config", () => {
  it("has the core identity fields", () => {
    expect(site.wordmark).toBeTruthy();
    expect(site.tagline).toBeTruthy();
    expect(site.hero.primary.href).toBeTruthy();
  });

  it("uses a valid contact email", () => {
    expect(site.email).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  });

  it("uses https for external profile links when set", () => {
    for (const url of [site.linkedin, site.org, site.instagram]) {
      if (url) expect(url).toMatch(/^https:\/\//);
    }
  });
});

describe("projects", () => {
  it("has unique slugs", () => {
    const slugs = projects.map((p) => p.slug).filter(Boolean);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every project a name, tagline and tags", () => {
    for (const p of projects) {
      expect(p.name).toBeTruthy();
      expect(p.tagline).toBeTruthy();
      expect(Array.isArray(p.tags)).toBe(true);
    }
  });
});

describe("team", () => {
  it("has unique slugs", () => {
    const slugs = team.map((m) => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("is resolvable by slug via getTeamMember", () => {
    for (const m of team) {
      expect(getTeamMember(m.slug)?.name).toBe(m.name);
    }
  });
});

describe("footer links", () => {
  it("every link has a label and a resolvable href", () => {
    for (const col of site.footerColumns) {
      for (const link of col.links) {
        expect(link.label).toBeTruthy();
        expect(link.href).toMatch(/^(\/|https?:\/\/|mailto:)/);
      }
    }
  });
});
