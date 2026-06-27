import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/utils/supabase/auth";
import { getResume } from "@/lib/resume/db";
import { Editor } from "@/components/resume/editor";

export const metadata: Metadata = {
  title: "Editor",
  robots: { index: false, follow: false },
};

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getCurrentUser())) redirect("/login");

  const { id } = await params;
  const resume = await getResume(id);
  if (!resume) notFound();

  return (
    <Editor
      id={resume.id}
      initialTitle={resume.title}
      initialTemplateId={resume.templateId}
      initialDensity={resume.density}
      initialPageSize={resume.pageSize}
      initialContent={resume.content}
    />
  );
}
