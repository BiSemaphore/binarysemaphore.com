import type { Project } from "@/lib/site";
import { projectLink } from "@/lib/subdomains";
import { CardChip, CardTile, TrayCard } from "@/components/team-member/tray-card";

/** A product the member builds at the studio, linked to where it lives. */
export function StudioBuildCard({ project }: { project: Project }) {
  const { href, internal, host } = projectLink(project);

  return (
    <TrayCard
      href={href}
      internal={internal}
      footer={host ?? (internal ? "Product page" : "Source")}
    >
      <div className="flex items-center gap-3">
        <CardTile label={project.name} />
        <span className="text-sm font-semibold text-foreground">
          {project.name}
        </span>
      </div>
      <h3 className="mt-5 font-display text-xl font-bold leading-snug tracking-tight text-foreground">
        {project.tagline}
      </h3>
      <ul className="mt-auto flex flex-wrap gap-2 pt-5">
        {project.tags.map((tag) => (
          <li key={tag}>
            <CardChip>{tag}</CardChip>
          </li>
        ))}
      </ul>
    </TrayCard>
  );
}
