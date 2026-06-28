import type { ReactNode } from "react";
import { safeUrl } from "./richtext";
import type { ResumeContent } from "./schema";

const anchorClass = "underline underline-offset-2";

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
export function contactItems(
  basics: ResumeContent["basics"],
  links: ResumeContent["links"],
): ReactNode[] {
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
  for (const l of links) {
    const label = (l.label || l.url).trim();
    if (!label && !l.url.trim()) continue;
    const href = safeUrl(l.url);
    items.push(href ? <A href={href}>{label || l.url}</A> : label || l.url);
  }
  return items;
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
