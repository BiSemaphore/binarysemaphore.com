import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PageIntro } from "@/components/page-intro";
import { Projects } from "@/components/projects";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Open-source tools and products Binary Semaphore develops and maintains.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <PageIntro
          label="Products"
          title="What we've built"
          lead="Open-source tools and products we develop and maintain, across applied AI, distributed systems, and developer tooling."
        />
        <Projects showHeading={false} />
      </main>
      <Footer />
    </>
  );
}
