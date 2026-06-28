import type { Template } from "@/lib/resume/schema";

/**
 * A ready-to-paste prompt for an AI assistant (ChatGPT, Claude, etc.) to draft
 * resume content tailored to a template. Copied from the template cards so
 * people can generate first-draft content, then paste it into the builder.
 */
export function templatePrompt(template: Template): string {
  return [
    `Help me write my resume for the "${template.label}" template (${template.description.toLowerCase()})`,
    "",
    "Ask me about my background, then draft concise, results-oriented content for these sections:",
    "- Basics: full name, professional title, email, phone, location, website, and a 2-3 sentence summary",
    "- Experience: for each role — title, company, start/end dates, and 2-4 achievement bullets (start with a strong verb, quantify impact)",
    "- Education: school, degree, field, dates",
    "- Skills: a short comma-separated list",
    "- Projects: name, one-line description, link",
    "- Links: label and URL",
    "",
    "Keep everything truthful, concise, and ATS-friendly. Start by asking me what to put in each section.",
  ].join("\n");
}
