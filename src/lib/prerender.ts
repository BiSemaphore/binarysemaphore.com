/**
 * Prerendering is an optimisation, and an optimisation must not fail a build.
 *
 * Content moved from files to Postgres, which quietly made every
 * `generateStaticParams` a database read. A build then fails outright if the
 * database is unreachable, or if the environment simply has no Supabase config,
 * which is exactly what happened on the first preview deploy after the move:
 * the public keys were set for Production only, and the build died on
 * `/threads/[slug]/opengraph-image` rather than skipping it.
 *
 * That is the wrong failure. These pages are dynamic and cached at runtime, so
 * an empty params list costs a first request, not a page. Returning nothing
 * means "prerender none of them", and every route still works.
 *
 * ## Except in production
 *
 * Degrading is right for a preview deploy, where the environment may genuinely
 * lack Supabase config, and wrong for the real site: a production build that
 * cannot reach the database would succeed, prerender nothing at all, and say so
 * only in a log line nobody reads. That is a broken deploy wearing a green
 * tick. There, the build fails.
 *
 * `VERCEL_ENV` is the distinction, not `NODE_ENV`: NODE_ENV is "production" for
 * a preview build too, which is exactly the case this must not fail.
 */
export async function prerenderParams<T>(
  label: string,
  load: () => Promise<T[]>,
): Promise<T[]> {
  try {
    return await load();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (process.env.VERCEL_ENV === "production") {
      throw new Error(
        `[prerender] ${label}: the production build could not read the database, and shipping a site with nothing prerendered is worse than failing here. ${message}`,
      );
    }

    console.warn(
      `[prerender] ${label}: rendering on demand instead. ${message}`,
    );
    return [];
  }
}
