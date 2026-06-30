import type { ReactNode } from "react";
import { safeUrl } from "./richtext";
import type { ResumeContent } from "./schema";
import {
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeIcon,
  GitHubIcon,
  LinkedInIcon,
} from "@/components/icons";

/** One contact/link entry with a leading icon, for icon-led header rows. */
export type IconItem = { key: string; icon: ReactNode; node: ReactNode };

const ICON_CLASS = "h-3 w-3 shrink-0";

/** Pick an icon for a link from its label/url (github / linkedin / generic). */
function iconForLink(label: string, url: string): ReactNode {
  const s = `${label} ${url}`.toLowerCase();
  if (s.includes("github")) return <GitHubIcon className={ICON_CLASS} />;
  if (s.includes("linkedin")) return <LinkedInIcon className={ICON_CLASS} />;
  return <GlobeIcon className={ICON_CLASS} />;
}

/** Contact fields as icon + value items: email (mailto), phone, location,
 * website (link). For icon-led header rows. */
export function contactIconItems(basics: ResumeContent["basics"]): IconItem[] {
  const items: IconItem[] = [];
  const email = basics.email.trim();
  const phone = basics.phone.trim();
  const location = basics.location.trim();
  const website = basics.website.trim();

  if (email)
    items.push({
      key: "email",
      icon: <MailIcon className={ICON_CLASS} />,
      node: <A href={`mailto:${email}`}>{email}</A>,
    });
  if (phone)
    items.push({
      key: "phone",
      icon: <PhoneIcon className={ICON_CLASS} />,
      node: phone,
    });
  if (location)
    items.push({
      key: "location",
      icon: <MapPinIcon className={ICON_CLASS} />,
      node: location,
    });
  if (website) {
    const href = safeUrl(website);
    items.push({
      key: "website",
      icon: <GlobeIcon className={ICON_CLASS} />,
      node: href ? <A href={href}>{website}</A> : website,
    });
  }
  return items;
}

/** The user's links as icon + label items (github/linkedin auto-detected). */
export function linkIconItems(links: ResumeContent["links"]): IconItem[] {
  return links
    .filter((l) => (l.label || l.url).trim())
    .map((l, i) => ({
      key: `${l.url}-${i}`,
      icon: iconForLink(l.label, l.url),
      node: linkAnchor(l),
    }));
}

// Links read clean on the resume (no permanent underline, none in the PDF);
// a hover underline keeps the on-screen affordance.
const anchorClass = "hover:underline underline-offset-2";

/** A safe external anchor that inherits the surrounding text color. */
function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={anchorClass}
    >
      {children}
    </a>
  );
}

/**
 * The filled contact items — email (mailto), phone, location, website (link) —
 * followed by the user's links, each as a real clickable anchor where possible.
 * Returns nodes so templates can join them with their own separator.
 */
/** The filled contact fields as nodes: email (mailto) and website are links. */
export function contactNodes(basics: ResumeContent["basics"]): ReactNode[] {
  const items: ReactNode[] = [];
  const email = basics.email.trim();
  const phone = basics.phone.trim();
  const location = basics.location.trim();
  const website = basics.website.trim();

  if (email) items.push(<A href={`mailto:${email}`}>{email}</A>);
  if (phone) items.push(phone);
  if (location) items.push(location);
  if (website) {
    const href = safeUrl(website);
    items.push(href ? <A href={href}>{website}</A> : website);
  }
  return items;
}

export function contactItems(
  basics: ResumeContent["basics"],
  links: ResumeContent["links"],
): ReactNode[] {
  const items = contactNodes(basics);
  for (const l of links) {
    const label = (l.label || l.url).trim();
    if (!label && !l.url.trim()) continue;
    const href = safeUrl(l.url);
    items.push(href ? <A href={href}>{label || l.url}</A> : label || l.url);
  }
  return items;
}

/** A contacts-only line (email/phone/location/website), items joined by `sep`. */
export function contactsLine(
  basics: ResumeContent["basics"],
  sep = "  ·  ",
): ReactNode {
  return contactNodes(basics).map((item, i) => (
    <span key={i}>
      {i > 0 ? sep : ""}
      {item}
    </span>
  ));
}

/** The contact + links line, items joined by `sep`, with clickable links. */
export function contactLine(
  basics: ResumeContent["basics"],
  links: ResumeContent["links"],
  sep = "  ·  ",
): ReactNode {
  const items = contactItems(basics, links);
  return items.map((item, i) => (
    <span key={i}>
      {i > 0 ? sep : ""}
      {item}
    </span>
  ));
}

/** Render a project link as a clickable anchor (or plain text if unsafe). */
export function projectLink(link: string): ReactNode {
  const url = link.trim();
  if (!url) return null;
  const href = safeUrl(url);
  return href ? <A href={href}>{url}</A> : url;
}

/** Render one link (label → url) as a clickable anchor. */
export function linkAnchor(link: ResumeContent["links"][number]): ReactNode {
  const label = (link.label || link.url || "Link").trim();
  const href = safeUrl(link.url);
  return href ? <A href={href}>{label}</A> : label;
}

/**
 * Render a company name, linked to its website when present. `fallback` is shown
 * when the name is empty (templates that lead with the company).
 */
export function companyName(
  company: string,
  companyUrl: string,
  fallback = "",
): ReactNode {
  const name = company.trim() || fallback;
  if (!name) return name;
  const href = safeUrl(companyUrl);
  return href ? <A href={href}>{name}</A> : name;
}
