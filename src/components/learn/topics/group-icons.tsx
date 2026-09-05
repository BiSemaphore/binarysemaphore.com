import type { SVGProps } from "react";

/**
 * One icon per topic group, for the rail and the index.
 *
 * Hand-rolled rather than pulled from an icon package, matching the 22 icons
 * already in `src/components/icons.tsx`: same 24x24 box, same 1.8 stroke, same
 * round caps. That keeps the whole site drawing from one pen and adds no
 * dependency for twelve glyphs.
 *
 * Each one is the plainest object that stands for its group. Nothing clever: a
 * rail icon is read at 20px and a metaphor does not survive that size.
 */
type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Angle brackets: source code. */
export function LanguagesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9 8-4 4 4 4" />
      <path d="m15 8 4 4-4 4" />
    </Icon>
  );
}

/** A binary tree, which is what half of DSA is. */
export function DsaIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="5" r="2" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M10.6 6.7 7.4 16.3M13.4 6.7l3.2 9.6" />
    </Icon>
  );
}

/** Plus and minus: the maths group. */
export function MathsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 8h6M7 5v6" />
      <path d="M14 8h6" />
      <path d="M4 17h6M14 15l6 4M20 15l-6 4" />
    </Icon>
  );
}

/** Foundation stones. */
export function FoundationsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="14" width="18" height="6" rx="1" />
      <rect x="6" y="8" width="12" height="6" rx="1" />
      <rect x="9" y="2" width="6" height="6" rx="1" />
    </Icon>
  );
}

/** A machine: the systems group. */
export function SystemsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M10 10h4v4h-4z" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    </Icon>
  );
}

/** Two nodes and the wire between them. */
export function NetworkingIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="5" cy="7" r="2.5" />
      <circle cx="19" cy="17" r="2.5" />
      <path d="M7.5 7H15a2 2 0 0 1 2 2v6" />
    </Icon>
  );
}

/** A database, drawn the way everyone draws one. */
export function DataIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </Icon>
  );
}

/** A window with a toolbar: something you built. */
export function BuildingIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M6.5 6.5h.01M9.5 6.5h.01" />
    </Icon>
  );
}

/** A shield. */
export function SecurityIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3 5 6v6c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6z" />
    </Icon>
  );
}

/** A cloud. */
export function CloudIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 18a4 4 0 0 1-.4-8A5.5 5.5 0 0 1 17 10.5a3.75 3.75 0 0 1 0 7.5z" />
    </Icon>
  );
}

/** A spark: the AI group. Not a robot, and not a brain. */
export function AiIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.8L12 18l-1.7-5.5L4.8 10.7 10.3 9z" />
      <path d="M18.5 3.5v3M20 5h-3" />
    </Icon>
  );
}

/** A wrench. */
export function ToolboxIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15.5 4a4.5 4.5 0 0 0-4 6.6L4 18.1 5.9 20l7.5-7.5A4.5 4.5 0 1 0 15.5 4" />
    </Icon>
  );
}

const ICONS: Record<string, (props: IconProps) => React.ReactElement> = {
  languages: LanguagesIcon,
  dsa: DsaIcon,
  maths: MathsIcon,
  foundations: FoundationsIcon,
  systems: SystemsIcon,
  networking: NetworkingIcon,
  data: DataIcon,
  building: BuildingIcon,
  security: SecurityIcon,
  cloud: CloudIcon,
  ai: AiIcon,
  toolbox: ToolboxIcon,
};

/**
 * The icon for a group slug. Falls back to the Foundations glyph rather than
 * rendering nothing, so a group added without an icon still has a rail entry to
 * click instead of an invisible one.
 */
export function GroupIcon({ group, ...props }: IconProps & { group: string }) {
  const Component = ICONS[group] ?? FoundationsIcon;
  return <Component {...props} />;
}
