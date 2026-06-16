import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { AnchorHTMLAttributes } from "react";

/**
 * Global MDX element styling for thread content. Required by @next/mdx in the
 * App Router. Code blocks (pre/code) are intentionally left to CSS in
 * globals.css so rehype-pretty-code's output is preserved.
 */
const components: MDXComponents = {
  h2: (props) => (
    <h2
      className="mt-12 scroll-mt-24 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className="mt-8 scroll-mt-24 text-xl font-semibold tracking-tight text-foreground"
      {...props}
    />
  ),
  h4: (props) => (
    <h4
      className="mt-6 scroll-mt-24 text-base font-semibold text-foreground"
      {...props}
    />
  ),
  p: (props) => (
    <p className="my-4 text-[15px] leading-7 text-muted" {...props} />
  ),
  a: ({ href = "", ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const external = /^https?:\/\//.test(href);
    const className =
      "font-medium text-accent-strong underline underline-offset-4 transition-colors hover:text-accent";
    return external ? (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={className}
        {...props}
      />
    ) : (
      <Link href={href} className={className} {...props} />
    );
  },
  ul: (props) => (
    <ul
      className="my-4 list-disc space-y-2 pl-6 text-[15px] leading-7 text-muted marker:text-subtle"
      {...props}
    />
  ),
  ol: (props) => (
    <ol
      className="my-4 list-decimal space-y-2 pl-6 text-[15px] leading-7 text-muted marker:text-subtle"
      {...props}
    />
  ),
  li: (props) => <li className="pl-1" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="my-6 border-l-2 border-accent pl-4 font-hand text-xl text-foreground"
      {...props}
    />
  ),
  hr: () => (
    <hr className="my-10 border-0 border-t border-dashed border-border" />
  ),
  strong: (props) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  table: (props) => (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm" {...props} />
    </div>
  ),
  th: (props) => (
    <th
      className="border-b border-border px-3 py-2 font-mono text-xs uppercase tracking-wider text-subtle"
      {...props}
    />
  ),
  td: (props) => (
    <td className="border-b border-border px-3 py-2 text-muted" {...props} />
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
