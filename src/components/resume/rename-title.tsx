"use client";

import { useRef } from "react";
import { renameResumeAction } from "@/app/resume/(app)/actions";

/**
 * Inline résumé-title rename on the home hub. Persists on Enter or blur (only
 * when the name actually changed), reverts on Escape, and shows no explicit
 * save button. Submits the existing `renameResumeAction` via the form, so the
 * server action + revalidation stay the source of truth.
 */
export function RenameTitle({ id, title }: { id: string; title: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function commit() {
    const input = inputRef.current;
    if (!input) return;
    const next = input.value.trim();
    if (!next) {
      input.value = title; // don't allow an empty title
      return;
    }
    if (next !== title) formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={renameResumeAction}>
      <input type="hidden" name="id" value={id} />
      <input
        ref={inputRef}
        name="title"
        defaultValue={title}
        aria-label="Resume title"
        title="Press Enter to rename"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            inputRef.current?.blur(); // triggers onBlur -> commit
          } else if (e.key === "Escape") {
            e.preventDefault();
            if (inputRef.current) inputRef.current.value = title;
            inputRef.current?.blur();
          }
        }}
        onBlur={commit}
        className="w-full max-w-xs rounded-lg border border-transparent bg-transparent px-2 py-1 text-base font-medium text-foreground hover:border-black/15 focus:border-black/20 focus:outline-none dark:hover:border-white/20 dark:focus:border-white/25"
      />
    </form>
  );
}
