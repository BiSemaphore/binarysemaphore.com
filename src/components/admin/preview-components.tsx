import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";
import { mdxComponents } from "@/mdx-components";

/**
 * The component map the preview renders with.
 *
 * Almost all of it is the real map, so headings, lists, tables, links and
 * syntax-highlighted code are exactly what the published page will show.
 *
 * Two things are swapped, and the reason is a hard boundary rather than a
 * choice. The preview arrives as JSX returned from a Server Action, and a
 * client component inside that payload has to be in the calling page's client
 * manifest or React cannot resolve it: rendering the real map failed with
 * "Could not find the module code-block.tsx#Pre in the React Client Manifest".
 *
 * So the two client modules are replaced with server-safe equivalents:
 *
 * - **Code blocks** lose their copy button. `rehype-pretty-code` has already
 *   produced the highlighted markup by this point, so the code itself is
 *   identical; only the overlay button is missing, and a preview does not need
 *   one.
 * - **Pen marks** draw themselves on scroll, which is why they are client
 *   components. Here they render in their final state, which is what a preview
 *   should show anyway. The stroke is a straight rule rather than the
 *   hand-drawn path.
 *
 * Neither affects layout or spacing, so the preview still answers the question
 * it exists to answer: is this going to look right.
 */

function PlainPre(props: React.HTMLAttributes<HTMLPreElement>) {
  return <pre {...props} />;
}

/** A mark in its drawn state, without the animation that needs a browser. */
function mark(decoration: string) {
  return function Mark({
    children,
    className = "",
  }: {
    children: ReactNode;
    className?: string;
  }) {
    return <span className={`${decoration} ${className}`}>{children}</span>;
  };
}

export const previewComponents: MDXComponents = {
  ...mdxComponents,
  pre: PlainPre,
  Underline: mark("underline decoration-blue/70 decoration-2 underline-offset-4"),
  Circle: mark("rounded-full px-1.5 ring-1 ring-accent/50"),
  Box: mark("px-1 ring-1 ring-violet/60"),
  Strike: mark("line-through decoration-accent/70 decoration-2"),
  Highlight: mark("bg-sun/35 px-0.5"),
};
