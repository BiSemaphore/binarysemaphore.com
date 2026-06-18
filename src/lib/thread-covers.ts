import type { StaticImageData } from "next/image";
import notesWindow from "@/images/notes-window.jpg";
import wireframes from "@/images/wireframes.jpg";
import tornPaper from "@/images/torn-paper.jpg";
import forceNote from "@/images/the-force-note.jpg";

/**
 * Maps a thread slug to its cover photo. Threads without an entry simply render
 * no cover. Kept here (not in MDX frontmatter) so covers stay statically
 * imported and get an auto-generated blur placeholder.
 */
export const threadCovers: Record<string, StaticImageData> = {
  "what-is-a-binary-semaphore": notesWindow,
  "how-semantic-search-works": wireframes,
  "an-mcp-server-for-your-notes": tornPaper,
  "what-local-first-buys-you": forceNote,
};
