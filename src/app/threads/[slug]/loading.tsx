import { Header } from "@/components/header";
import { Skeleton, Line } from "@/components/skeleton";

/**
 * A thread on its way.
 *
 * The header renders for real rather than as a skeleton: it is identical on
 * every page, so drawing a grey box where the site's own navigation belongs
 * would be a worse answer than simply showing it.
 */
export default function ThreadLoading() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-20">
        <Skeleton>
          <div className="pt-10">
            <Line className="w-24 opacity-60" />
            <Line className="mt-6 !h-9 w-5/6" />
            <Line className="mt-3 !h-9 w-2/3" />
            <Line className="mt-8 w-40 opacity-60" />
          </div>

          <div className="mt-12 space-y-3">
            {Array.from({ length: 14 }, (_, i) => (
              <Line key={i} className={i % 4 === 3 ? "w-2/3" : "w-full"} />
            ))}
          </div>
        </Skeleton>
      </main>
    </>
  );
}
