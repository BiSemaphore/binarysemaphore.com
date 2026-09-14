// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { JsonLd, articleJsonLd, organizationJsonLd, personJsonLd } from "@/components/json-ld";
import { team } from "@/lib/site";

describe("JsonLd", () => {
  it("escapes a closing script tag inside the data", () => {
    const html = renderToStaticMarkup(<JsonLd data={{ name: "</script><b>x" }} />);
    expect(html).toContain('type="application/ld+json"');
    expect(html).not.toContain("</script><b>");
    expect(html).toContain("\\u003c/script>");
  });
});

describe("shapes", () => {
  it("describes the studio with only real links", () => {
    const org = organizationJsonLd();
    expect(org["@type"]).toBe("Organization");
    expect(org.url).toBe("https://binarysemaphore.com");
    expect((org.sameAs as string[]).every((u) => u.startsWith("https://"))).toBe(true);
  });

  it("gives an article its own url, date and publisher", () => {
    const a = articleJsonLd({
      slug: "why-a-semaphore",
      title: "Why a semaphore",
      description: "d",
      date: "2026-09-01",
      tags: ["go"],
      readingMinutes: 4,
    });
    expect(a.url).toBe("https://binarysemaphore.com/threads/why-a-semaphore");
    expect(a.datePublished).toBe("2026-09-01");
    expect((a.publisher as { name: string }).name).toBe("Binary Semaphore");
  });

  it("builds a person from the real team data", () => {
    const p = personJsonLd(team[0]);
    expect(p["@type"]).toBe("Person");
    expect(p.name).toBe(team[0].name);
    expect(p.url).toBe(`https://binarysemaphore.com/team/${team[0].slug}`);
    expect((p.worksFor as { name: string }).name).toBe("Binary Semaphore");
  });
});
