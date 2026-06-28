"use client";

/** Shared form/UI primitives for the resume editor. */

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/** A labelled range slider with a value readout. */
export function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between">
        <span className="text-[color:var(--rx-muted)]">{label}</span>
        <span className="text-foreground">{display}</span>
      </span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="r-slider"
      />
    </label>
  );
}

/** A side-by-side row of options (segmented control). */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  green,
  block,
}: {
  label?: string;
  options: readonly { id: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  green?: boolean;
  /** Full-width row with equal-width buttons (avoids wrapping in tight panels). */
  block?: boolean;
}) {
  return (
    <div>
      {label ? (
        <p className="mb-1 text-[color:var(--rx-muted)]">{label}</p>
      ) : null}
      <div
        role="group"
        aria-label={label ?? "options"}
        className={`${
          block ? "flex w-full" : "inline-flex flex-wrap"
        } overflow-hidden rounded-md border border-border`}
      >
        {options.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              aria-pressed={active}
              className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                block ? "flex-1 text-center" : ""
              } ${
                active
                  ? green
                    ? "rx-accent"
                    : "bg-foreground text-background"
                  : "text-[color:var(--rx-muted)] hover:bg-black/5"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SaveIndicator({ status }: { status: SaveStatus }) {
  const label =
    status === "saving"
      ? "saving…"
      : status === "saved"
        ? "saved"
        : status === "error"
          ? "save failed"
          : "";
  if (!label) return null;
  return (
    <span
      className={`rx-pill font-mono text-xs ${
        status === "error" ? "text-red-600" : ""
      }`}
      role="status"
      aria-live="polite"
    >
      {label}
    </span>
  );
}

export function FormSection({
  title,
  onAdd,
  children,
}: {
  title: string;
  onAdd?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
          {title}
        </h2>
        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-card-hover"
          >
            + Add
          </button>
        ) : null}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function RepeatItem({
  onRemove,
  onMoveUp,
  onMoveDown,
  children,
}: {
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative space-y-3 rounded-card border border-border bg-card p-4">
      <div className="absolute right-3 top-3 flex items-center gap-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!onMoveUp}
          aria-label="Move up"
          title="Move up"
          className="rounded-md px-1.5 py-0.5 font-mono text-xs text-subtle transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!onMoveDown}
          aria-label="Move down"
          title="Move down"
          className="rounded-md px-1.5 py-0.5 font-mono text-xs text-subtle transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove"
          className="rounded-md px-2 py-0.5 font-mono text-xs text-subtle transition-colors hover:text-red-500"
        >
          Remove
        </button>
      </div>
      {children}
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-subtle">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-subtle focus:border-accent focus:outline-none disabled:opacity-50"
      />
    </label>
  );
}
