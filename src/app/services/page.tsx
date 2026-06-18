import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PageIntro } from "@/components/page-intro";
import { Services } from "@/components/services";
import { ArrowUpRightIcon } from "@/components/icons";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Services",
  description:
    "What Binary Semaphore works on: applied AI, distributed systems, and developer tools.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  const { label, title, lead } = site.services;
  return (
    <>
      <Header />
      <main className="flex-1">
        <PageIntro label={label} title={title} lead={lead} />

        <Services showHeading={false} />

        <section className="mx-auto w-full max-w-7xl px-6 pb-4 lg:px-10">
          <Link
            href="/contact"
            className="group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
          >
            Start a conversation
            <ArrowUpRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
