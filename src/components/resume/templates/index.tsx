import type { ResumeContent, TemplateId } from "@/lib/resume/schema";
import { ClassicTemplate } from "./classic";

/**
 * Renders a resume with the chosen template. Only `classic` exists in Phase 2;
 * the other ids fall back to it until their designs land (Phase 3). One source
 * of truth so the editor preview and the (future) PDF export stay in sync.
 */
export function renderTemplate(id: TemplateId, content: ResumeContent) {
  switch (id) {
    case "classic":
    default:
      return <ClassicTemplate content={content} />;
  }
}
