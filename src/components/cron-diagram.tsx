/**
 * A clean cron-expression breakdown for use in threads: each field sits above
 * the name and range it maps to, replacing fragile ASCII box-art. Pure server
 * component (no client JS). Wildcards render in the accent colour.
 *
 * Usage in MDX:  <CronDiagram expr="0 8 * * *" note="every day at 08:00" />
 */

const FIELDS = [
  { name: "minute", range: "0–59" },
  { name: "hour", range: "0–23" },
  { name: "day-of-month", range: "1–31" },
  { name: "month", range: "1–12" },
  { name: "day-of-week", range: "0–7" },
] as const;

export function CronDiagram({
  expr = "0 8 * * *",
  note,
}: {
  expr?: string;
  note?: string;
}) {
  const tokens = expr.trim().split(/\s+/).slice(0, 5);

  return (
    <figure className="my-8">
      <div className="overflow-x-auto rounded-panel border border-border bg-card shadow-soft">
        <div className="grid min-w-[560px] grid-cols-5">
          {FIELDS.map((field, i) => {
            const token = tokens[i] ?? "*";
            return (
              <div
                key={field.name}
                className={`flex flex-col items-center gap-1.5 px-3 py-5 text-center ${
                  i > 0 ? "border-l border-border" : ""
                }`}
              >
                <span className="font-mono text-2xl leading-none text-foreground">
                  {token === "*" ? (
                    <span className="text-blue">*</span>
                  ) : (
                    token
                  )}
                </span>
                <span className="font-mono text-[11px] leading-none text-subtle">
                  {field.name}
                </span>
                <span className="font-mono text-[11px] leading-none text-subtle/60">
                  {field.range}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {note ? (
        <figcaption className="mt-3 text-center font-mono text-xs text-subtle">
          <span className="text-blue">→</span> {note}
        </figcaption>
      ) : null}
    </figure>
  );
}
