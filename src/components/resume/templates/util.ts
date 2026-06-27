import type { ResumeContent } from "@/lib/resume/schema";

/** Trim entries and drop empties (skills, bullets, …). */
export function cleanList(items: string[]): string[] {
  return items.map((s) => s.trim()).filter(Boolean);
}

/** "Jan 2023 — Present" / "2020 — 2024" / "" depending on what's filled. */
export function formatRange(start: string, end: string, current = false): string {
  const s = start.trim();
  const e = current ? "Present" : end.trim();
  if (s && e) return `${s} — ${e}`;
  return s || e || "";
}

/** Contact fields that are actually filled in, in display order. */
export function contactBits(basics: ResumeContent["basics"]): string[] {
  return [basics.email, basics.phone, basics.location, basics.website]
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Resolve a value to itself, or a muted placeholder when empty. */
export function ph(value: string, placeholder: string) {
  const text = value.trim();
  return { text: text || placeholder, muted: text.length === 0 };
}
