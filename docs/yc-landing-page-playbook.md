# YC-Style Landing Page Playbook (reference)

How newly-funded YC startups present themselves on their homepage, and how to
adapt it for **Binary Semaphore** (a studio doing products _and_ client work,
not a single-product SaaS).

Compiled 2026-06-21 from the sources at the bottom.

---

## Underlying principles

These show up across almost every teardown:

- **Win the first 5 seconds.** Visitors subconsciously decide whether to stay
  in ~5s. The hero has to make the right promise instantly.
- **One page, one goal, one CTA.** The "1:1 attention ratio": one core message,
  one call-to-action. Repeat the same CTA ~3× down the page. Don't dilute with
  five buttons or competing actions.
- **Outcome-first language.** Be literal and useful, not vague. Avoid "The
  Future of X" style headlines. Headline ideally 6–10 words.
- **Every section earns its place.** Remove one and the story breaks; add too
  many and the page loses focus.
- **Social proof early, not buried.** Logo strips / proof near the hero and CTA
  can lift conversion 20–30%.

---

## The standard section order (SaaS / single product)

1. **Hero / 5-second pitch**
   - Outcome-driven headline (6–10 words, literal not vague).
   - Subhead that says _how_ it works or _who_ it's for.
   - One dominant, centered CTA. If the CTA isn't obvious in 2s, the click is lost.

2. **Logo / trust strip**
   - 6–10 recognizable customer or investor logos, placed _near_ the hero/CTA.
   - Not in the footer. This is the single highest-leverage trust signal.

3. **Micro-demo above the fold**
   - Short looping video or interactive preview.
   - Goal: visitor understands the product in <15s without reading body copy.

4. **Problem statement**
   - The real pain, framed in the customer's own words.

5. **Agitation**
   - The hidden / compounding cost of living with that problem.

6. **Solution / transformation**
   - The "after" state. Quantify the improvement where possible.

7. **How it works (3 steps)**
   - Three sequential steps showing the path to value. Keep it to three.

8. **Testimonials**
   - Named quotes with title + company.
   - Specific outcomes beat adjectives ("cut onboarding from 10 days to 2,
     support tickets down 50%").

9. **Social proof / credibility**
   - User counts, investor logos, "Backed by YC" badge, press.

10. **Pricing**
    - Usually 3 tiers with clear feature fences and usage limits.

11. **Risk reducer + mini-FAQ**
    - Risk reducer beside pricing: trial length, refund, cancellation terms.
    - 3–5 FAQ items hitting real objections: security, integrations, ROI,
      setup time, refunds.

12. **Final CTA + footer**
    - Repeat the one CTA.
    - Footer carries legal links, security/compliance badges, utility resources.

---

## Binary Semaphore adaptation

BS is a studio (products + custom client work), so copy the _principles_, adapt
the _sections_. Source of truth for copy is `src/lib/site.ts`.

| YC section                     | What to do for BS                                                                                                                        |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Hero                           | **Keep.** Outcome-first headline + one primary CTA (e.g. "Start a project" / "Talk to us"). Human voice, no slogans, no em dashes.       |
| Logo / trust strip             | **Keep if we have it.** Client logos or "shipped for" near the hero. If none yet, substitute with shipped-project proof.                 |
| Product demo video             | **Swap → work/proof.** Use the curated `projects` case-studies strip + `threads` as evidence of how we think.                            |
| Problem → agitation → solution | **Keep, lightly.** Frame around reliability/maintainability, essential vs accidental complexity. Don't over-dramatize.                   |
| How it works (3 steps)         | **Keep.** "How we work" in 3 steps (scope → build → ship/maintain).                                                                      |
| Testimonials                   | **Keep.** Named client quotes with specific outcomes. High priority gap if missing.                                                      |
| Pricing table                  | **Drop.** Replace with "what working with us looks like" / engagement model (custom work + open-source tools).                           |
| Team section                   | **Keep — it's our social proof.** Single-product YC pages downplay the team; for a credible small studio the team _is_ the trust signal. |
| Risk reducer                   | **Adapt.** Not "30-day refund" but clear scope/process, shipped projects, open-source maintained in public.                              |
| Mini-FAQ                       | **Keep.** Tailor objections to client work: engagement model, IP/ownership, timelines, support.                                          |
| Final CTA + footer             | **Keep.** Repeat the single CTA.                                                                                                         |

### Watch-outs specific to BS

- **Two audiences, one CTA.** We serve product users _and_ clients. Don't put two
  competing CTAs in the hero — lead with the client-work CTA, let products/threads
  be secondary paths further down.
- **Voice.** Plain, human, concrete. No em dashes, no marketing slogans, no
  rainbow gradient headlines. Identity is the company ("we"), not a person.
- **Proof over promises.** Until we have a logo wall, shipped projects + threads
  carry the credibility load.

---

## Sources

- [Win the First 5 Seconds: The YC Landing Page Formula](https://www.thevccorner.com/p/win-the-first-5-seconds-the-yc-landing)
- [The Ultimate Guide: YC Startup Landing Pages](https://www.neweconomies.co/p/the-ultimate-guide-yc-startups)
- [Cracking the Code: How YC Startups Design Their Landing Pages (Medium)](https://medium.com/@matijazib/cracking-the-code-how-ycombinator-start-ups-design-their-landing-pages-to-validate-their-problems-57e61c2150f0)
- [9 YC Startup Homepages Reviewed — Growbo](https://www.growbo.com/startup-landing-page-critique/)
- [How to build a YC website launch strategy that converts — Grafit](https://www.grafit.agency/blog/yc-startup-launch-strategy)
- [Ask HN: must-have landing page sections](https://news.ycombinator.com/item?id=34255599)
