import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { BuiltWith } from "@/components/built-with";
import { Features } from "@/components/features";
import { Projects } from "@/components/projects";
import { Instagram } from "@/components/instagram";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <BuiltWith />
        <Features />
        <Projects />
        <Instagram />
        <Contact />
      </main>
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <Footer />
      </div>
    </>
  );
}
