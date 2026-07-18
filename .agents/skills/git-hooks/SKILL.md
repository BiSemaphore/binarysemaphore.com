---
name: git-hooks
description: Git hooks and commit conventions for binarysemaphore (Husky, lint-staged, commitlint / Conventional Commits). Read before committing or pushing so commits satisfy the hooks instead of failing or getting bypassed.
---

# Git hooks & commit conventions

This repo uses Husky. Hooks are enforced locally and mirror CI. **Never bypass a
hook with `--no-verify`** — fix the underlying issue instead.

## Hooks

- **pre-commit** -> `lint-staged`: ESLint `--fix` on staged `*.{ts,tsx}`, and
  Prettier `--write` on staged `*.{json,css,md}`. Staged files only.
- **commit-msg** -> `commitlint`: the message must follow Conventional Commits.
- **pre-push** -> `npm run typecheck && npm run test` (unit). Push is blocked if
  either fails.

The `prepare` script wires the hooks up automatically after `npm install`.

## Conventional Commits

Header: `type(optional-scope): subject`

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
`build`, `ci`, `chore`, `revert`. Subject is lower case with no trailing period;
the header is at most 100 characters. Body and footer are optional and separated
from the header by a blank line.

Examples:

- `feat(hero): add service pills to the panel`
- `fix(nav): repoint footer links to dedicated pages`
- `chore(deps): bump next to 16.2.9`
- `docs: rewrite the README testing section`

End commit bodies with the `Co-Authored-By:` trailer when applicable.

## If a hook fails

- **Lint/format:** the `--fix` pass restages most issues; otherwise run
  `npm run lint`, fix, restage, recommit.
- **Commit message:** rewrite it to the Conventional Commits format above.
- **Pre-push typecheck/test:** run `npm run typecheck` and `npm run test`, fix
  the failure, then push.

Always work on a feature branch and open a PR; never commit directly to `main`.
