:::title Design the endpoint for "archive organisation 5" right now. Method, path, status code. Seal it, and check it against section 40.
System Design Notebook / 08
REST API Design
Designing an interface for someone you will never meet
Senior backend and full-stack interview preparation. Read with a pen.
:::

## How to use this book

Every other notebook in this series is about making something work. This one is
about making something *understandable*, which is harder, because the person who
has to understand it is not in the room and never will be.

You will design an API once and then answer questions about it for two years.
The questions arrive as Slack messages from a frontend engineer, as bug reports
from a partner integration, as a support ticket from a customer whose retry
loop created four hundred duplicate orders. ==Every one of those questions is a
place where your interface failed to say something, and a human had to be paid
to find it out instead.==

#### The one question

==What can they work out without asking you?==

The lecture behind this book is *Complete REST API Design*
(`youtube.com/watch?v=RG6q57DwV8Y`, 2h04), and it names the problem exactly once,
at 48:30. If you do not follow a standard, the only two ways anyone can learn
your API are to __read your source code__ or to try things until something works.
Both are expensive. Both produce wrong assumptions that ship.

Everything in this book is one more thing they no longer have to ask you:

| Part | What they get for free, if you get it right |
|---|---|
| I | Why any of this is standardised at all |
| II | What the thing is, and what contains it |
| III | Whether it is safe to send twice |
| IV | What just happened, and whose fault it was |
| V | What comes back when they send nothing |
| VI | The one operation your nouns cannot express |
| VII | Every endpoint after the first |

If you can say, for any design decision, *what it tells the consumer and what it
leaves them guessing*, you can answer almost any API design question in an
interview, including the ones about standards this book does not cover.

#### What this book is not

It is not about HTTP. Notebook 10 covers the protocol: what a header is, how a
connection is established, what actually travels on the wire. This book assumes
all of that and asks a different question about the same machinery: ==given that
`PATCH` exists, when is choosing it the right design decision, and what does
choosing it promise?== Where the two touch, this book points across rather than
repeating badly.

It is also not about your framework. There is no routing code here, no ORM, no
controller. The lecture is emphatic about this and it is right: ==an API is
designed before it is programmed==, and the design outlives the language you
first wrote it in.

#### The five block types

| Block | What it means |
|---|---|
| Interviewer asks | A real follow-up you should expect. Answer it out loud before reading on. |
| Senior signal | The specific sentence that separates a senior answer from a mid-level one. |
| Trap | A common answer that sounds right and is wrong. |
| Do this | The concrete practice, with the parameter or the number. |
| Key idea | The one thing to carry out of that section. |

#### The four highlighters

Colour is never decorative here. Each one means one thing, so a marked phrase is
already half-read before you reach the words.

| Mark | Means |
|---|---|
| ==peach== | The sentence to carry away |
| !!rose!! | The wrong answer, the thing that bites |
| ++mint++ | The correct practice |
| %%pink%% | A definition, at the point it is first defined |

#### What is in the lecture and what is not

Parts I, II, III, VI and VII are the lecture, expanded, with the specification
put back where it hand-waves. Part IV is roughly a quarter lecture: it covers
four status codes, and the other seven in that part are the ones interviews
actually ask about. Part V corrects the lecture directly, because the pagination
it teaches has a bug that appears the moment two people use the system at once.

Where a claim in the lecture is wrong, this book says so, in a trap block, with
the specification reference. There are four of them.

#### A suggested route

1. Read Part I once and do not memorise it. It exists so that section 41 lands.
2. Parts II and III are reference. Read them with an API you have shipped open
   in another window, and mark every rule you broke.
3. Part IV is the highest interview yield in the book. Drill the codes until you
   can place any of the eleven without thinking.
4. Part V is the one to work with a pen.

:::key
An API is a promise made to a stranger, in public, that you cannot take back.
Every rule in this book is a way of making that promise ==say more, so that you
have to say less.==
:::

:::toc
:::

## The whole picture on one page

One endpoint. Every decision in this book is visible in it.

```text
  CLIENT                                                  SERVER
    │
    │   POST  /v1/organizations/8f2a/archive
    │   ────   ──  ─────────────  ────  ───────
    │    1      2        3          4      5
    │
    │   Content-Type: application/json               6
    │   Idempotency-Key: 7c1e-44b9                   7
    │   If-Match: "v8"                               8
    │
    │   { "reason": "merged into 3d10" }             9
    │ ─────────────────────────────────────────────────▶ │
    │                                                    │
    │ ◀───────────────────────────────────────────────── │
    │                                                    │
    │   202 Accepted                                10
    │   Location: /v1/jobs/44                       11
    │   ETag: "v9"                                  12
    │
    │   { "id": "8f2a", "status": "archiving" }     13
    │
```

Thirteen decisions, and each one is a question the consumer does not have to ask:

| # | The decision | What it tells them, for free |
|---|---|---|
| 1 | The method | Whether a retry is safe. Nothing else says this |
| 2 | The version | That you will not break them without warning |
| 3 | The collection, plural | That there are many of these, and this is one namespace |
| 4 | The instance | Which one. Opaque, so its format is not a promise |
| 5 | The action, last | That CRUD could not express this, and a verb was needed |
| 6 | The content type | How to parse the body, and which patch dialect |
| 7 | The idempotency key | That a timed-out retry will not act twice |
| 8 | The precondition | That a concurrent edit will be refused, not silently lost |
| 9 | The body | Only what the server cannot work out itself |
| 10 | The status code | What happened, and whose fault it was |
| 11 | The location | Where the thing that was made now lives |
| 12 | The validator | What to send back on the next write |
| 13 | The representation | The new state, so no follow-up read is needed |

Four rules are encoded in that picture, and they are the whole book.

- ==The interface must carry the answer, or a human will carry the question.==
  Every line above replaces a Slack message.
- ==Consistency beats correctness, and it is not close.== A consumer who has
  integrated one of your endpoints has already guessed the rest. Being uniformly
  unusual costs them one lookup. Being occasionally standard costs them all of
  them.
- ==Defaults are part of the design.== Sending nothing must work, and what comes
  back when they send nothing is a decision you make once for everybody.
- ==The method and the status code are the only two things every intermediary
  understands.== Proxies, caches, retry libraries and load balancers read those
  and nothing else. Get them wrong and machinery you never wrote will do the
  wrong thing on your behalf.

:::redraw The thirteen decisions on one request and its response, with the three headers most APIs omit. | Mark the two that every proxy on the path will read.
:::

:::part I | The standard exists so you do not have to negotiate

This part is history, and the lecture says you do not need to remember it. That
is true and it is not the point. The six constraints in section 3 are the reason
a browser written in 1995 can still fetch a page served today by software that
did not exist when it was written, ==without the two ever having agreed on
anything except HTTP.== That is the property you are trying to buy for your own
API, at much smaller scale, and knowing where it came from is what stops section
41 sounding like heresy.

Read it once. Do not memorise it.
:::

## 1. The requirement: an interface two strangers agree on

You are building a project management platform. Organisations contain projects,
projects contain tasks. Think of Jira or Linear with the ambition removed.

The backend is yours. The web client belongs to a frontend engineer two desks
away, the mobile client belongs to a contractor in another timezone, and in six
months a customer's integration team will connect their own systems to it
without ever speaking to you. ==Those three groups will never read your source
code.== The interface is all they get.

Now consider what happens if you design it carelessly. Say you used `POST` where
a `PUT` belonged, called one field `description` and another `desc`, returned
`404` for an empty search result, and named one collection `/organizations` and
another `/project`. Nothing here is a bug. Every endpoint works exactly as you
intended.

The lecture puts the consequence plainly at 48:30. Someone integrating that API
has only two ways to discover how it behaves:

```text
  1. read your code            requires access, and the ability to read
                               your language, and time you did not budget

  2. call it and observe       requires guessing, and every guess that
                               works becomes a permanent assumption
```

Both are expensive, and the second one is worse than it looks, because ==an
assumption that happens to work is indistinguishable from documentation== until
the day you change the behaviour it was resting on.

:::term Consumer
Anyone who calls your API: another team's frontend, a mobile app, a partner's
server, a script someone wrote once. The word is deliberate. They consume an
interface, not a codebase, and the interface is the entire relationship.
:::

**The standard is the alternative to the conversation.** If you follow the same
conventions everyone else follows, the consumer arrives already knowing most of
your API. They know the collection is plural. They know `GET` will not change
anything. They know `201` means something was created and `404` means it was not
found. ++You spent none of your time and none of theirs establishing any of
that.++

That is the entire economic argument for standards, and it is worth stating in
one line because interviews ask for it:

:::signal
A standard is not about correctness. It is a mechanism for transferring
knowledge to people you will never meet, at zero marginal cost, and the value of
following one is proportional to how many strangers will read your interface.
:::

:::trap
!!"We are an internal API, so the standards do not really apply to us."!!

Internal is where this hurts most, because internal APIs get the least
documentation and the most consumers over time. The frontend integrates it, then
the mobile app, then the data team's export job, then the new hire who joins in
a year and has nobody left to ask. ++The people you are designing for are mostly
future colleagues, and they are strangers too.++
:::

:::key
An API's real users are not programs. They are the engineers who have to predict
what your program will do, and ==every convention you follow is a prediction
they get to make correctly without asking.==
:::

## 2. 1990 to 1993: the web outgrows its inventor

In 1990, Tim Berners-Lee started a project to share documents between
researchers. Within about a year, that project had produced six things, and you
are still using all six:

```text
  1. the URI          a name for a thing, that anyone can write down
  2. HTTP             the rules for asking for it
  3. HTML             a format for what comes back
  4. the web server    the thing that answers
  5. the web browser   the thing that asks
  6. an HTML editor    built into the browser, and the one that did not last
```

That sixth one is worth a moment. The original browser could edit the page you
were reading and write it back. ~~The web was designed to be read and written
symmetrically~~, and it took about thirty years and a great deal of JavaScript
to get back to something resembling that.

**Then it grew, and growth was the problem.** The design assumed a research
network. What arrived was the public, in numbers nobody had planned for. By 1993
the project was heading toward breakdown, not because any single piece was
wrong, but because ==nothing in it had been designed for the number of
participants it suddenly had.==

Roy Fielding, then co-founder of the Apache HTTP server project, was working on
exactly this problem. His question was not "how do we make the server faster".
It was structural: ((what properties must it have)) so that new pieces,
written by people who never coordinate, can be added without the whole thing
falling over?

His answer was a set of constraints. Not features, ++constraints++: rules about
what components are *not* allowed to do, chosen so that useful properties fall
out for free.

**Two things came out of that work.** Fielding and Berners-Lee co-authored the
specification for HTTP/1.1, the first version of the protocol that was really
engineered rather than invented. Then, in 2000, Fielding wrote his doctoral
dissertation, which did something unusual: rather than proposing a new
architecture, it described and named the one the web had already become.

He called it %%Representational State Transfer%%, or REST.

:::do
Read chapter 5 of Fielding's dissertation once. It is about twenty pages, it is
plain English, and it is the only primary source in this book. Searching for
"Fielding REST dissertation" finds it. Nearly everything written about REST since
is a summary of a summary, and most of the confusion in this field comes from
that chain.
:::

:::key
REST was not designed and then implemented. ==It is a description, written in
2000, of why the web had survived the previous decade.== That ordering explains
its whole character: the constraints are the ones that turned out to matter under
real load, not the ones that seemed elegant in advance.
:::

## 3. Fielding's six constraints

Five constraints, plus one optional. Each one forbids something, and each
prohibition buys a property.

| # | Constraint | What it forbids | What it buys |
|---|---|---|---|
| 1 | Client-server | The UI knowing how storage works | Either side can be rewritten alone |
| 2 | Uniform interface | Per-service calling conventions | One integration skill, every service |
| 3 | Layered system | A component seeing past its neighbour | Proxies, caches, gateways, load balancers |
| 4 | Cacheable | Responses that cannot be labelled | Work that does not reach your server |
| 5 | Stateless | The server remembering the last call | Any instance can answer any request |
| 6 | Code on demand | (optional) | Client behaviour shipped from the server |

Three of them deserve more than a table row.

**Stateless is the one your architecture rests on.** Each request must carry
everything needed to understand it. The server keeps nothing between calls. This
sounds like an inconvenience until you put a load balancer in front of four
instances: because no instance remembers anything, ==any of them can serve any
request, and adding a fifth requires no coordination at all.== Every horizontal
scaling story you have ever heard is downstream of this constraint. Notebook 06
section 12 covers what it costs and where sessions actually go; Notebook 07 is
the book about what happens when you break it deliberately.

**Layered system is why you can put things in front of your API.** A component
may only see the layer immediately next to it. Your service does not know
whether it is talking to a browser, a CDN, an API gateway or a load balancer, and
it must not care. This is what lets you add a cache in front of a running system
without changing a line of application code. It is also, unglamorously, why the
proxy in the middle can break your streaming response without either end
noticing.

**Uniform interface is the constraint this whole book is about.** It has four
sub-constraints, and it is the reason a standard exists to follow:

```text
  a. resources are identified                  a URL names a thing
  b. resources are manipulated                 you send a representation,
     through representations                   not a database command
  c. messages are self-descriptive             the method, the content type
                                               and the status code say what
                                               is happening, to anyone
  d. hypermedia as the engine                  the response tells you what
     of application state                      you can do next
```

Sub-constraint (c) is the one to hold on to. ==A message is self-descriptive when
an intermediary that knows nothing about your application can still act on it
correctly.== A cache can store a `GET` without knowing what a project is. A retry
library can safely repeat a `PUT` without understanding your business. That
property is not a nicety; it is what allows infrastructure to exist at all.

Sub-constraint (d) is the one nobody implements, and it gets section 5 to itself.

:::ask
"Which REST constraint does a JWT in an `Authorization` header serve, and which
one does a server-side session table break?"

The token serves statelessness: it travels with every request, so any instance
can validate it without shared memory. A session table breaks statelessness,
because the server now remembers something between calls, and the fix people
reach for first, sticky sessions, actually breaks the layered-system constraint
too by making the load balancer care which instance you spoke to last. Notebook
05 section 22 covers the token side properly.
:::

:::key
Constraints are subtractive. Each one removes something you were allowed to do,
and the property you wanted appears in the space left behind. ==Statelessness is
not a feature of your servers, it is a promise you make to a load balancer that
has not been bought yet.==
:::

## 4. Why it is called REST

Three words, and the middle one is the one people get wrong.

**Representational.** A resource is the *thing*. A representation is one *format
of that thing on the wire*. The user with id 8f2a is a resource; the JSON
document describing that user is a representation of it, and so is the HTML page,
and so is the CSV row in an export.

```text
                        ┌──────── application/json  ──▶  another server
   RESOURCE             │
   user 8f2a  ──────────┼──────── text/html         ──▶  a browser
   (the thing)          │
                        └──────── text/csv          ──▶  an export job
```

==The resource has one identity and many representations, and the URL names the
resource, not the format.== This is why `/users/8f2a.json` is a slightly wrong
URL and `/users/8f2a` with an `Accept: application/json` header is the right one.
The lecture describes representations correctly and then never mentions the
mechanism that selects between them, which is %%content negotiation%%: the client
states what it can accept, the server picks, and says what it picked in
`Content-Type`.

In practice almost every API you build will serve exactly one representation,
JSON, and you will never negotiate anything. ++Design the URL as though you might
one day, because it costs nothing now and a `.json` suffix is very hard to remove
later.++

**State.** The current condition of that resource: its field values, right now. A
shopping cart's state is its items, their quantities and the total.

**Transfer.** State moves between client and server as representations. `GET`
transfers one to the client. `POST` and `PATCH` transfer one to the server.

Put together, the name is a literal description of the mechanism: ==you move
representations of resource state back and forth, and that is all that ever
happens.== No method calls, no remote objects, no sessions, no server-side
conversation. It is a deliberately small idea, and its smallness is the point,
because a small idea is one that intermediaries can be built against.

:::term Resource
Any thing worth naming with a URL: a user, an order, a search result, today's
sales report. If a client might want to refer to it, fetch it, or act on it, it
is a resource. Resources are ((nouns, without exception)).
:::

:::trap
!!"REST means JSON over HTTP."!!

JSON appears nowhere in Fielding's dissertation; it did not exist. HTTP is not
required either, though in practice it is always used. ++REST is an architectural
style defined by six constraints, and the thing everyone calls a REST API is
better described as an HTTP JSON API that follows some of them.++ Say that in an
interview and you have signalled that you read the source.
:::

:::key
Resource and representation are different things, and ==the URL identifies the
resource.== Almost every URL design mistake in Part II is a version of putting
the representation, the format, the version of your code, or the action into a
place reserved for identity.
:::

## 5. The constraint nobody implements

Sub-constraint (d) of the uniform interface has an unfortunate name: %%hypermedia
as the engine of application state%%, abbreviated HATEOAS. The idea is simple.

A response should not only carry data. It should carry the ++set of things you
can do next++, as links. The client starts at one URL and discovers the rest of
the API by following what it is given, exactly as a person uses a website without
ever being told its URL structure.

```text
  { "id": "8f2a",
    "name": "Acme",
    "status": "active",
    "_links": {
      "self":     { "href": "/v1/organizations/8f2a" },
      "projects": { "href": "/v1/organizations/8f2a/projects" },
      "archive":  { "href": "/v1/organizations/8f2a/archive", "method": "POST" }
    } }
```

The payoff is real: the client stops hard-coding URLs, so you can move them. And
when the organisation is already archived, you simply omit the `archive` link,
and ==the client's available actions become server-controlled state rather than
client-side business logic duplicated in three apps.==

**Almost nobody does this.** The industry mostly stops one level short, and there
is a standard vocabulary for how short, the Richardson Maturity Model:

| Level | What it means | Who is here |
|---|---|---|
| 0 | One URL, one method, everything in the body | SOAP, most internal RPC |
| 1 | Many URLs, still one method | Legacy APIs, `POST /getUser` |
| 2 | URLs plus HTTP methods and status codes | ==Essentially the entire industry== |
| 3 | Level 2 plus hypermedia | GitHub, PayPal, and few others |

++This book teaches level 2 without apology, because level 2 is what your
colleagues, your interviewer and your consumers all mean by REST.++ But you
should know two things about the gap.

**First, Fielding does not accept the compromise.** In a 2008 post titled *REST
APIs must be hypertext-driven*, he wrote that an API which does not use
hypermedia to drive state transitions is not REST. By the definition of the man
who coined the word, ==almost nothing anyone calls a REST API is one.== Level 2
is a useful, pragmatic, universal deviation, and it is still a deviation.

**Second, the argument is worth understanding rather than dismissing.** The
reason level 3 has not won is not that engineers are lazy. It is that its main
benefit, clients that discover URLs at runtime, requires clients that are written
to discover URLs at runtime, and nobody writes those, because a single-page
application built against your API in React hard-codes the routes and ships. The
constraint solves a coordination problem the browser has and your mobile app does
not.

:::signal
"We are at Richardson level 2, which is the industry norm and a conscious
deviation from Fielding's definition. We use hypermedia in exactly one place:
pagination links, because the cursor format is genuinely ours to change."

Naming the level, calling it a deviation, and then pointing at the one place
hypermedia actually pays is a complete senior answer to a question most people
answer with a definition.
:::

:::ask
"So is your API RESTful?"

The honest answer is short. "It is level 2 on the Richardson model: resources as
URLs, HTTP methods with their standard semantics, meaningful status codes. It is
not hypertext-driven, so by Fielding's strict definition it is not REST. Neither
is Stripe's." Confidence about the gap reads far better than a claim you cannot
defend.
:::

:::key
==Level 2 is the target, and you should be able to say why you stopped there.==
The constraints in section 3 all pay for themselves in ordinary systems.
Hypermedia pays for itself when clients outnumber the teams who write them, which
is true of the web and untrue of most APIs.
:::

:::recall Name the six constraints, and say what each one forbids. | 7
:::

:::recall A resource has many of them and one identity. Which is which, and which one does the URL name? | 4
:::

:::recall What is Richardson level 2, what is missing from it, and what did Fielding say about that in 2008? | 6
:::
