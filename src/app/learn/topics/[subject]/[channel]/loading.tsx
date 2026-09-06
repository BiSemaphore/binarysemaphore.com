import { Skeleton, Line } from "@/components/skeleton";

/**
 * A channel on its way.
 *
 * Lives inside the topics shell, so the rail and the sidebar are already on
 * screen and only this pane is replaced. That is the whole reason the shell is
 * a layout rather than part of the page.
 */
export default function ChannelLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 lg:flex-row lg:gap-12 lg:px-10 lg:py-14">
      <div className="min-w-0 flex-1">
        <Skeleton>
          <Line className="w-24 opacity-60" />
          <Line className="mt-5 !h-8 w-2/3" />
          <Line className="mt-4 w-5/6 opacity-60" />

          <div className="mt-12 space-y-3">
            {Array.from({ length: 10 }, (_, i) => (
              <Line key={i} className={i % 3 === 2 ? "w-3/4" : "w-full"} />
            ))}
          </div>
        </Skeleton>
      </div>

      <aside className="w-full shrink-0 lg:w-[264px]">
        <Skeleton>
          <Line className="w-24 opacity-60" />
          <div className="mt-4 space-y-3">
            <Line className="!h-14 w-full opacity-40" />
            <Line className="!h-14 w-full opacity-40" />
          </div>
        </Skeleton>
      </aside>
    </div>
  );
}
