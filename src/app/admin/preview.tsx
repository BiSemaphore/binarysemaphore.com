"use server";

import type { ReactNode } from "react";
import { compile } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import rehypeSlug from "rehype-slug";
import rehypePretty from "rehype-pretty-code";
import { previewComponents } from "@/components/admin/preview-components";
import { isAdmin } from "@/lib/admin/auth";

export type Preview =
  | { ok: true; node: ReactNode }
  | { ok: false; error: string };

/**
 * Render MDX the way the real page will.
 *
 * The point of a preview is that it is not a different renderer, so this
 * returns `<MdxBody>`: the same component, the same plugins and the same
 * component map that every published thread and channel goes through. A server
 * action may return JSX, which arrives as an RSC payload the editor drops
 * straight into the pane. Nothing is serialised to an HTML string and nothing
 * needs `dangerouslySetInnerHTML`.
 *
 * The first attempt rendered to markup with `react-dom/server` and Next refused
 * to build it, correctly: that module cannot be reachable from a client
 * component, and the editor imports this file. Returning an element rather than
 * a string sidesteps the whole question.
 *
 * ## Why it compiles twice
 *
 * `MdxBody` swallows a compile failure into a fallback, which is right for a
 * live page and useless while writing: "this page could not be rendered" does
 * not tell you that you left a tag open on line 42. So the source is compiled
 * once here purely to catch the error and read its message, without the
 * highlighter, which is the expensive half. A valid document pays for a cheap
 * parse it would otherwise not do; an invalid one gets a line number.
 *
 * Gated on `is_admin()`. Not because the output is sensitive, it goes straight
 * back to the caller, but because this compiles and runs arbitrary MDX, and an
 * open endpoint that does that is remote code execution with a friendly name.
 */
/**
 * Past this, previewing costs more than it is worth.
 *
 * Every pause in typing compiles the whole document and runs Shiki over every
 * fence, on the server. That is unbounded work triggered by a keystroke, and
 * although only an admin can trigger it, "only we can do it" is not a limit.
 * 150KB is roughly 25,000 words: far beyond anything we write, and short of
 * anything that would hurt.
 */
const MAX_PREVIEW_BYTES = 150_000;

export async function previewMdx(source: string): Promise<Preview> {
  if (!(await isAdmin())) return { ok: false, error: "Not an admin." };
  if (!source.trim()) return { ok: true, node: null };

  if (source.length > MAX_PREVIEW_BYTES) {
    return {
      ok: false,
      error: `Too long to preview live (${Math.round(source.length / 1000)}KB of ${MAX_PREVIEW_BYTES / 1000}KB). Saving still works, and the page will render it.`,
    };
  }

  try {
    await compile(source, { remarkPlugins: [remarkGfm] });
  } catch (error) {
    return {
      ok: false,
      // The compiler's own message names a line and a column, which is the
      // entire value of showing it rather than "something went wrong".
      error: error instanceof Error ? error.message : String(error),
    };
  }

  return {
    ok: true,
    node: (
      <MDXRemote
        source={source}
        components={previewComponents}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [
              rehypeSlug,
              [
                rehypePretty,
                {
                  theme: { light: "github-light", dark: "github-dark-dimmed" },
                  keepBackground: false,
                },
              ],
            ],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        }}
      />
    ),
  };
}
