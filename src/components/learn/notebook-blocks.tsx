import { CALLOUTS, type Block, type CalloutKind } from "@/lib/learn/parse";
import { renderMarkdown } from "@/lib/learn/render";

/**
 * The books' five annotation blocks plus the three study prompts, each with one
 * job (see learnings/notebooks/AUTHORING.md). They are given distinct weights
 * rather than one generic callout style, because the distinction is the point:
 * if every block looks alike the reader stops seeing any of them.
 */
const STYLES: Record<CalloutKind, { box: string; label: string }> = {
  ask: {
    box: "border-l-2 border-l-blue/60 bg-blue/[0.04]",
    label: "text-blue",
  },
  signal: {
    box: "border-l-2 border-l-accent/60 bg-accent/[0.05]",
    label: "text-accent-strong",
  },
  trap: {
    box: "border-l-2 border-l-sun bg-sun/[0.08]",
    label: "text-foreground/70",
  },
  do: {
    box: "border-l-2 border-l-violet/60 bg-violet/[0.05]",
    label: "text-violet",
  },
  key: {
    box: "border border-foreground/15 bg-card",
    label: "text-foreground",
  },
  recall: {
    box: "border border-dashed border-border bg-transparent",
    label: "text-subtle",
  },
  quiz: {
    box: "border border-dashed border-border bg-transparent",
    label: "text-subtle",
  },
  redraw: {
    box: "border border-dashed border-border bg-transparent",
    label: "text-subtle",
  },
};

async function Prose({ markdown }: { markdown: string }) {
  const html = await renderMarkdown(markdown);
  // Trusted content: our own books, committed to this repo. See render.ts.
  return <div className="notebook" dangerouslySetInnerHTML={{ __html: html }} />;
}

async function Callout({
  kind,
  markdown,
}: {
  kind: CalloutKind;
  markdown: string;
}) {
  const style = STYLES[kind];
  return (
    <aside className={`my-7 rounded-card px-5 py-4 sm:px-6 ${style.box}`}>
      <p
        className={`mb-2 font-mono text-[0.65rem] uppercase tracking-[0.16em] ${style.label}`}
      >
        {CALLOUTS[kind]}
      </p>
      <Prose markdown={markdown} />
    </aside>
  );
}

async function Term({ term, markdown }: { term: string; markdown: string }) {
  return (
    <aside className="my-7 border-l-2 border-l-border pl-5">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-subtle">
        {term}
      </p>
      <div className="mt-1.5">
        <Prose markdown={markdown} />
      </div>
    </aside>
  );
}

/** A drawn figure in the PDF. On the web the caption carries the argument, and
 * the reader is told where the drawing is. */
async function Figure({ markdown }: { name: string; markdown: string }) {
  return (
    <figure className="my-7 rounded-card border border-dashed border-border px-5 py-4">
      <figcaption className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-subtle">
        Figure, drawn in the PDF editions
      </figcaption>
      <div className="mt-2">
        <Prose markdown={markdown} />
      </div>
    </figure>
  );
}

function Code({ language, code }: { language: string; code: string }) {
  return (
    <div className="notebook my-6">
      <pre>
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
}

/** Render a run of parsed blocks. */
export function NotebookBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "prose":
            return <Prose key={i} markdown={block.markdown} />;
          case "callout":
            return (
              <Callout key={i} kind={block.callout} markdown={block.markdown} />
            );
          case "term":
            return <Term key={i} term={block.term} markdown={block.markdown} />;
          case "figure":
            return (
              <Figure key={i} name={block.name} markdown={block.markdown} />
            );
          case "code":
            return (
              <Code key={i} language={block.language} code={block.code} />
            );
        }
      })}
    </>
  );
}
