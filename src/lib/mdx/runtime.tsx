import { MDXRemote } from "next-mdx-remote-client/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypePretty from "rehype-pretty-code";
import { useMDXComponents } from "@/mdx-components";

/**
 * Rendering MDX that came out of the database.
 *
 * Until now every piece of MDX in this repo was compiled at build time by
 * `@next/mdx`. Content lives in Postgres now, so a body arrives as a string at
 * request time and has to be compiled then.
 *
 * **The pipeline here must match `next.config.ts`.** Turbopack takes plugins by
 * name because it cannot receive imported functions; this takes the functions
 * themselves. Same plugins, same options, two spellings. If a thread suddenly
 * loses its syntax highlighting or its heading anchors, they have drifted.
 *
 * `remark-frontmatter` is deliberately absent: the frontmatter was parsed once
 * by the sync script and lives in columns. A body in the database is prose
 * only.
 *
 * ## The security note, stated plainly
 *
 * MDX is executable. Rendering it evaluates compiled JavaScript on our server,
 * and the library's own documentation says never to render user-supplied MDX
 * unsanitised. Only an admin can write it, so the threat model is: **an admin
 * account compromise is server-side code execution**, not a defaced page. That
 * is the strongest argument for keeping `private.admins` tiny and for MFA on
 * those accounts.
 *
 * Never render a body from any source other than these tables.
 */
const mdxOptions = {
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
} as const;

/**
 * One body, rendered with the same components a build-time thread had.
 *
 * `onError` matters more than it looks: a compile failure here is a runtime
 * failure, where it used to fail the build. The admin refuses to store MDX that
 * does not compile, and this is the second line, so one bad body cannot take
 * the page down with it.
 */
export function MdxBody({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      components={useMDXComponents()}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      options={{ mdxOptions: mdxOptions as any }}
      onError={MdxFailed}
    />
  );
}

function MdxFailed() {
  return (
    <p className="my-8 rounded-card border border-border bg-surface p-4 text-sm text-muted">
      This page could not be rendered. We have been told, and it will be fixed.
    </p>
  );
}
