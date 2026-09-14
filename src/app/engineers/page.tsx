import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PageIntro } from "@/components/page-intro";
import { Team } from "@/components/team";

export const metadata: Metadata = {
  title: "Engineers",
  description: "The engineers who build Binary Semaphore.",
  alternates: { canonical: "/engineers" },
};

export default function TeamPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <PageIntro
          label="Engineers"
          title="The engineers behind it"
          lead="Two engineers who build things and care about getting the fundamentals right."
        />
        <Team />
      </main>
      <Footer />
    </>
  );
}
