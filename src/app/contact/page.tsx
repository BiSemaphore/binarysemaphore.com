import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PageIntro } from "@/components/page-intro";
import { Contact } from "@/components/contact";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Binary Semaphore about the tools, a project, or developer tooling in general.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <PageIntro
          label="Contact"
          title="Get in touch"
          lead="Using the tools, building something, or just want to compare notes on developer tooling? We'd like to hear from you."
        />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
