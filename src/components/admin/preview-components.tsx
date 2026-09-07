import type { MDXComponents } from "mdx/types";
import { mdxComponents } from "@/mdx-components";
import {
  StaticBox,
  StaticCircle,
  StaticHighlight,
  StaticStrike,
  StaticUnderline,
} from "@/components/annotate/static";

/**
 * The component map the admin's MDX preview renders with.
 *
 * It is the real map with the client components swapped for server-renderable
 * equivalents, because a client component inside a Server Action's returned
 * JSX has to be in the calling page's client manifest and these are not:
 * rendering the real map failed with "Could not find the module
 * code-block.tsx#Pre in the React Client Manifest".
 *
 * The marks are the same shapes, palette and defaults as the published page,
 * rendered already drawn rather than watching for a scroll that will never
 * come. Code blocks keep their highlighting, which `rehype-pretty-code` has
 * already applied by this point, and lose only the copy button.
 */
function PlainPre(props: React.HTMLAttributes<HTMLPreElement>) {
  return <pre {...props} />;
}

export const previewComponents: MDXComponents = {
  ...mdxComponents,
  pre: PlainPre,
  Underline: StaticUnderline,
  Circle: StaticCircle,
  Box: StaticBox,
  Strike: StaticStrike,
  Highlight: StaticHighlight,
};
