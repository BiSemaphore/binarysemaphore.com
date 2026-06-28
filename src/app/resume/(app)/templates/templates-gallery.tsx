"use client";

import { useMemo, useState } from "react";
import { ALL_TEMPLATE_TAGS, TEMPLATES } from "@/lib/resume/schema";
import { TemplateCard } from "@/components/resume/template-card";

/** Searchable, tag-filterable grid of template cards (client-side; 5 items). */
export function TemplatesGallery() {
  const [q, setQ] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return TEMPLATES.filter((t) => {
      const haystack = [t.label, t.description, t.id, ...t.tags]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !needle || haystack.includes(needle);
      const tplTags = t.tags as readonly string[];
      const matchesTags = tags.every((tag) => tplTags.includes(tag));
      return matchesQuery && matchesTags;
    });
  }, [q, tags]);

  const toggleTag = (tag: string) =>
    setTags((cur) =>
      cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag],
    );

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative flex-1">
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[color:var(--rx-muted)]"
          >
            ⌕
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search by name, tag, or description"
            aria-label="search templates"
            className="w-full rounded-lg border border-black/15 bg-white/80 py-2 pl-8 pr-3 font-mono text-sm text-foreground placeholder:text-[color:var(--rx-muted)] focus:border-[color:var(--rx-green)] focus:outline-none"
          />
        </label>
        <span className="font-mono text-xs text-[color:var(--rx-muted)]">
          {filtered.length} of {TEMPLATES.length}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {ALL_TEMPLATE_TAGS.map((tag) => {
          const active = tags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              aria-pressed={active}
              className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] transition-colors ${
                active
                  ? "rx-green border-transparent"
                  : "border-black/10 text-[color:var(--rx-muted)] hover:bg-black/5"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center font-mono text-sm text-[color:var(--rx-muted)]">
          no templates match.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      )}
    </>
  );
}
