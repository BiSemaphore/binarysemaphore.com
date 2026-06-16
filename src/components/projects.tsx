import Image from "next/image";
import Link from "next/link";
import { projects, site, type Project } from "@/lib/site";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { ArrowUpRightIcon, GitHubIcon } from "@/components/icons";

function ProjectCard({ project }: { project: Project }) {
  // Projects with a slug get an internal detail page; others link to GitHub.
  const internal = Boolean(project.slug);
  const href = internal ? `/projects/${project.slug}` : project.href;
  const cardClass =
    "group relative flex w-full flex-col overflow-hidden rounded-panel border border-border bg-card shadow-soft transition-transform duration-200 hover:-translate-y-1";

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
            <span className="rounded-full bg-accent px-2.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wider text-white">
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
            className="rounded-full bg-background px-2.5 py-1 font-mono text-xs text-subtle ring-1 ring-inset ring-border"
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
    <section id="projects" className="section scroll-mt-20">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <SectionHeading label="Projects" title="What we're building" />

        <div className="grid gap-5 lg:grid-cols-2">
          {projects.map((project, i) => (
            <Reveal key={project.name} delay={(i % 2) * 80} className="flex">
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </div>

        <p className="mt-8 text-sm text-subtle">
          Everything is open source on{" "}
          <a
            href={site.org}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-accent-strong underline-offset-4 hover:underline"
          >
            <GitHubIcon className="h-3.5 w-3.5" />
            GitHub
          </a>
          .
        </p>
      </div>
    </section>
  );
}
