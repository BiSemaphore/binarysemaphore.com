import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PageIntro } from "@/components/page-intro";
import { Team } from "@/components/team";

export const metadata: Metadata = {
  title: "Team",
  description: "The people behind Binary Semaphore.",
  alternates: { canonical: "/team" },
};

export default function TeamPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <PageIntro
          label="Team"
          title="The people behind it"
          lead="A small group of engineers who care about getting the fundamentals right."
        />
        <Team showHeading={false} />
      </main>
      <Footer />
    </>
  );
}
