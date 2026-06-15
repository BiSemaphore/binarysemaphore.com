import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { About } from "@/components/about";
import { Projects } from "@/components/projects";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6">
        <Hero />
        <About />
        <Projects />
        <Contact />
      </main>
      <div className="mx-auto w-full max-w-3xl px-6">
        <Footer />
      </div>
    </>
  );
}
