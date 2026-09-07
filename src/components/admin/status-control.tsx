"use client";

import { ChevronDownIcon } from "@/components/icons";

/**
 * The status control, and the Save button it belongs to.
 *
 * These were two unrelated controls standing next to each other: a bordered
 * card select and a solid black button, different shapes, different weights,
 * joined by nothing. Publishing and saving are one decision made in two steps,
 * so they are one control now, split down the middle.
 *
 * The colour difference carries meaning rather than decoration. The left half
 * is tinted by the state it is showing, so a draft looks like a draft before
 * you read the word; the right half is the single dark action on the screen.
 * Two hues, one of them earned.
 *
 * ## Why the select is invisible
 *
 * A native `<select>` cannot show a coloured dot beside its value, and a
 * div-based menu would have to reimplement keyboard handling, typeahead and
 * the mobile picker. So the real select is stretched over the control at zero
 * opacity: every native behaviour is intact, and what you see is ours.
 * `focus-within` puts the ring back, since the focused element is the one you
 * cannot see.
 */

const TONE = {
  draft: "border-coral/40 bg-coral/10 text-coral",
  published: "border-border bg-card text-foreground",
  archived: "border-border bg-background text-subtle",
} as const;

export type Status = keyof typeof TONE;

export function StatusControl({
  value,
  onChange,
  disabled = false,
  children,
}: {
  value: Status;
  onChange: (next: Status) => void;
  disabled?: boolean;
  /** The Save button, so the two halves cannot be separated by accident. */
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex h-8 items-stretch">
      <span
        className={`relative inline-flex items-center gap-2 rounded-l-xl border pl-3 pr-7 font-mono text-[0.7rem] transition-colors focus-within:ring-2 focus-within:ring-foreground/15 ${TONE[value]} ${disabled ? "opacity-60" : ""}`}
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
        {value}
        <ChevronDownIcon
          aria-hidden
          className="pointer-events-none absolute right-2.5 h-3 w-3 opacity-60"
        />

        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value as Status)}
          aria-label="Status"
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
        >
          <option value="draft">draft</option>
          <option value="published">published</option>
          <option value="archived">archived</option>
        </select>
      </span>

      {children}
    </span>
  );
}
