import type { ResumeContent, TemplateId } from "@/lib/resume/schema";
import { ClassicTemplate } from "./classic";
import { SwissTemplate } from "./swiss";
import { TwoColTemplate, twoColParts, type ColumnParts } from "./twocol";
import { EditorialTemplate } from "./editorial";
import { TerminalTemplate } from "./terminal";
import { ExecutiveTemplate } from "./executive";
import { MinimalTemplate } from "./minimal";
import { SaasTemplate } from "./saas";
import { AcademicTemplate } from "./academic";
import { ArchitectTemplate } from "./architect";
import { BankerTemplate } from "./banker";
import { BrutalistTemplate } from "./brutalist";
import { NewspaperTemplate } from "./newspaper";
import { MagazineTemplate } from "./magazine";
import { DisplayTemplate } from "./display";
import { DossierTemplate } from "./dossier";
import { IndexcardTemplate } from "./indexcard";
import { LetterpressTemplate } from "./letterpress";
import { MirrorTemplate } from "./mirror";
import { PeriodicalTemplate } from "./periodical";
import { SpecsheetTemplate } from "./specsheet";

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
    case "architect":
      return <ArchitectTemplate content={content} />;
    case "banker":
      return <BankerTemplate content={content} />;
    case "brutalist":
      return <BrutalistTemplate content={content} />;
    case "newspaper":
      return <NewspaperTemplate content={content} />;
    case "magazine":
      return <MagazineTemplate content={content} />;
    case "display":
      return <DisplayTemplate content={content} />;
    case "dossier":
      return <DossierTemplate content={content} />;
    case "indexcard":
      return <IndexcardTemplate content={content} />;
    case "letterpress":
      return <LetterpressTemplate content={content} />;
    case "mirror":
      return <MirrorTemplate content={content} />;
    case "periodical":
      return <PeriodicalTemplate content={content} />;
    case "specsheet":
      return <SpecsheetTemplate content={content} />;
    case "classic":
    default:
      return <ClassicTemplate content={content} />;
  }
}

export type { ColumnParts } from "./twocol";

/**
 * For templates whose layout is two independent column flows, return the parts
 * so the paginator can break each column separately across pages. Returns null
 * for single-flow templates (which paginate as one column).
 */
export function getColumnLayout(
  id: TemplateId,
  content: ResumeContent,
): ColumnParts | null {
  switch (id) {
    case "twocol":
      return twoColParts(content);
    default:
      return null;
  }
}
