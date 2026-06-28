import { describe, it, expect } from "vitest";
import { templatePrompt } from "./prompt";
import { TEMPLATES } from "./schema";

describe("templatePrompt", () => {
  it("names the template and asks for the resume sections", () => {
    const prompt = templatePrompt(TEMPLATES[0]);
    expect(prompt).toContain(TEMPLATES[0].label);
    expect(prompt).toMatch(/experience/i);
    expect(prompt).toMatch(/skills/i);
  });
});
