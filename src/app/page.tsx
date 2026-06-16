import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Clients } from "@/components/clients";
import { UseCases } from "@/components/use-cases";
import { Features } from "@/components/features";
import { FeatureList } from "@/components/feature-list";
import { Projects } from "@/components/projects";
import { Testimonials } from "@/components/testimonials";
import { Team } from "@/components/team";
import { Instagram } from "@/components/instagram";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Clients />
        <UseCases />
        <Features />
        <FeatureList />
        <Projects />
        <Testimonials />
        <Team />
        <Instagram />
        <Contact />
      </main>
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <Footer />
      </div>
    </>
  );
}
