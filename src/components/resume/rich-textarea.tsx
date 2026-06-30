"use client";

import { useRef } from "react";

type Transform = (
  value: string,
  start: number,
  end: number,
) => { value: string; selStart: number; selEnd: number };

/**
 * A textarea with a small markdown toolbar (bold, italic, underline, link, and
 * optional lists). Stores plain markdown; rendered by `rich()` in the templates.
 */
export function RichTextarea({
  label,
  value,
  onChange,
  rows = 3,
  lists = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  /** Show bullet/numbered list buttons (off for the already-line-based fields). */
  lists?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function apply(transform: Transform) {
    const ta = ref.current;
    if (!ta) return;
    const { value: nv, selStart, selEnd } = transform(
      value,
      ta.selectionStart,
      ta.selectionEnd,
    );
    onChange(nv);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(selStart, selEnd);
    });
  }

  function wrap(before: string, after: string, placeholder: string) {
    apply((v, s, e) => {
      const sel = v.slice(s, e) || placeholder;
      const nv = v.slice(0, s) + before + sel + after + v.slice(e);
      return {
        value: nv,
        selStart: s + before.length,
        selEnd: s + before.length + sel.length,
      };
    });
  }

  function prefixLines(prefix: string) {
    apply((v, s, e) => {
      const lineStart = v.lastIndexOf("\n", s - 1) + 1;
      const nlAfter = v.indexOf("\n", e);
      const lineEnd = nlAfter === -1 ? v.length : nlAfter;
      const block = v.slice(lineStart, lineEnd);
      const newBlock = block
        .split("\n")
        .map((l) => prefix + l)
        .join("\n");
      const nv = v.slice(0, lineStart) + newBlock + v.slice(lineEnd);
      return {
        value: nv,
        selStart: lineStart,
        selEnd: lineStart + newBlock.length,
      };
    });
  }

  function addLink() {
    const url = window.prompt("Link URL:");
    if (!url) return;
    apply((v, s, e) => {
      const sel = v.slice(s, e) || "link";
      const ins = `[${sel}](${url})`;
      const nv = v.slice(0, s) + ins + v.slice(e);
      return { value: nv, selStart: s + 1, selEnd: s + 1 + sel.length };
    });
  }

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-subtle">{label}</span>
      <div className="overflow-hidden rounded-lg border border-border bg-background focus-within:border-accent">
        <div className="flex flex-wrap items-center gap-1 border-b border-border px-1.5 py-1">
          <ToolbarButton title="Bold" onClick={() => wrap("**", "**", "bold")}>
            <span className="font-bold">B</span>
          </ToolbarButton>
          <ToolbarButton
            title="Italic"
            onClick={() => wrap("*", "*", "italic")}
          >
            <span className="italic">I</span>
          </ToolbarButton>
          <ToolbarButton
            title="Underline"
            onClick={() => wrap("++", "++", "underline")}
          >
            <span className="underline">U</span>
          </ToolbarButton>
          <ToolbarButton title="Link" onClick={addLink}>
            🔗
          </ToolbarButton>
          {lists ? (
            <>
              <span className="mx-0.5 h-4 w-px bg-border" />
              <ToolbarButton
                title="Bulleted list"
                onClick={() => prefixLines("- ")}
              >
                ••
              </ToolbarButton>
              <ToolbarButton
                title="Numbered list"
                onClick={() => prefixLines("1. ")}
              >
                1.
              </ToolbarButton>
            </>
          ) : null}
        </div>
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="w-full resize-y bg-transparent px-3 py-2 font-mono text-[13px] text-foreground placeholder:text-subtle focus:outline-none"
        />
      </div>
    </label>
  );
}

function ToolbarButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="flex h-6 min-w-6 items-center justify-center rounded px-1.5 text-xs text-subtle transition-colors hover:bg-card-hover hover:text-foreground"
    >
      {children}
    </button>
  );
}
