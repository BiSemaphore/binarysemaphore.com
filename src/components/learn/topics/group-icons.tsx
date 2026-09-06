import {
  AppWindow,
  Binary,
  Blocks,
  Braces,
  Cloud,
  Cpu,
  Database,
  Network,
  ShieldCheck,
  Sigma,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/**
 * One icon per topic group, for the rail and the index.
 *
 * These were hand-rolled first, to match the 22 icons already in
 * `src/components/icons.tsx` and to avoid a dependency for twelve glyphs. That
 * was the wrong call: drawing twelve *category* icons that stay legible at 22px
 * is a different job from drawing a mail glyph, and mine did not. Lucide is
 * properly drawn, consistent at this size, and tree-shakeable, so the cost is
 * twelve icons rather than a whole set.
 *
 * `icons.tsx` keeps the brand and utility marks. This file is only the rail.
 */
const ICONS: Record<string, LucideIcon> = {
  languages: Braces, //      source code
  dsa: Binary, //            structures and algorithms
  maths: Sigma, //           summation
  foundations: Blocks, //    the theory papers everything stacks on
  systems: Cpu, //           one machine
  networking: Network, //    nodes, and the wire between them
  data: Database,
  building: AppWindow, //    the thing you shipped
  security: ShieldCheck,
  cloud: Cloud,
  ai: Sparkles,
  toolbox: Wrench,
};

/**
 * The icon for a group slug.
 *
 * Falls back to `Blocks` rather than rendering nothing, so a group added without
 * an entry still has something to click instead of an invisible tile.
 *
 * `strokeWidth` is 1.75 rather than Lucide's default 2: at 22px inside a 48px
 * tile the default reads heavy against the mono type around it.
 */
export function GroupIcon({
  group,
  className,
}: {
  group: string;
  className?: string;
}) {
  const Icon = ICONS[group] ?? Blocks;
  return <Icon className={className} strokeWidth={1.75} aria-hidden />;
}
