import type { Metadata } from "next";
import { Figtree } from "next/font/google";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Editor",
  robots: { index: false, follow: false },
};

/**
 * The editor lives outside the resume `(app)` chrome group so it can be a
 * full-bleed canvas (no marketing header/footer). `.rx` scopes the resumex
 * clone styling (green accent, dotted canvas, mono chrome) to this subtree.
 */
export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${figtree.variable} rx font-[family-name:var(--font-figtree)]`}
    >
      {children}
    </div>
  );
}
