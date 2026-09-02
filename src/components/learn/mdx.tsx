import type { ReactNode } from "react";

/**
 * The study notebooks' own vocabulary, as MDX components.
 *
 * The books are written with eight annotation blocks and four highlighters,
 * specified in `learnings/notebooks/AUTHORING.md`, and typeset into PDFs by a
 * pipeline next door. `scripts/sync-notebooks.mjs` rewrites those directives
 * into these components so the web renders the same book.
 *
 * The blocks are given distinct weights on purpose. Each has one job, and if
 * they all look alike the reader stops seeing any of them.
 */

type Props = { children?: ReactNode };

function Block({
  label,
  box,
  tint,
  children,
}: Props & { label: string; box: string; tint: string }) {
  return (
    <aside className={`my-7 rounded-card px-5 py-4 sm:px-6 ${box}`}>
      <p
        className={`mb-2 font-mono text-[0.65rem] uppercase tracking-[0.16em] ${tint}`}
      >
        {label}
      </p>
      {children}
    </aside>
  );
}

/** A question the reader should expect. The body is the answer. */
export const Ask = (p: Props) => (
  <Block
    label="Interviewer asks"
    box="border-l-2 border-l-blue/60 bg-blue/[0.04]"
    tint="text-blue"
    {...p}
  />
);

/** The one sentence that reads as senior. */
export const Signal = (p: Props) => (
  <Block
    label="Senior signal"
    box="border-l-2 border-l-accent/60 bg-accent/[0.05]"
    tint="text-accent-strong"
    {...p}
  />
);

/** A plausible answer that is wrong. */
export const Trap = (p: Props) => (
  <Block
    label="Trap"
    box="border-l-2 border-l-sun bg-sun/[0.08]"
    tint="text-foreground/70"
    {...p}
  />
);

/** The concrete practice, in the form you would apply it. */
export const DoThis = (p: Props) => (
  <Block
    label="Do this"
    box="border-l-2 border-l-violet/60 bg-violet/[0.05]"
    tint="text-violet"
    {...p}
  />
);

/** The one thing to carry away. At most one per section. */
export const KeyIdea = (p: Props) => (
  <Block
    label="Key idea"
    box="border border-foreground/15 bg-card"
    tint="text-foreground"
    {...p}
  />
);

/** Study prompts. Dashed, because in print they are blank lines to write on. */
export const Recall = (p: Props) => (
  <Block
    label="Recall"
    box="border border-dashed border-border"
    tint="text-subtle"
    {...p}
  />
);
export const Quiz = (p: Props) => (
  <Block
    label="Question"
    box="border border-dashed border-border"
    tint="text-subtle"
    {...p}
  />
);
export const Redraw = (p: Props) => (
  <Block
    label="Redraw it"
    box="border border-dashed border-border"
    tint="text-subtle"
    {...p}
  />
);

/** A glossed word, defined where it first appears. */
export function Term({ name, children }: Props & { name?: string }) {
  return (
    <aside className="my-7 border-l-2 border-l-border pl-5">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-subtle">
        {name}
      </p>
      <div className="mt-1.5">{children}</div>
    </aside>
  );
}

/** A drawn figure in the PDF. On the web the caption carries the argument. */
export function Figure({ children }: Props) {
  return (
    <figure className="my-7 rounded-card border border-dashed border-border px-5 py-4">
      <figcaption className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-subtle">
        Figure, drawn in the PDF editions
      </figcaption>
      <div className="mt-2">{children}</div>
    </figure>
  );
}

/**
 * The four highlighters, drawn as a marker stroke behind the text rather than a
 * filled box, so a marked phrase still reads as part of its sentence. Colours
 * live in globals.css so light and dark can differ.
 */
export const Peach = (p: Props) => <span className="nb-mark nb-mark-peach" {...p} />;
export const Rose = (p: Props) => <span className="nb-mark nb-mark-rose" {...p} />;
export const Mint = (p: Props) => <span className="nb-mark nb-mark-mint" {...p} />;
export const Pink = (p: Props) => <span className="nb-mark nb-mark-pink" {...p} />;

/** ((circle)): the PDF draws a hand-authored ellipse; on screen, an outline. */
export const Circle = (p: Props) => <span className="nb-circle" {...p} />;

/** Everything the generated MDX can reference, for the MDX provider. */
export const notebookComponents = {
  Ask,
  Signal,
  Trap,
  DoThis,
  KeyIdea,
  Recall,
  Quiz,
  Redraw,
  Term,
  Figure,
  Peach,
  Rose,
  Mint,
  Pink,
  Circle,
};
