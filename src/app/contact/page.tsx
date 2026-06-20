import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
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
        <Contact withForm />
      </main>
      <Footer />
    </>
  );
}
