import type { ResumeContent, TemplateId } from "@/lib/resume/schema";
import { ClassicTemplate } from "./classic";
import { SwissTemplate } from "./swiss";
import { TwoColTemplate } from "./twocol";
import { EditorialTemplate } from "./editorial";
import { TerminalTemplate } from "./terminal";
import { ExecutiveTemplate } from "./executive";
import { MinimalTemplate } from "./minimal";
import { SaasTemplate } from "./saas";
import { AcademicTemplate } from "./academic";

/**
 * Renders a resume with the chosen template. One source of truth so the editor
 * preview and the PDF export stay in sync.
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
    case "executive":
      return <ExecutiveTemplate content={content} />;
    case "minimal":
      return <MinimalTemplate content={content} />;
    case "saas":
      return <SaasTemplate content={content} />;
    case "academic":
      return <AcademicTemplate content={content} />;
    case "classic":
    default:
      return <ClassicTemplate content={content} />;
  }
}
