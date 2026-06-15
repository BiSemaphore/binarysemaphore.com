import Image from "next/image";
import Link from "next/link";
import { projects, type Project } from "@/lib/site";
import { SectionHeading } from "@/components/section-heading";
import { ArrowUpRightIcon, GitHubIcon } from "@/components/icons";

function ProjectCard({ project }: { project: Project }) {
  // Projects with a slug get an internal detail page; others link to GitHub.
  const internal = Boolean(project.slug);
  const href = internal ? `/projects/${project.slug}` : project.href;
  const cardClass =
    "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-accent/40 hover:bg-card-hover";

  const content = (
    <>
      {project.image ? (
        <div className="relative aspect-[1200/627] w-full overflow-hidden border-b border-border">
          <Image
            src={project.image}
            alt={`${project.name} preview`}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-mono text-lg font-medium text-foreground">
          {project.name}
          {project.featured ? (
            <span className="rounded-full border border-accent/30 px-2 py-0.5 font-sans text-[10px] uppercase tracking-wider text-accent-strong">
              Featured
            </span>
          ) : null}
        </h3>
        <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-subtle transition-colors group-hover:text-accent" />
      </div>

      <p className="mb-2 text-sm font-medium text-foreground">
        {project.tagline}
      </p>
      <p className="mb-5 text-sm leading-6 text-muted">{project.description}</p>

      <div className="mt-auto flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-background px-2 py-1 font-mono text-xs text-subtle ring-1 ring-inset ring-border"
          >
            {tag}
          </span>
        ))}
      </div>
      </div>
    </>
  );

  return internal ? (
    <Link href={href} className={cardClass} aria-label={`${project.name} — details`}>
      {content}
    </Link>
  ) : (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={cardClass}
    >
      {content}
    </a>
  );
}

export function Projects() {
  return (
    <section
      id="projects"
      className="scroll-mt-20 border-t border-border py-16 sm:py-20"
    >
      <SectionHeading label="02 / projects" title="Things I've shipped" />

      <div className="grid gap-4 sm:grid-cols-1">
        {projects.map((project) => (
          <ProjectCard key={project.name} project={project} />
        ))}
      </div>

      <p className="mt-6 text-sm text-subtle">
        More on{" "}
        <a
          href="https://github.com/shahid-io"
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 text-accent-strong underline-offset-4 hover:underline"
        >
          <GitHubIcon className="h-3.5 w-3.5" />
          GitHub
        </a>
        .
      </p>
    </section>
  );
}
