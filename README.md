# binarysemaphore.com

Personal site of **Shahid Raza** — software engineer building developer tools.

Live at **[binarysemaphore.com](https://binarysemaphore.com)**.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4
- Fully static, deployed on [Vercel](https://vercel.com)

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Editing content

All copy and links live in [`src/lib/site.ts`](src/lib/site.ts) — name, role,
tagline, social links, the About paragraphs, and the projects list. Edit there;
components read from that single source of truth.

## Deploys

Connected to Vercel's Git integration: every push to `main` ships to
production, and every pull request gets its own preview URL.
