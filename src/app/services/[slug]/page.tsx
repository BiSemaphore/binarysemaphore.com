import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PageIntro } from "@/components/page-intro";
import { Reveal } from "@/components/reveal";
import { ArrowUpRightIcon } from "@/components/icons";
import { site, getService } from "@/lib/site";

type Params = { slug: string };

// Only the service slugs returned here exist; anything else 404s.
export const dynamicParams = false;

export function generateStaticParams() {
  return site.services.items.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};
  return {
    title: service.title,
    description: service.lede,
    alternates: { canonical: `/services/${slug}` },
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  return (
    <>
      <Header />
      <main className="flex-1">
        <PageIntro label="Services" title={service.title} lead={service.lede} />

        <section className="mx-auto w-full max-w-7xl px-6 lg:px-10">
          <div className="max-w-2xl space-y-4 text-lg leading-8 text-muted">
            {service.overview.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          <h2 className="mt-14 font-mono text-xs uppercase tracking-[0.2em] text-subtle">
            What this involves
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {service.offerings.map((offering, i) => (
              <Reveal key={offering.title} delay={(i % 3) * 80} className="flex">
                <div className="flex w-full flex-col rounded-panel border border-border bg-card p-6 shadow-soft">
                  <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">
                    {offering.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-7 text-muted">
                    {offering.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
            >
              Start a conversation
              <ArrowUpRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="/services"
              className="text-sm font-medium text-muted underline-offset-4 hover:text-foreground hover:underline"
            >
              All services
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
