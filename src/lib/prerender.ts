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
 * It warns rather than staying silent, because a production build that
 * prerenders nothing is worth noticing in the log even though it is not worth
 * failing over.
 */
export async function prerenderParams<T>(
  label: string,
  load: () => Promise<T[]>,
): Promise<T[]> {
  try {
    return await load();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `[prerender] ${label}: rendering on demand instead. ${message}`,
    );
    return [];
  }
}
