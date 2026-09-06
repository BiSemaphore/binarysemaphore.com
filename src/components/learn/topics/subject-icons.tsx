import {
  AppWindow,
  Binary,
  Blocks,
  Braces,
  Bug,
  Cloud,
  Coffee,
  Cpu,
  Database,
  FileCode,
  FileType,
  FlaskConical,
  MessagesSquare,
  Network,
  Parentheses,
  Server,
  ShieldCheck,
  Sigma,
  Sparkles,
  Terminal,
  Workflow,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * One icon per subject, for the rail and the index.
 *
 * From lucide rather than hand-rolled. Drawing twenty-three category marks that
 * stay legible at 22px is a different job from drawing a mail glyph, and the
 * hand-rolled set was the weakest part of the shell twice running.
 *
 * `icons.tsx` keeps the brand and utility marks. This file is only the rail.
 */
const ICONS: Record<string, LucideIcon> = {
  c: Terminal,
  cpp: Braces,
  java: Coffee,
  python: FileCode,
  javascript: Parentheses,
  typescript: FileType,
  go: Zap,
  dsa: Binary,
  "operating-systems": Cpu,
  networks: Network,
  databases: Database,
  "system-design": Blocks,
  theory: Workflow,
  maths: Sigma,
  frontend: AppWindow,
  backend: Server,
  security: ShieldCheck,
  cloud: Cloud,
  testing: FlaskConical,
  ai: Sparkles,
  toolbox: Wrench,
  debugging: Bug,
  interviews: MessagesSquare,
};

/**
 * The icon for a subject.
 *
 * Falls back to `Blocks` rather than rendering nothing, so a subject added
 * without an entry still has something to click instead of an invisible tile.
 *
 * `strokeWidth` is 1.75 rather than lucide's default 2: at 22px inside a 48px
 * tile the default reads heavy against the mono type around it.
 */
export function SubjectIcon({
  subject,
  className,
}: {
  subject: string;
  className?: string;
}) {
  const Icon = ICONS[subject] ?? Blocks;
  return <Icon className={className} strokeWidth={1.75} aria-hidden />;
}
