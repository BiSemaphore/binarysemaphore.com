import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PageIntro } from "@/components/page-intro";
import { HowWeWork } from "@/components/how-we-work";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Binary Semaphore builds software across applied AI, distributed systems, and developer tools.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pb-4">
        <PageIntro label="About" title="Behind the work" />
        <section className="mx-auto w-full max-w-7xl px-6 lg:px-10">
          <div className="max-w-2xl space-y-4 text-lg leading-8 text-muted">
            {site.about.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </section>
        <HowWeWork />
      </main>
      <Footer />
    </>
  );
}
