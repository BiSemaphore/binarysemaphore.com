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

/**
 * A mark in its drawn state, without the animation that needs a browser.
 *
 * It accepts the same `color` prop as the real thing and applies it, so the
 * preview answers "is this the right colour" even though it cannot answer "is
 * this the right hand-drawn shape". The remaining props are accepted and
 * ignored on purpose: `weight` and `speed` describe a stroke being drawn, and
 * nothing is drawn here.
 */
const TOKENS = new Set([
  "accent",
  "accent-strong",
  "coral",
  "blue",
  "violet",
  "sun",
  "lime",
  "foreground",
  "muted",
  "subtle",
]);

function mark(decoration: string, fills: "text" | "background") {
  return function Mark({
    children,
    color,
    opacity = 0.4,
    className = "",
  }: {
    children: ReactNode;
    color?: string;
    opacity?: number;
    className?: string;
    weight?: string;
    speed?: string;
    delay?: number;
    height?: string;
    tilt?: number;
  }) {
    const resolved = color
      ? TOKENS.has(color)
        ? `var(--${color})`
        : color
      : undefined;

    return (
      <span
        className={`${decoration} ${className}`}
        style={
          resolved
            ? fills === "background"
              ? {
                  background: `color-mix(in oklab, ${resolved} ${Math.round(opacity * 100)}%, transparent)`,
                }
              : { color: resolved, textDecorationColor: resolved }
            : undefined
        }
      >
        {children}
      </span>
    );
  };
}

export const previewComponents: MDXComponents = {
  ...mdxComponents,
  pre: PlainPre,
  Underline: mark(
    "underline decoration-blue/70 decoration-2 underline-offset-4",
    "text",
  ),
  Circle: mark("rounded-full px-1.5 ring-1 ring-violet/50", "text"),
  Box: mark("px-1 ring-1 ring-lime/70", "text"),
  Strike: mark("line-through decoration-subtle decoration-2", "text"),
  Highlight: mark("bg-sun/35 px-0.5", "background"),
};
