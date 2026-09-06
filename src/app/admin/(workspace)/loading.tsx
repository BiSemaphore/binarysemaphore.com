import { Skeleton, Line, RowsSkeleton } from "@/components/skeleton";

/**
 * Shown while any admin page loads.
 *
 * The whole admin tree is `force-dynamic` and reads Postgres on every request,
 * so there is always a round trip here and it was previously invisible. One
 * file covers every route under (workspace) because they share a shape: a
 * heading, a line of explanation, then rows.
 */
export default function AdminLoading() {
  return (
    <>
      <Skeleton>
        <div className="border-b border-border pb-5">
          <Line className="w-40 !h-7" />
          <Line className="mt-4 w-3/4 opacity-60" />
        </div>
      </Skeleton>

      <div className="mt-8">
        <RowsSkeleton />
      </div>
    </>
  );
}
