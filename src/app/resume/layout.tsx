import type { Metadata } from "next";
import { AppHeader } from "@/components/resume/app-header";
import { AppFooter } from "@/components/resume/app-footer";

export const metadata: Metadata = {
  title: {
    default: "Resume builder",
    template: "%s · Resume, by Binary Semaphore",
  },
  description:
    "Build a clean, professional resume from a few fields, pick a template, and export to PDF. By Binary Semaphore.",
};

export default function ResumeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      {children}
      <AppFooter />
    </div>
  );
}
