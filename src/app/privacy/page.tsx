import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PageIntro } from "@/components/page-intro";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What Binary Semaphore collects when you use the site, why, how long it is kept, and how to have it removed.",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "14 September 2026";

/**
 * Written from what the code does, not from a template. When a data flow
 * changes (a new provider, a new form, analytics with cookies), change this
 * page in the same PR and move the date.
 */
export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pb-4">
        <PageIntro label="Privacy" title="What we keep, and why" />
        <section className="mx-auto w-full max-w-7xl px-6 lg:px-10">
          <div className="max-w-2xl space-y-10 text-base leading-8 text-muted">
            <p className="text-lg">
              Binary Semaphore is a small software studio. This site collects
              very little, and this page lists all of it. Last updated{" "}
              {UPDATED}.
            </p>

            <Section title="Reading the site">
              <p>
                Reading binarysemaphore.com needs no account and sets no
                tracking cookies. We use Vercel Analytics to count page views;
                it works without cookies and does not identify you across
                sites. Our hosting provider, Vercel, keeps ordinary server logs
                (IP address, browser, pages requested) for a short time to run
                and protect the service.
              </p>
            </Section>

            <Section title="Contact and mentorship forms">
              <p>
                When you write to us through the contact form or ask about
                mentorship, we store your name, email address, message, and,
                for mentorship, the college and paper you named. This goes into
                a private database we run on Supabase, and it is used only to
                reply to you.
              </p>
              <p>
                Messages are deleted 12 months after they arrive. Write to us
                sooner if you want one removed before that.
              </p>
            </Section>

            <Section title="Accounts on learn and the admin">
              <p>
                Some parts of the site, the study notebooks at
                learn.binarysemaphore.com and our own admin, need a sign-in. You
                can sign in with GitHub, Google, or an email address and
                password. Sign-in is handled by Supabase Auth, which stores your
                email address, the provider you used, and a session cookie so
                you stay signed in. We do not see your password, and we do not
                post anything to your GitHub or Google account.
              </p>
              <p>
                Notebook PDFs you download are stamped with the email address
                of the account that downloaded them. That is how we can tell
                where a copy came from if one is shared beyond its reader.
              </p>
              <p>
                To close an account, email us and we will delete it along with
                any download records.
              </p>
            </Section>

            <Section title="Bookings">
              <p>
                Mentorship sessions are booked through Cal.com. What you enter
                there is handled under{" "}
                <a
                  href="https://cal.com/privacy"
                  className="underline underline-offset-4 hover:text-foreground"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Cal.com&apos;s privacy policy
                </a>
                ; we receive the booking details you provide.
              </p>
            </Section>

            <Section title="Embedded content and links">
              <p>
                The home page shows recent posts from our Instagram account,
                loaded from Meta&apos;s servers, which see your request the way
                any image load does. Links to GitHub, LinkedIn, Discord, and
                other sites take you to services with their own policies.
              </p>
            </Section>

            <Section title="What we do not do">
              <p>
                We do not sell or share personal data, run advertising, or
                build profiles of readers. We do not use cookies for anything
                except keeping you signed in where you have signed in.
              </p>
            </Section>

            <Section title="Your rights and how to reach us">
              <p>
                You can ask what we hold about you, have it corrected, or have
                it deleted. Email{" "}
                <a
                  href={`mailto:${site.email}`}
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  {site.email}
                </a>{" "}
                and we will answer within a week.
              </p>
              <p>
                Data is stored with Supabase and Vercel, whose servers may be
                outside your country. Both process it only on our instructions.
              </p>
            </Section>

            <p className="text-sm text-subtle">
              Questions about the site itself go to{" "}
              <Link href="/contact" className="underline underline-offset-4 hover:text-foreground">
                the contact page
              </Link>
              . What you may do with the site and the notebooks is on the{" "}
              <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
                terms page
              </Link>
              .
            </p>
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
