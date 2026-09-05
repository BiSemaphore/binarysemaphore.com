import { groups } from "@/lib/learn/topics";
import { learnBase } from "@/lib/learn/paths";
import { TopicsShell } from "@/components/learn/topics/shell";

/**
 * Wraps every /topics route in the shell.
 *
 * The tree is passed from the server as plain data, and `children` is rendered
 * on the server and handed through, so no topic prose reaches the client bundle.
 * The shell is the one part of `learn` on a black canvas; see docs/topics.md for
 * why the boundary sits exactly here.
 */
export default async function TopicsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const base = await learnBase();

  return (
    <TopicsShell groups={groups} base={base}>
      {children}
    </TopicsShell>
  );
}
