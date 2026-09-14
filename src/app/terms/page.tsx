import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PageIntro } from "@/components/page-intro";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The terms for using binarysemaphore.com, the study notebooks at learn, and free mentorship sessions.",
  alternates: { canonical: "/terms" },
};

const UPDATED = "14 September 2026";

/**
 * Nothing on the site is paid, so these terms are short: what you may do
 * with what we publish, what an account is for, and what we promise (and
 * do not) about mentorship. If mentorship ever becomes paid, that section
 * needs pricing, refunds and cancellation terms, and the date moves.
 */
export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pb-4">
        <PageIntro label="Terms" title="Terms of use" />
        <section className="mx-auto w-full max-w-7xl px-6 lg:px-10">
          <div className="max-w-2xl space-y-10 text-base leading-8 text-muted">
            <p className="text-lg">
              These terms cover binarysemaphore.com and its subdomains, run by
              Binary Semaphore, a software studio. Nothing here is a paid
              service, so the terms are short. Last updated {UPDATED}.
            </p>

            <Section title="Using the site">
              <p>
                You may read, link to, and quote from the site. Threads and
                other writing are ours unless a page says otherwise; quote
                with attribution and a link. Our open-source tools carry their
                own licences in their repositories, and those licences, not
                this page, govern the code.
              </p>
              <p>
                Do not scrape the site at a rate that affects other readers,
                probe it for vulnerabilities without asking first, or use the
                contact and mentorship forms to send anything other than a
                message to us.
              </p>
            </Section>

            <Section title="Accounts">
              <p>
                An account is needed for the study notebooks at
                learn.binarysemaphore.com. Keep it to yourself: one person per
                account. We may close an account that shares notebooks beyond
                its reader, sends abuse through the forms, or is used to attack
                the site. You can close your own account by emailing us.
              </p>
            </Section>

            <Section title="Study notebooks">
              <p>
                Notebooks are for the person whose account downloads them.
                Each PDF is stamped with that reader&apos;s email address. You
                may keep and print your copy for your own study. Do not
                redistribute it, post it, or sell it. If a stamped copy turns
                up somewhere public, we will take that as the account holder
                having shared it.
              </p>
              <p>
                Access is granted per notebook and does not expire. We may
                correct or replace a notebook at any time; your access carries
                over to the corrected edition.
              </p>
            </Section>

            <Section title="Mentorship">
              <p>
                Mentorship sessions are free. A session is one person on a
                call working through your own question: your paper, your
                error, your lab sheet. It is not a course, it comes with no
                certificate, and we will not do your assignment for you.
              </p>
              <p>
                Sessions are offered as time allows. We may decline a request,
                reschedule, or stop offering sessions, without owing anything.
                If you book and cannot make it, cancel through the booking link
                so the slot goes to someone else.
              </p>
            </Section>

            <Section title="No warranty">
              <p>
                The site, the notebooks, and anything said in a session are
                provided as they are. We try to be accurate and we correct
                mistakes when told about them, but we do not guarantee that any
                of it is complete or right for your situation, and we are not
                liable for what you do with it. Your exam results, your code,
                and your decisions remain yours.
              </p>
            </Section>

            <Section title="Changes and contact">
              <p>
                We may change these terms; the date at the top moves when we
                do, and continuing to use the site after that means you accept
                the change. Questions go to{" "}
                <a
                  href={`mailto:${site.email}`}
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  {site.email}
                </a>
                . How we handle personal data is on the{" "}
                <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
                  privacy page
                </Link>
                .
              </p>
            </Section>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl font-bold tracking-tight text-foreground">{title}</h2>
      {children}
    </div>
  );
}
