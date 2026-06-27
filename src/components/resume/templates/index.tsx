import type { ResumeContent, TemplateId } from "@/lib/resume/schema";
import { ClassicTemplate } from "./classic";
import { SwissTemplate } from "./swiss";
import { TwoColTemplate } from "./twocol";
import { EditorialTemplate } from "./editorial";
import { TerminalTemplate } from "./terminal";

/**
 * Renders a resume with the chosen template. One source of truth so the editor
 * preview and the (future) PDF export stay in sync.
 */
export function renderTemplate(id: TemplateId, content: ResumeContent) {
  switch (id) {
    case "swiss":
      return <SwissTemplate content={content} />;
    case "twocol":
      return <TwoColTemplate content={content} />;
    case "editorial":
      return <EditorialTemplate content={content} />;
    case "terminal":
      return <TerminalTemplate content={content} />;
    case "classic":
    default:
      return <ClassicTemplate content={content} />;
  }
}
