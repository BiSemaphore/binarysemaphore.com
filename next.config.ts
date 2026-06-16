import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  // Let .md/.mdx files be treated as pages/modules.
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  // Pin the workspace root so Turbopack doesn't pick up a stray
  // lockfile in a parent directory (e.g. ~/package-lock.json).
  turbopack: {
    root: __dirname,
  },
  // Instagram media is served from the Meta CDN. We render it `unoptimized`
  // (the signed URLs expire, so optimizing/caching them is pointless), but the
  // host still has to be allow-listed here.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.cdninstagram.com" },
      { protocol: "https", hostname: "**.fbcdn.net" },
    ],
  },
};

// Plugins are referenced by name (string) with serializable options, which is
// what Turbopack supports — it can't receive imported plugin functions.
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm", "remark-frontmatter"],
    rehypePlugins: [
      "rehype-slug",
      [
        "rehype-pretty-code",
        {
          theme: { light: "github-light", dark: "github-dark-dimmed" },
          keepBackground: false,
        },
      ],
    ],
  },
});

export default withMDX(nextConfig);
