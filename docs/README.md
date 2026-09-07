# Docs

What each document is for, and whether it is still true. Read this before
adding another one.

## Current

| Document                                                     | Covers                                                             | Read it before                          |
| ------------------------------------------------------------ | ------------------------------------------------------------------ | --------------------------------------- |
| [`brand.md`](brand.md)                                       | Identity, copy voice, design language. Portable to other BS repos. | Writing any copy                        |
| [`database.md`](database.md)                                 | The whole schema, the reasoning, and what was measured.            | Adding a table or a policy              |
| [`admin.md`](admin.md)                                       | The admin surface at `root.binarysemaphore.com`.                   | Touching anything under `src/app/admin` |
| [`topics.md`](topics.md)                                     | The topic tree and its Discord-shaped shell.                       | Touching the shell                      |
| [`learn.md`](learn.md)                                       | Notebooks: the gate, entitlements, Storage.                        | Touching the reader or the gate         |
| [`auth.md`](auth.md)                                         | Sign-in, sessions, the proxy.                                      | Touching auth                           |
| [`yc-landing-page-playbook.md`](yc-landing-page-playbook.md) | Landing-page reference.                                            | Reworking the marketing site            |

## Rules

**One document per subsystem.** `AGENTS.md` is the index the agent reads; these
are the depth behind it. If a change makes a document wrong, correct it in the
same commit, and say what was measured rather than what was intended.

**Superseded documents get deleted, not stacked.** `content-backend.md` was a
research note asking whether content belonged in Postgres. It answered "mostly
not", the answer changed the same day, and it sat for a while contradicting
`database.md` while both looked current. Its conclusions live in
[`database.md`](database.md) under "How we got here". Two documents disagreeing
is worse than one being out of date, because nothing tells the reader which
one lost.

**Corrections carry their evidence.** Where a document was wrong, it now says so
in place, with the measurement. `database.md` and `admin.md` both recommended a
caching model that never invalidated anything; those sections keep the wrong
advice visible with the probe that disproved it, so the next person does not
rediscover it the expensive way.
