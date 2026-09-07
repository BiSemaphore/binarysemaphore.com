import {
  BoldMark,
  HighlightMark,
  StrokeMark,
  type BoldProps,
  type HighlightProps,
  type MarkProps,
} from "@/components/annotate/shapes";

/**
 * The pen marks, already drawn.
 *
 * Same geometry, same palette, same defaults as the animated ones: these render
 * `./shapes.tsx` with `drawn` fixed true instead of watching the viewport for
 * it. Nothing is approximated and nothing is duplicated.
 *
 * They exist because a client component cannot be returned inside a Server
 * Action's payload unless it is in the calling page's client manifest, which
 * the admin's MDX preview is not. Rendering the marks in their finished state
 * is also simply correct for a preview: there is nothing to scroll into.
 */
export const StaticUnderline = (props: MarkProps) => (
  <StrokeMark kind="underline" drawn {...props} />
);

export const StaticCircle = (props: MarkProps) => (
  <StrokeMark kind="circle" drawn {...props} />
);

export const StaticBox = (props: MarkProps) => (
  <StrokeMark kind="box" drawn {...props} />
);

export const StaticStrike = (props: MarkProps) => (
  <StrokeMark kind="strike" drawn {...props} />
);

export const StaticHighlight = (props: HighlightProps) => (
  <HighlightMark drawn {...props} />
);

export const StaticBold = (props: BoldProps) => (
  <BoldMark drawn {...props} />
);
