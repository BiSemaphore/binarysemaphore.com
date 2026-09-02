"use client";

import { useEffect } from "react";
import { markReadAction } from "@/app/learn/actions";

/**
 * Records that this section was opened, once, after it has rendered.
 *
 * A server component must not write during render, so this fires from an
 * effect. Deliberately fire-and-forget and renders nothing: a bookmark failing
 * to save must never interrupt someone reading.
 */
export function MarkRead({ slug, section }: { slug: string; section: string }) {
  useEffect(() => {
    void markReadAction(slug, section).catch(() => {});
  }, [slug, section]);

  return null;
}
