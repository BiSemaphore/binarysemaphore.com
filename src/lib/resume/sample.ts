import { normalizeResume, type ResumeContent } from "@/lib/resume/schema";

/**
 * One demo resume, used to render template previews (gallery cards and the
 * /preview/[id] page). Kept here so previews stay consistent everywhere.
 */
export const SAMPLE_RESUME: ResumeContent = normalizeResume({
  basics: {
    name: "John Doe",
    title: "Senior Software Engineer",
    email: "john.doe@example.com",
    phone: "+1 555 0100",
    location: "San Francisco, CA",
    website: "johndoe.dev",
    summary:
      "Full-stack engineer who builds reliable products and the services behind them. I favour small, reversible changes and clear interfaces.",
  },
  experience: [
    {
      role: "Senior Software Engineer",
      company: "Acme Corp",
      start: "Mar 2024",
      end: "Present",
      current: true,
      bullets: [
        "Migrated the events pipeline to a sharded Kafka cluster; p99 latency cut 3x.",
        "Owned platform on-call; reduced pages 60% via sharper alerting and runbooks.",
        "Mentored four engineers through L4 to L5 promotions.",
      ],
    },
    {
      role: "Software Engineer",
      company: "Globex",
      start: "Jan 2020",
      end: "Jul 2022",
      current: false,
      bullets: [
        "Shipped the first public API: rate limiting, OAuth2, SDKs in 3 languages.",
        "Extracted the monolith's auth into an identity service, unblocking SSO.",
      ],
    },
  ],
  education: [
    {
      school: "State University",
      degree: "BSc",
      field: "Computer Science",
      start: "2014",
      end: "2018",
    },
  ],
  skills: ["Go", "TypeScript", "PostgreSQL", "Kafka", "Kubernetes", "Terraform"],
  projects: [
    {
      name: "loomroute",
      description: "URL routing library used by ~200 small SaaS apps.",
      link: "github.com/johndoe/loomroute",
    },
  ],
  links: [
    { label: "github", url: "github.com/johndoe" },
    { label: "linkedin", url: "linkedin.com/in/johndoe" },
  ],
});
