import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { renderTemplate } from "@/components/resume/templates/index";
import {
  TEMPLATES,
  emptyResume,
  type ResumeContent,
} from "@/lib/resume/schema";

const sample: ResumeContent = {
  basics: {
    name: "Avery Park",
    title: "Senior Software Engineer",
    email: "avery@example.com",
    phone: "",
    location: "New York, NY",
    website: "averypark.dev",
    summary: "I build resilient backend systems.",
  },
  experience: [
    {
      company: "Coral Labs",
      companyUrl: "",
      role: "Senior Software Engineer",
      start: "2022",
      end: "2024",
      current: false,
      bullets: ["Migrated the events pipeline."],
    },
  ],
  education: [
    { school: "Northern State University", degree: "B.S.", field: "CS", start: "2014", end: "2018" },
  ],
  skills: ["Go", "TypeScript"],
  projects: [{ name: "Loomroute", description: "URL router", link: "loomroute.dev" }],
  links: [{ label: "GitHub", url: "github.com/averypark" }],
};

describe("resume templates", () => {
  for (const t of TEMPLATES) {
    it(`renders ${t.id} with empty content without throwing`, () => {
      const html = renderToStaticMarkup(renderTemplate(t.id, emptyResume()));
      expect(html.length).toBeGreaterThan(0);
    });

    it(`renders ${t.id} with sample content`, () => {
      const html = renderToStaticMarkup(renderTemplate(t.id, sample));
      // Name may be split across spans in some templates, so check a token.
      expect(html).toContain("Avery");
      expect(html).toContain("Coral Labs");
      expect(html).toContain("Loomroute");
    });
  }
});
