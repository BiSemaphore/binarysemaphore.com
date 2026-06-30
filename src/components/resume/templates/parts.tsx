import type { ReactNode } from "react";

/**
 * The shared section wrapper used by templates with a simple "heading + body"
 * section (most of them). Templates keep their own look by passing the section
 * spacing (`className`) and heading style (`headingClassName`); centralizing the
 * markup means structure/a11y changes happen in one place. Templates with a
 * structurally different section (boxed labels, indexed dividers, etc.) render
 * their own and don't use this.
 */
export function BaseSection({
  title,
  className,
  headingClassName,
  children,
}: {
  title: string;
  className?: string;
  headingClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={className}>
      <h2 className={headingClassName}>{title}</h2>
      {children}
    </section>
  );
}
