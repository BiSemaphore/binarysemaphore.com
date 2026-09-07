import { requireAdmin } from "@/lib/admin/auth";

/**
 * The editor's own shell: the whole window, and nothing else in it.
 *
 * Writing is the one thing here that wants every pixel, and the workspace
 * chrome was taking a third of the screen before a word appeared: a live
 * banner, a sidebar, a breadcrumb, a title heading, a summary field and an
 * action bar, all above and below two panes squeezed into what was left.
 *
 * A route group rather than a new path, so the URL is unchanged and the gate is
 * the same `requireAdmin()` the workspace uses. Only the frame differs.
 *
 * Navigation lives inside the editor's own top bar. The one link back is the
 * only one that makes sense while a document is open and unsaved.
 */
export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      {children}
    </div>
  );
}
