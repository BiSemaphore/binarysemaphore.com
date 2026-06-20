import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Stats } from "@/components/stats";
import { Services } from "@/components/services";
import { TechStack } from "@/components/tech-stack";
import { Projects } from "@/components/projects";
import { HowWeWork } from "@/components/how-we-work";
import { Testimonials } from "@/components/testimonials";
import { Faq } from "@/components/faq";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Stats />
        <Services />
        <TechStack />
        <Projects />
        <HowWeWork />
        <Testimonials />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
