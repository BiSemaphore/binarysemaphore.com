:::title Draw how the second browser finds out that the first browser moved a task. Keep it. Redraw it at the end.
System Design Notebook / 07
Real-Time Backends
What it costs to let the server speak first
Senior backend and full-stack interview preparation. Read with a pen.
:::

## How to use this book

Every backend you have written so far has one shape. The client asks, the server
answers, and the connection closes. Authentication, routing, services,
repositories, caching, background jobs, object storage: all of it hangs off that
one exchange, and none of it needs the server to ever start a conversation.

This book is about the moment that stops being enough. Two people have the same
board open. One drags a task from *To Do* to *In Progress*. The other should see
it move, live, without refreshing.

The lecture behind this book is *Real-Time Backends*
(`youtube.com/watch?v=wUQryt697cs`, 52 minutes), and its running order is the
right spine: it does not start with WebSockets. It starts with a loop that asks
the server "anything new?" every three seconds, and then measures what that
costs until the cost forces the next design.

#### The one question

==The server can now speak first. What did that cost?==

That question generates every part of this book, because the inversion is not
free and the bill arrives in six different currencies:

| Part | The currency |
|---|---|
| I | Requests and latency, traded against each other |
| II | One direction only, and the proxies in between |
| III | Everything HTTP gave you: headers, caching, methods, statelessness |
| IV | File descriptors, ports, and roughly 10 KB of RAM per connection |
| V | The stateless architecture you spent the whole playlist building |
| VI | Delivery guarantees, and work that scales with subscribers |
| VII | A new authentication model and a new attack surface |

If you can say what each design bought and what it charged, you can answer
almost any real-time question asked in an interview, including the ones about
technologies this book does not name.

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

Figures follow the same discipline. Box drawing recedes to a pale wire so the
shape reads first, NODE LABELS take full ink, and anything after a left arrow is
an annotation in pencil rather than part of the machine.

#### What is in the lecture and what is not

Parts I to VI are the lecture, expanded, with the arithmetic filled in where it
hand-waves and the production details added where it stops. Part VII is entirely
outside it: authenticating a long-lived socket, the hijack that CORS does not
protect you from, presence, collaborative editing, and what replaces WebSockets
next. The lecture names presence and collaborative editing as things it is not
covering; they are asked about constantly, so they are here.

Sections that overlap Notebook 06 (*Scaling and Performance*) on load balancing
and statelessness, or Notebook 05 (*Backend Security*) on authorisation, say so
and point at the section that goes deeper rather than repeating it badly.

#### A suggested route

1. Read Part I in one sitting, with a pen, and do the arithmetic yourself. The
   cost model in section 4 is the argument for everything that follows.
2. Read Parts II and III together. They are one comparison, not two topics.
3. Work Part IV with a terminal open. `ulimit -n` and
   `sysctl net.ipv4.ip_local_port_range` on whatever machine you have.
4. Parts V and VI are where interviews actually go. Drill them.

:::key
Real-time is not a technology choice. It is the decision to stop paying per
request and start paying per connection, and then discovering that a connection
is ==state that lives in one process== and cannot be moved. Everything hard about
real-time backends is downstream of that one sentence.
:::

:::toc
:::

## The whole picture on one page

```text
   BROWSER A                                          BROWSER B
   (board 412)                                        (board 412)
       │                                                  ▲
       │ 1. POST /tasks/9/move        7. frame: task.moved │
       ▼                                                  │
  ┌─────────────┐                                  ┌─────────────┐
  │ INSTANCE 1  │                                  │ INSTANCE 2  │
  │             │                                  │             │
  │ ws conns:   │                                  │ ws conns:   │
  │   A ────────┼──┐                          ┌────┼──────── B   │
  └──────┬──────┘  │                          │    └─────────────┘
         │         │  each instance holds     │
    2. commit      │  its own sockets and     │  6. look up local
         │         │  knows nothing about     │     subscribers
         ▼         │  the other's             │     for board 412
  ┌─────────────┐  │                          │
  │  DATABASE   │  └──────────────────────────┘
  │             │              ▲
  │ source of   │              │
  │ truth       │       ┌──────┴───────┐
  └─────────────┘       │   PUB / SUB  │
         │              │              │
    3. assign seq   4.  │ topic:       │  5. delivered to every
       number    publish│  board.412   │     subscribed instance
         └──────────────▶              │
                        └──────────────┘
                               │
                        ┌──────┴───────┐
                        │  EVENT LOG   │ ← only if you need at-least-once
                        │  seq 1..N    │   and a catch-up path
                        └──────────────┘
```

Four rules are encoded in that picture, and they are the whole architecture.

- ==A connection is state, and it lives in exactly one process.== Instance 1 is
  the only machine in the world that can write to browser A. No load balancer
  setting changes that.
- ==The instances must talk to each other, because the connections cannot.== That
  is the entire job of the pub/sub layer.
- ==Every event carries a sequence number.== It is the only thing that makes a
  dropped connection recoverable, and it costs almost nothing to add on day one.
- ==The database is still the source of truth.== The real-time path is a delivery
  optimisation on top of it, never a replacement for it. If the socket path is
  broken, a refresh must still show the correct board.

:::redraw The path of one task move, from browser A's click to browser B's screen, across two instances. | Seven arrows. Mark which one crosses a process boundary.
:::

:::part I | The client always spoke first

Every design in this part is an attempt to fake server-initiated communication
over a protocol that does not have it. They all work. What separates them is the
price, and the price is always paid in the same two currencies: requests and
delay. Learn the arithmetic here and the rest of the book is consequences.
:::

## 1. The requirement: two people, one board

You have built a task management application. It has authentication, a database,
services, repositories, caching, background jobs, and object storage for
attachments. It is, by any reasonable measure, a complete backend.

Two users have board 412 open. Aas drags task 9 from *To Do* to *In Progress*.
Leo, in another country, should see the card move.

Not on refresh. Not on navigation. ==Live.==

That is the entire requirement, and it is ordinary. Nobody in the room thinks
they are asking for something exotic. But it is the first feature you have ever
been given that your backend has no mechanism to deliver, and the reason is
worth stating precisely before reaching for a solution.

```text
  every feature you have shipped so far

    client  ──── asks ────▶  server
    client  ◀─── answers ──  server
            (connection closes)

  this feature

    server  ──── ??? ─────▶  client
            (nothing the server can do starts this arrow)
```

Aas's move arrives at your server as an ordinary `POST`. That half is solved. The
unsolved half is that ==your server now knows something Leo's browser wants, and
has no way to say it==.

:::signal
Frame it as a protocol constraint, not a missing library. "HTTP has no
server-initiated message, so every solution here is either the client asking
repeatedly, or the client opening a channel the server can write into later."
That sentence tells the interviewer you understand why four different answers
exist instead of one.
:::

:::key
The requirement is not "add WebSockets". The requirement is to invert who speaks
first, on a protocol that was designed so only one side ever does.
:::

## 2. The shape of every request you have written so far

It is worth being exact about the constraint, because the exactness is what
makes the next four designs legible.

An HTTP exchange has a fixed order. The client opens a connection, writes a
request line and headers, and only then may the server write anything at all. The
server can be slow, it can stream a body, it can hold the connection open for
minutes, but ==it cannot write first, and it cannot write twice==.

```text
  what the server is allowed to do          what it is not
  ────────────────────────────────          ──────────────
  respond slowly                            respond before being asked
  respond in chunks over time               respond again later, unprompted
  keep the connection open                  open a connection to the browser
  refuse to respond                         address a client it is not talking to
```

The last line on the right is the one people forget. Even if your server could
open connections outbound, it does not know where the browser is: the browser is
behind a home router, a carrier NAT, a corporate firewall, and has no stable
address. ==The asymmetry is not politeness, it is addressability.== The client can
reach the server. The server cannot reach the client. The only channel that will
ever exist is one the client opened.

:::term NAT
Network address translation. A router rewrites the source address and port of
outgoing packets so that many devices share one public address. It keeps a table
of those translations so replies find their way back, which means a connection
can only be established from the inside out. This is why your laptop has an
address no server can dial.
:::

Everything in this book is therefore a variation on one move: __the client opens
the channel, and the server uses it later__. The designs differ only in how long
"later" is allowed to be, and how many times the server may use it.

:::ask Why can the server not just open a TCP connection back to the browser?
Because the browser has no reachable address. It sits behind at least one layer
of NAT, usually several, and often a firewall that drops unsolicited inbound
packets. Its address is only meaningful inside the connection it opened. This is
also why peer-to-peer protocols need STUN, TURN and ICE: hole punching exists
entirely to work around this. For a backend, the practical consequence is that
the client always initiates, forever, and the only question is what it gets to
keep afterwards.
:::

:::key
The client opens every channel that will ever exist. The server's only lever is
how long it keeps that channel and how many messages it puts through it.
:::

## 3. Polling, and why it is not stupid

Strip away everything you know and the intuitive solution is the correct place
to start: if the server cannot tell you, ask it.

```text
  browser                                server
    │ GET /boards/412/changes?since=...   │
    ├────────────────────────────────────▶│  SELECT ... WHERE updated_at > ?
    │◀────────────────────────────────────┤  200 {"changed": false}
    │  wait 3s                            │
    ├────────────────────────────────────▶│
    │◀────────────────────────────────────┤  200 {"changed": false}
    │  wait 3s                            │
    ├────────────────────────────────────▶│
    │◀────────────────────────────────────┤  200 {"changed": true, ...}
```

%%Polling%% is a loop on the client that issues an ordinary request on a fixed
interval and applies whatever came back. It uses nothing you do not already have:
your existing routes, your existing auth middleware, your existing handlers. It
survives every proxy, every corporate firewall and every ancient browser, because
it is not a special case of anything.

++For internal tooling with a few dozen users, polling every few seconds is a
correct engineering decision and you should not apologise for it.++ It is the
design with the fewest moving parts, and the failure mode of a missed poll is
"the next poll picks it up", which is the best failure mode any design in this
book has.

The reason to keep going is not that polling is wrong. It is that its cost is
attached to the wrong number, and section 4 does that arithmetic.

:::trap
"Polling is the naive solution, so I would never use it." That answer is worse
than the design it rejects. Every real-time system has a polling fallback,
because when the socket path breaks you need something that still delivers, and
the reconnect-and-refetch path in section 32 is polling with a longer interval.
The senior position is that polling is the correct default until you can name
which of its two costs you are actually hitting.
:::

:::key
Polling is not a beginner's mistake. It is the design whose cost is tied to the
number of users rather than the number of events, and that single property is
what eventually disqualifies it.
:::

## 4. The arithmetic of polling

This is the section to work with a pen, because the two formulas here are the
argument for the entire rest of the book.

**The delay.** A change that happens immediately after a poll waits the full
interval. One that happens immediately before waits nothing. Uniformly
distributed, the average wait is half the interval:

```text
  average delay  =  T / 2          worst case  =  T

  T = 3s   ──▶   1.5s average, 3s worst
  T = 1s   ──▶   0.5s average, 1s worst
```

**The cost.** Every browser with the board open issues one request per interval,
independent of whether anything happened:

```text
  requests per second  =  U / T          U = concurrent users
                                         T = poll interval, seconds

  10,000 users, T = 3s   ──▶   3,333 rps
  10,000 users, T = 1s   ──▶  10,000 rps
```

And each one of those is a real request. It crosses the load balancer, runs your
authentication middleware and validates a token, writes a log line, enters a
service, queries the database, and serialises a response. ==Ten thousand database
queries per second, and almost all of them return "nothing changed".==

Now multiply the two together:

```text
  rps  ×  average delay  =  (U / T) × (T / 2)  =  U / 2
```

The interval cancels. ==With polling, requests per second multiplied by average
delay is a constant, fixed by your user count.== You cannot improve latency
without paying exactly proportionally in load, forever, at every scale. Making
the interface three times snappier makes the infrastructure bill three times
larger, and no amount of caching or tuning changes the shape of that trade,
because the trade is in the design and not in the implementation.

There is a third number that makes it vivid. Call the actual event rate on the
board `E`:

```text
  waste ratio  =  (U / T) / E

  10,000 users, T = 3s, 5 events/sec on the board
                       ──▶  3,333 / 5  =  ((667 requests per useful event))
```

**And the shape of that is the real problem.** The cost scales with `U`, the
number of people watching. It does not scale with `E`, the number of things
happening. A board where nothing occurs all day costs exactly as much to serve as
a board changing every second. ==You are paying for the medium and not for the
message.==

**On a phone it is worse than the arithmetic suggests.** A cellular radio is not
a switch. Sending anything moves it from idle into a connected high-power state,
and it stays there through a tail period of several seconds before stepping back
down. A poll every three seconds means ==the tail never expires and the radio
never idles==, so the phone pays continuously for a connection that is mostly
carrying "nothing changed". This is why polling loops show up in battery blame
screens far out of proportion to the bytes they move.

:::do
Before choosing any real-time transport, write down `U`, `T` and `E` for the
feature. If `U / T` is within an order of magnitude of `E`, polling is fine and
you are done. The whole rest of this book is for the case where it is not.
:::

:::key
Polling's cost is `U / T` and its latency is `T / 2`, so their product is `U / 2`
and cannot be improved. ==The goal of every design that follows is to make cost
scale with `E`, the number of events, instead of with `U`.==
:::

## 5. Long polling, and the gap

The first idea anyone has after measuring polling is to keep the shape but remove
the empty answers. The client is allowed to ask. Nothing says the server has to
answer promptly.

%%Long polling%% is exactly that: the client sends a request, and the server
simply does not respond. It holds the request open, sometimes for a minute, and
only writes a response when something actually happens. The client receives it,
processes it, and immediately opens a new request.

```text
  browser                                 server
    ├──── GET /changes ─────────────────▶ │  (held open, no response)
    │                                     │
    │              ... 47 seconds ...     │  task moves
    │◀──── 200 {"event": "task.moved"} ───┤
    │                                     │
    │  parse, render                      │  ← nothing can reach this
    │  open a new request                 │     browser during this gap
    ├──── GET /changes ─────────────────▶ │
```

This works, and it carried real-time features on the web for the better part of a
decade. The cost is now attached to `E` rather than `U`, which was the whole
point. Empty polls are gone.

The problem is __the gap__. Between the server writing the response and the
client's next request arriving, ==there is no channel==. If two events happen in
quick succession, the second one lands while nobody is listening, and the server
has to buffer it or lose it. And the client is not idle in that window: it has to
parse the response, run its handler, re-render, then open a fresh connection,
which means a new request and possibly a new TCP and TLS handshake.

This is written down. RFC 6202 (*Known Issues and Best Practices for the Use of
Long Polling and Streaming in Bidirectional HTTP*) is the document, and it does
not oversell the technique: it puts the average latency at about one network
transit, but ==the worst case at more than three==, because of the round trip
spent re-establishing the channel after every single message.

:::trap
"Long polling is basically WebSockets over HTTP." No. A WebSocket carries an
unbounded number of messages over one connection. Long polling carries ==exactly
one message per connection== and then must rebuild the channel. That difference
is the entire reason the next two designs exist, and it is also why long polling
gets more expensive as events get more frequent, which is precisely backwards.
:::

:::ask If long polling is worse, why does it still appear in production stacks?
Because it needs nothing from the network path. Every proxy, every corporate
middlebox and every CDN understands a slow `GET`, and none of them need to
understand an upgrade or an event stream. It is still the correct fallback tier
in libraries that negotiate a transport, and it is what those libraries drop to
when the environment refuses anything better.
:::

:::key
Long polling fixed the cost model and left the latency model broken. One message
per connection means the channel has to be rebuilt after every message, and the
window while it is being rebuilt is a window where the server cannot reach you.
:::

## 6. The two inversions

Before looking at the designs that work, name precisely what you are buying,
because it is two separate things and interviews reward separating them.

```text
  INVERSION 1                        INVERSION 2
  the server speaks first            you pay per event, not per user

  server writes when it has          cost scales with E
  news, without being asked          instead of with U

  removes: T/2 latency               removes: the waste ratio
  removes: the gap                   removes: the idle-board bill
```

Polling gives you neither. Long polling gives you the second one and half of the
first. ==Server-sent events and WebSockets give you both.== Everything after this
page is about what each of them charges for it.

And the charge is real, which is the part that gets skipped. The moment the
server holds a channel open, three things become true that were not true before:

1. **A connection is now a resource with a lifetime**, and resources with
   lifetimes have limits. Part IV counts them: file descriptors, ports, memory.
2. **A connection is now state**, and it lives in one process on one machine.
   Part V is about the architecture that breaks.
3. **A connection can now be missing**, and something published while it was
   missing is gone unless you designed for it. Part VI is about that.

:::signal
"Both remaining designs give me a server-initiated channel. The difference is
that SSE keeps HTTP and gives me one direction, and WebSocket leaves HTTP and
gives me two. So the question is whether the client needs to send anything on
the same channel, and usually it does not." That is the answer that skips the
technology comparison and goes straight to the decision.
:::

:::key
You are buying two inversions: the server speaks first, and cost scales with
events instead of viewers. Everything from here is the invoice.
:::

:::recall Write both polling formulas from memory, then explain why their product is fixed. | 6
:::

:::recall What exactly is "the gap" in long polling, and what does RFC 6202 say the worst-case latency is? | 5
:::

:::part II | Server-sent events: the response that never ends

One idea, applied once: what if the response never finishes? The client makes an
ordinary GET, the server replies 200, and then simply keeps writing. No new
protocol, no upgrade, no library on the client. This part is what that buys, what
the browser does for you for free, and the three ways the network path between
you and the browser quietly breaks it.
:::

## 7. A 200 that does not close

Long polling failed because a response ends. So do not end it.

%%Server-sent events%%, or SSE, is a normal HTTP GET whose response body never
completes. The server sends status 200 and a `Content-Type` of
`text/event-stream`, and then, every time it has something to say, writes a few
more lines into the body it never closed.

```text
  GET /events HTTP/1.1
  Accept: text/event-stream

  HTTP/1.1 200 OK
  Content-Type: text/event-stream
  Cache-Control: no-cache
  Connection: keep-alive
                                    ← body starts here and does not end
  id: 1841
  event: task.moved
  data: {"task":9,"from":"todo","to":"doing"}
                                    ← blank line terminates one event
  id: 1842
  event: task.created
  data: {"task":10,"title":"Write the migration"}

           ... connection stays open, minutes, hours ...
```

The connection lives as long as the tab does. Close the tab, lose the network,
navigate away, and it ends; while the page is open, ==there is always a channel
from your server into that browser==.

The important property is what SSE is *not*. It is not a different protocol. It
is HTTP, with HTTP headers, an HTTP status code, HTTP authentication, and an HTTP
response body. Every proxy, load balancer, CDN and firewall in the path already
understands it, because from the outside it is indistinguishable from a large
file being downloaded slowly.

That is also why it is far more widely deployed than its reputation suggests.
Uber's push platform, which tells a driver about a trip, was built on SSE.
LinkedIn's instant messaging, including typing indicators and read receipts, was
built on SSE. And ==every large language model API that streams tokens to your
CLI or your browser is streaming `text/event-stream`==: the text appearing one
word at a time is a sequence of `data:` lines.

:::trap
"SSE is the toy version of WebSockets." It is not a subset and it is not a
fallback. It is a different trade: you give up client-to-server messages on the
same channel, and in exchange you keep HTTP end to end, get reconnection and
resumption implemented by the browser, and never negotiate anything. Companies
that could trivially afford WebSockets chose SSE on purpose.
:::

:::key
SSE is one HTTP response that never finishes. Nothing in the network path needs
to know anything new, which is the whole reason to prefer it.
:::

## 8. The wire format: four fields and a blank line

The entire specification of the body format is four field names, a comment
syntax, and a rule about blank lines. It is worth memorising because it takes
sixty seconds and it lets you write a compliant stream by hand.

```text
  field    what it does
  -----    ------------
  data:    the payload. repeat the line for multiline; they join with \n
  event:   the event name. the client listens for it by name.
           omitted means the default name, "message"
  id:      sets the stream position. the client remembers the last one seen
  retry:   milliseconds the client should wait before reconnecting

  :        a line starting with a colon is a comment. ignored.
           this is the standard keepalive.

  a BLANK LINE dispatches the event. without it, nothing fires.
```

Two details cause most first-time bugs.

**The blank line is not cosmetic.** An event is dispatched when the parser sees an
empty line. ++Write `\n\n` after every event, and flush.++ If your framework
buffers the response, the client sees nothing at all, no matter how many lines
you wrote.

**Multiple `data:` lines concatenate.** They are joined with a newline and
delivered as a single string, which is how you send a multi-line payload without
escaping it. Sending JSON on one line is the common practice and is simpler.

The full thing, with a heartbeat:

```text
  retry: 5000

  : heartbeat                       ← a comment, every 15s, keeps proxies awake

  id: 1841
  event: task.moved
  data: {"task":9,"to":"doing"}

  : heartbeat

  id: 1842
  event: presence
  data: {"user":"leo","status":"online"}
```

:::do
Send a `: heartbeat` comment every 15 seconds on every stream. It costs 12 bytes,
it is discarded by the client, and it is the difference between a stream that
survives an idle proxy and one that dies silently every 60 seconds. Section 11 is
why.
:::

:::signal
"SSE has no RFC. It is part of the HTML Living Standard, which is why the browser
implements the client, including reconnection." Knowing that it is a browser
specification rather than a network one explains the whole shape of the next
section.
:::

:::key
Four fields, a comment prefix, and a blank line that dispatches. `id:` is the one
that matters architecturally, because it is what makes the stream resumable.
:::

## 9. Reconnection you did not write

This is the part of SSE that is genuinely free, and the reason it stays in
production at companies with no shortage of engineers.

Because SSE is in the HTML specification, the client is the browser. `EventSource`
handles the reconnect for you: if the connection drops, the browser waits, opens
a new request to the same URL, and carries on. ==You write no reconnection
logic.== You do not write backoff, you do not write a retry loop, you do not
handle the transport error.

More than that, it resumes at the right place:

```text
  server ──▶  id: 1841   data: ...
  server ──▶  id: 1842   data: ...
              connection drops. laptop lid, wifi to LTE, proxy timeout.

  browser ──▶ GET /events
              Last-Event-ID: 1842        ← the browser adds this itself

  server  ──▶ id: 1843   data: ...       ← you resume from 1843
```

Every `id:` you send is remembered by the client. On reconnect the browser sends
it back in a `Last-Event-ID` request header, without being asked to. ==Your
handler reads that header, looks up everything after it, and writes the backlog
before resuming the live stream.== The user sees a board that is correct, not a
board that is missing the ninety seconds they spent in a lift.

The `retry:` field is the other half: the server dictates the reconnect delay, so
you can widen it from your side during an incident without shipping client code.

```js
const es = new EventSource('/events');
es.addEventListener('task.moved', (e) => apply(JSON.parse(e.data)));
// there is no reconnect handler here because there does not need to be
```

Hold on to the shape of this, because ==section 32 rebuilds it by hand for
WebSockets==, where nothing is free.

:::ask What happens to events published while the client was disconnected?
Nothing, unless you built the backlog. `Last-Event-ID` gives you the client's
position; it does not give you the events. You still need somewhere to read
"everything after 1842" from, which means a durable, ordered log per topic with
a retention window. The browser hands you the question. Answering it is your
design problem, and it is the same problem in section 32.
:::

:::key
The browser implements reconnection and hands you the client's last position in
a header. ==The resume protocol is free; the backlog it resumes from is not.==
:::

## 10. Why nobody streams an LLM with EventSource

A precise correction, because it comes up the moment someone connects "LLM APIs
use SSE" with "SSE means `EventSource`".

The wire format is SSE. The client is almost never `EventSource`, and cannot be,
for two reasons:

```text
  EventSource                          what an LLM call needs
  -----------                          ----------------------
  GET only, no request body            POST with a prompt body
  cannot set request headers           Authorization: Bearer sk-...
```

`EventSource` issues a GET and gives you no way to attach headers. An LLM request
is a POST carrying messages, tools and parameters, authenticated with a bearer
token. ==Neither of those fits through `EventSource`, so clients use `fetch` and
parse the `text/event-stream` body themselves.==

```js
const res = await fetch('/v1/messages', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${key}`, 'Accept': 'text/event-stream' },
  body: JSON.stringify({ messages, stream: true }),
});
const reader = res.body.getReader();     // parse `data:` lines by hand
```

This matters beyond trivia, because it is ==the same limitation you will hit
authenticating your own stream==. A browser cannot put an `Authorization` header
on an `EventSource`, and it cannot put one on a WebSocket either. Section 37 is
the full treatment; the short version is cookie, query-string ticket, or a token
in the first message.

The trade is explicit. Hand-parsing costs you the free reconnection from section
9, because that lived in `EventSource`, not in the format. !!Choosing `fetch` for
the headers means writing your own backoff and your own `Last-Event-ID`
bookkeeping.!!

:::trap
"SSE requires `EventSource`." SSE is a body format. `EventSource` is one client
for it, and it is the only one that gets browser-implemented reconnection. Every
LLM SDK you have used parses the same format with no `EventSource` anywhere.
:::

:::key
SSE the format and `EventSource` the API are separate things. You choose between
free reconnection and control over the request, and you cannot have both.
:::

## 11. The proxy that eats your stream

Here is the failure that every team meets once, always in staging or production
and never on localhost: the stream works perfectly on your laptop and delivers
nothing behind the load balancer.

There are two causes and they are both defaults.

**Buffering.** A reverse proxy is built to read a response and forward it
efficiently, which for a normal response means accumulating it. Nginx has
`proxy_buffering on` by default. Your server writes `data: ...` and flushes; the
proxy holds it, waiting for more, and the browser receives nothing. The stream is
not broken. ==It is being helpfully collected on your behalf, forever.==

```text
  your app  ──▶  writes + flushes  ──▶  NGINX BUFFER  ──▶  ...nothing...
                                        (waiting for a full buffer
                                         or the end of a response
                                         that will never come)
```

**Idle timeouts.** Every hop has one, and they are shorter than you expect.

| Hop | Default idle timeout |
|---|---|
| AWS Application Load Balancer | 60 seconds |
| Nginx `proxy_read_timeout` | 60 seconds |
| Many corporate proxies | 30 to 120 seconds |

If nothing crosses the connection for that long, the hop closes it. A quiet board
at 3am produces no events for ten minutes, so ==the connection is killed for being
idle, not for being broken==, and every client in your system reconnects.

Both fixes are one line each:

```text
  proxy_buffering off;                  # nginx, per location
  proxy_read_timeout 3600s;             # or longer than your heartbeat interval

  X-Accel-Buffering: no                 # response header; nginx honours it
                                        # per response, so your app can ask
```

:::do
Set the response header `X-Accel-Buffering: no` from the application rather than
relying on proxy configuration you may not own, ++and send a heartbeat comment on
an interval shorter than the shortest idle timeout in the path++. Fifteen seconds
clears a 30-second timeout with room to spare. This is the same reasoning that
produces WebSocket ping intervals in section 18.
:::

:::ask The stream works locally and delivers nothing in staging. Where do you look?
Buffering first, then timeouts. Curl the endpoint directly against the app,
bypassing the proxy: if events arrive there and not through the proxy, it is
buffering. If both work but the connection dies at a suspiciously round number of
seconds, it is an idle timeout, and the round number tells you which hop. ==A
stream that dies at exactly 60 seconds is a configuration value, not a bug.==
:::

:::key
Streaming responses break on middleboxes that were designed for responses that
end. Turn buffering off and heartbeat more often than the shortest idle timeout,
or the network will close your connection for you.
:::

## 12. Six connections per origin

The last SSE-specific limitation, and the one that produces the strangest bug
report: "the app works, but not in my seventh tab".

Under HTTP/1.1, browsers cap concurrent connections to a single origin at
==roughly six==. An `EventSource` holds one of those open for the entire life of
the tab. Six tabs, six streams, and the pool is exhausted: the seventh tab's
stream never connects, and worse, ==ordinary API requests from every tab now
queue behind the streams==, because they are competing for the same six slots.

```text
  HTTP/1.1, one origin

  tab 1  ══ SSE ══════════════════════  slot 1 held
  tab 2  ══ SSE ══════════════════════  slot 2 held
  tab 3  ══ SSE ══════════════════════  slot 3 held
  tab 4  ══ SSE ══════════════════════  slot 4 held
  tab 5  ══ SSE ══════════════════════  slot 5 held
  tab 6  ══ SSE ══════════════════════  slot 6 held
  tab 7  ── SSE ...                     no slot. hangs.
  any    ── GET /api/tasks ...          no slot. hangs.
```

**HTTP/2 removes this**, and it is the reason the limitation is less famous than
it should be. HTTP/2 multiplexes many streams over a single TCP connection, with
a concurrency limit typically around 100 rather than 6, so the browser's
per-origin connection cap stops applying. ++If you serve SSE over HTTP/2, and any
modern TLS deployment does, this problem is mostly gone.++

Mostly, not entirely. It is still worth knowing because it is exactly the class
of bug that only reproduces on the one deployment that terminates HTTP/1.1
internally, and because a WebSocket ==is not subject to the cap at all==, which
is one genuine point in its favour.

:::trap
"Six connections is why we chose WebSockets." Check the protocol first. If you
are on HTTP/2 the cap is not six, and a design decision made on this basis alone
was made against a constraint you do not have.
:::

:::key
An `EventSource` holds a connection for the tab's lifetime, and under HTTP/1.1
you get about six per origin. HTTP/2 multiplexing dissolves it. WebSockets never
had it.
:::

## 13. What SSE cannot do

The limitation is in the name. ==Server-sent events.== One direction.

The server can write all day. The client cannot write anything back on that
channel. When Aas drags a task, that goes to the server as a separate `POST` on a
separate connection, and there is no way to send it through the stream.

```text
                 SSE                                WEBSOCKET

  client ──── GET /events ────▶ server     client ◀══════════════▶ server
  client ◀════ event ══════════ server              one connection
  client ◀════ event ══════════ server              both directions
  client ◀════ event ══════════ server

  client ──── POST /tasks/9 ───▶ server     ← a second, ordinary
                                              request. this is fine.
```

**For most products this is completely fine**, and saying so is the mature
position. The write path and the read path are asymmetric in almost every
application: writes are infrequent, individually meaningful, need their own
authorisation and validation, and benefit from being ordinary HTTP requests you
can log, rate-limit, retry and cache-bust like everything else. ++Splitting reads
onto a stream and writes onto normal POSTs is a legitimate architecture, not a
compromise.++

You need the second direction when:

| You need two-way when | Why |
|---|---|
| Messages are frequent and small | Per-message HTTP overhead dominates. Cursor positions, keystrokes, game input |
| Latency on the write path matters | A new request means a round trip you already paid for |
| The client must send while offline-ish | The socket's liveness *is* the signal |
| The protocol is conversational | Request and response are interleaved, not independent |

Live cursors in a document are the clean example: thirty small messages a second
per user, each one meaningless on its own. Thirty POSTs a second per user is
absurd. Thirty WebSocket frames a second, at six bytes of framing each, is
nothing.

Our board feature does not obviously need it. But the requirement was to
understand the ceiling, so the next part is what happens when you leave HTTP
behind entirely.

:::signal
"I would default to SSE and reach for WebSockets when the client needs to send on
the same channel at a rate that makes separate requests silly." That is a
decision rule, and it lands better than a feature comparison.
:::

:::key
SSE is one-way. Client writes go over ordinary POSTs, which is fine until the
write rate makes per-request overhead the dominant cost.
:::

:::recall Write a valid two-event SSE body from memory, including a heartbeat and the field that makes it resumable. | 8
:::

:::recall Name the two ways a proxy silently breaks a stream, and the fix for each. | 6
:::

:::part III | WebSocket: leaving HTTP behind

A WebSocket starts as an HTTP request and then stops being HTTP entirely. This
part is what that means at the byte level, because the details are not trivia:
the framing explains the cost model, the masking explains a real attack, and the
heartbeat explains why your connection count is wrong.
:::

## 14. The handshake, byte by byte

The cleverest decision in RFC 6455 is that a WebSocket connection ==begins as an
ordinary HTTP GET==. Not something HTTP-like. A real GET, with a real request
line and real headers, on port 80 or 443.

That single choice is why WebSockets deploy anywhere. Every router, proxy,
firewall, corporate middlebox and cloud load balancer in the world already speaks
HTTP, and the connection is established through all of them before anything
unusual happens.

```text
  CLIENT                                              SERVER

  GET /echo HTTP/1.1
  Host: api.example.com
  Upgrade: websocket                  ← "I want to change protocol"
  Connection: Upgrade
  Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
  Sec-WebSocket-Version: 13
                          ─────────────────────▶

                          ◀─────────────────────
  HTTP/1.1 101 Switching Protocols    ← not 200. the connection survives
  Upgrade: websocket                     but the protocol does not
  Connection: Upgrade
  Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

`Sec-WebSocket-Key` is ==16 random bytes, base64 encoded==, freshly generated per
connection. The server computes the reply by a fixed recipe:

```text
  accept = base64( SHA1( key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11" ) )
                          ─────────────────────────────────────────
                          a constant, written in the RFC, identical
                          for every WebSocket connection ever made
```

Those exact values are the RFC's own worked example, and you can reproduce them
with three lines of Python.

:::trap
!!"`Sec-WebSocket-Key` is a security mechanism."!! It is not, and the RFC says so.
The constant is public and anyone can compute the answer. Its only job is to
prove that ==the thing replying understood that you asked for a WebSocket==, and
is not a cache replaying an old 200 for that URL, or a proxy that skimmed the
headers and improvised. It defends against confusion, not against an attacker.
:::

:::term Handshake
The exchange that establishes a connection's parameters before data flows. The
WebSocket handshake is unusual in being an HTTP request whose successful reply
ends HTTP for that connection.
:::

:::key
A WebSocket is an HTTP GET that is answered with ==101 Switching Protocols==
instead of 200. The key exchange proves comprehension, not identity, and the
whole design exists so the connection can be established through infrastructure
that has never heard of WebSockets.
:::

## 15. What 101 actually changed

After the 101, the TCP connection stays open and ==everything you know about HTTP
stops applying==. This is the sentence to be able to say, because most of the
architectural consequences in Parts IV and V fall straight out of it.

```text
  before the 101                    after the 101
  --------------                    -------------
  methods: GET, POST, ...           gone. there are no methods
  status codes                      gone. there are close codes instead
  headers per message               gone. two bytes of framing
  request / response pairing        gone. either side writes any time
  stateless: any instance serves    the connection lives in one process
  caching, CDNs, retries            meaningless on a stream
  cookies sent per request          sent once, at the handshake, and never again
```

The last two lines are the expensive ones.

**Everything HTTP-shaped in your stack stops working.** Your CDN cannot cache a
stream. Your API gateway's per-route rate limiting sees one request, not ten
thousand messages. Your access logs record one line at connect time and nothing
after. ==Your observability goes blind at exactly the moment your traffic moves
onto the socket==, and you have to rebuild it: messages per connection, bytes per
connection, frames by opcode, connection lifetime.

**Authentication happens once.** The cookie or token was validated during the
handshake. The connection then lives for hours. ==A token that expires in fifteen
minutes does not close a socket that opened fourteen minutes ago==, and a user
whose access you revoked keeps receiving events until something closes the
connection. Section 37 is the fix.

:::signal
"After the upgrade I have a raw bidirectional stream, so I lose caching, per-request
auth, per-route rate limits and request logging. I plan for rebuilding those as
part of adopting WebSockets, not after." Naming the collateral damage before you
are asked is the difference between having used WebSockets and having operated
them.
:::

:::key
101 does not add a feature to HTTP. It ==ends HTTP on that connection== and leaves
you a TCP stream with framing. Everything HTTP was doing for you is now yours to
rebuild.
:::

## 16. The frame

Messages on a WebSocket are carried in %%frames%%, and the frame header is a bit
diagram worth being able to draw. It explains the cost model in one picture.

```text
   0               1               2               3
   0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
  +-+-+-+-+-------+-+-------------+-------------------------------+
  |F|R|R|R|opcode |M| payload len | extended payload length       |
  |I|S|S|S| (4)   |A|     (7)     |    (16 or 64 bits, if needed) |
  |N|1|2|3|       |S|             |                               |
  +-+-+-+-+-------+-+-------------+-------------------------------+
  |          masking key (4 bytes, only if MASK is set)           |
  +---------------------------------------------------------------+
  |                        payload data                           |
  +---------------------------------------------------------------+

  FIN     1 = last frame of this message. 0 = more coming
  RSV1-3  reserved. RSV1 is used by the compression extension (section 26)
  MASK    1 = payload is masked, and the 4-byte key follows
```

The opcodes:

| Opcode | Meaning |
|---|---|
| `0x0` | Continuation of the previous message |
| `0x1` | Text (UTF-8) |
| `0x2` | Binary |
| `0x8` | Close |
| `0x9` | Ping |
| `0xA` | Pong |

**The length encoding is where the efficiency lives.** Seven bits hold the length
directly for anything under 126 bytes. Write 126 and the real length follows in
two more bytes; write 127 and it follows in eight.

```text
  payload      header cost
  -------      -----------
  < 126 B      2 bytes    (+ 4 for the mask, from a browser)
  < 64 KB      4 bytes    (+ 4)
  larger       10 bytes   (+ 4)
```

Put that beside polling. A poll is a full HTTP request and response: request
line, host, user agent, accept, and cookies, which are usually the largest part,
then response headers on the way back. Call it ==around 1 KB of overhead per
exchange==, being generous. A small WebSocket message from a browser costs ==6
bytes of framing==.

```text
  per message overhead
  --------------------
  HTTP poll        ~1,000 bytes      ← two orders of magnitude
  WebSocket frame        6 bytes
```

That factor is why cursor positions and keystrokes are viable on a socket and
absurd over HTTP, and it is the concrete form of "cost scales with events".

:::ask Why are there separate text and binary opcodes if both carry bytes?
Because text frames are required to be valid UTF-8 and a conforming endpoint must
fail the connection if they are not. That validation is not free at high message
rates, and it is why protocols carrying binary payloads use `0x2` rather than
base64 inside `0x1`, which would also inflate the payload by a third.
:::

:::key
Two bytes of framing for a small message, against roughly a kilobyte of HTTP
headers. ==The frame header is the cost model==, and it is why the message rates
that break polling are unremarkable on a socket.
:::

## 17. Masking, and the proxy it was designed to protect

Every frame a browser sends is %%masked%%: each byte of the payload is XORed with
one byte of a four-byte key that cycles, and ==the key is sent in cleartext, in
the frame, immediately before the payload==.

```text
  masked_byte[i]  =  payload_byte[i]  XOR  key[i % 4]

  frame:  [header][ 4-byte key ][ masked payload ]
                    ─────────── sent in the clear.
                    anyone on the path can unmask it in one line.
```

This looks like broken encryption and is not encryption at all. The obvious
question is why it exists.

**It exists because someone poisoned a cache with it.** While the protocol was
being specified, researchers ran the attack against real caching proxies deployed
on the internet, and it worked.

```text
  1. victim loads attacker's page
  2. page opens a connection to a server the attacker controls
  3. it sends something that LOOKS like an HTTP upgrade to the proxy
     in the middle, which does not implement WebSockets
  4. then it writes bytes chosen to look exactly like:

         GET /analytics.js HTTP/1.1
         Host: cdn.popular-site.com

  5. the proxy, seeing a request and a response, caches the attacker's
     content under a URL thousands of sites load
  6. everyone behind that proxy gets the attacker's file
```

The attack needs one thing: ==the attacker must control the exact bytes that
appear on the wire==. Masking removes that. The key is fresh, random, and
generated by the browser per frame, so the page's JavaScript cannot predict it.
The attacker still chooses the payload, but ((cannot choose the resulting bytes))
after the XOR, and cannot forge a request line by accident either.

This is why the RFC insists the key be from a strong source and ==fresh for every
frame==. A predictable key restores the attack.

:::trap
!!"Masking protects the data from eavesdroppers, so `ws://` is safe enough."!!
Masking protects the *network path* from being tricked, not your data from being
read. The key is right there in the frame. ++Use `wss://` always.++ Masking and
TLS solve unrelated problems.
:::

:::ask Why do servers not mask their frames?
Because the attack only works in one direction. The threat was a browser being
used as a confused deputy to write attacker-chosen bytes into an intermediary
that misreads them as an HTTP exchange. A server writing to a client has no
equivalent leverage, so the RFC requires masking from client to server and
forbids it from server to client. A server that masks its frames is failing the
protocol, and a client that does not mask must be rejected.
:::

:::key
Masking is not for confidentiality. It stops a page choosing the literal bytes on
the wire, which is what made ==cache poisoning through a confused proxy== work.
Fresh random key, every frame, client to server only.
:::

## 18. Ping, pong, and the connection that is already dead

Opcodes `0x9` and `0xA` are ping and pong. Either side may send a ping; the other
must answer with a pong. That is the whole mechanism, and the reason it exists is
the most useful piece of TCP knowledge in this book.

**An idle TCP connection and a dead TCP connection are indistinguishable.**

Nothing arrives when a connection dies. There is no error, no RST, no close
frame, no event of any kind. A user walks into a lift, a phone hands off from
wifi to LTE, a NAT table entry expires on a router you have never heard of: in
every case ==the peer simply stops existing, and your socket does not notice==.

```text
  the server's view of a healthy idle connection
  ┌──────────────────────────────────────────┐
  │  socket open. no bytes for 40 minutes.   │
  └──────────────────────────────────────────┘

  the server's view of a connection whose client died 40 minutes ago
  ┌──────────────────────────────────────────┐
  │  socket open. no bytes for 40 minutes.   │
  └──────────────────────────────────────────┘

                    identical.
```

So your process holds the socket, the file descriptor, the goroutine or task, the
buffers and the subscription, believing someone is there. It can hold them for
hours. ==Your connection count, your presence list and your memory graph are all
lying to you at the same time.==

The only way to distinguish the two is to send something and require an answer.

```text
  server ──── ping (0x9) ────▶ client
  server ◀─── pong (0xA) ───── client        alive. reset the timer.

  server ──── ping (0x9) ────▶ client
                    ... 30 seconds, nothing ...
  server: close the connection, free everything, publish a leave event
```

++The common production setting is a ping every 20 to 30 seconds and a dead
verdict after roughly 30 seconds with no pong.++ That interval is not arbitrary:
it has to be shorter than the shortest idle timeout in the path, which section 11
put at 60 seconds for an AWS ALB and for nginx by default. ==The heartbeat is
doing two jobs at once: detecting death, and proving liveness to every middlebox
between you and the user.==

:::trap
!!"TCP keepalive already does this."!! It does, on a default timer of ==two
hours== on Linux, which is useless for this. It is also kernel-level, so it tells
you nothing about whether the application on the other side is still processing:
a peer whose event loop is wedged will still have its kernel answer keepalives.
Application-level ping and pong is testing the thing you actually care about.
:::

:::do
Track `lastPongAt` per connection and sweep. Do not trust a socket because it is
open; trust it because it answered recently. Every number you report about
connections should be derived from that timestamp.
:::

:::key
Idle and dead look identical to a socket, so ==liveness must be measured, not
assumed==. Ping on an interval shorter than the shortest idle timeout in the
path, and close on a missing pong.
:::

## 19. Close codes, and the one you cannot send

A clean shutdown is a close frame, opcode `0x8`, carrying a two-byte code and an
optional reason. Both sides send one and then the TCP connection closes.

| Code | Meaning | Who sends it |
|---|---|---|
| 1000 | Normal closure | Either side, deliberately |
| 1001 | Going away: page navigating, server shutting down | Either |
| 1006 | ==Abnormal closure. No close frame was received== | ++Nobody. Set locally++ |
| 1008 | Policy violation | Server |
| 1009 | Message too big | Either |
| 1011 | Unexpected internal error | Server |
| 4000+ | Yours. Application-defined | Whatever you decide |

**1006 is the one to understand**, because it is the code you will see most and
the one that is most misread. ==It is never sent on the wire.== It cannot be: it
means "the connection vanished without a close frame", so by definition there was
no frame to carry it. Your library sets it locally to tell you that the
connection ended without a goodbye.

```text
  1000 in your logs   ──▶  someone closed this on purpose
  1006 in your logs   ──▶  the network ate it. lift, wifi handoff,
                           crash, timeout, proxy reset, laptop lid
```

So ==a wall of 1006 is not an application bug, it is a network story==, and
chasing it in your handler code is wasted time. What it should trigger is the
reconnect path, and a look at whether an idle timeout is doing it on a schedule.

++Use the 4000 to 4999 range for application meanings++, because it is reserved
for exactly that. `4001 token expired` and `4002 rebalancing, reconnect`
(section 36) let the client respond intelligently instead of blindly retrying.

:::ask A client sees 1006 constantly. Where do you start?
Look at the timing distribution before the code. If closures cluster at a round
number of seconds after connect, it is an idle timeout and the number names the
hop: 60 seconds says ALB or nginx defaults. If they are spread out and correlate
with mobile clients, it is normal network churn and the answer is a good
reconnect path, not a fix. If they spike at deploys, it is section 36.
:::

:::key
1006 is set by your own library, never received, and means the connection died
without a close frame. Reserve 4000 and above for reasons the client can act on.
:::

## 20. Choosing: polling, long polling, SSE, WebSocket

Four designs, one table. This is the page to have in your head when someone says
"how would you do real time".

| | Polling | Long polling | SSE | WebSocket |
|---|---|---|---|---|
| Direction | Client asks | Client asks | ==Server to client== | ==Both== |
| Protocol | HTTP | HTTP | HTTP | HTTP, then not |
| Messages per connection | One | One | Unlimited | Unlimited |
| Latency | `T/2` average | One transit, three worst | One transit | One transit |
| Cost scales with | !!Users!! | Events | Events | Events |
| Per-message overhead | ~1 KB | ~1 KB | ~20 bytes | ==6 bytes== |
| Reconnect logic | None needed | Yours | ++Browser's++ | Yours |
| Resume protocol | Trivial | Yours | ++`Last-Event-ID`++ | Yours |
| Survives odd proxies | Always | Always | Usually | Usually |
| Load balancer | Anything | Anything | Anything | Needs upgrade support |
| Auth header from browser | Yes | Yes | !!No!! | !!No!! |
| HTTP/1.1 origin cap | No | No | ==Yes, ~6== | No |

Read down the columns and a decision procedure falls out:

```text
  is U/T within an order of magnitude of E ?
        YES ──▶ POLL. you are done. do not build a socket.
        NO
         │
  does the client need to send on the same channel,
  at a rate that makes separate POSTs silly ?
        NO  ──▶ SSE. free reconnect, free resume, plain HTTP.
        YES ──▶ WEBSOCKET. and read Parts IV to VII, because
                you have just made your backend stateful.
```

:::signal
"I would start with SSE, because the reconnection and resumption are already
written and the transport is ordinary HTTP, and move to WebSockets when the
client needs to push at a rate where a POST per message stops making sense."
==Defaulting to the smaller tool and naming the trigger for the larger one== is
the answer that reads as experience.
:::

:::key
The order of the questions is the answer: event rate against user count first,
then direction. ==Technology last.==
:::

:::recall Draw the WebSocket frame header from memory, with the six opcodes. | 8
:::

:::recall Why does masking exist, why is the key in cleartext, and why do servers not mask? | 7
:::

:::recall Give the four-way comparison table's rows for direction, cost scaling and reconnect logic. | 6
:::

:::part IV | How many connections fit on one machine

You now hold connections instead of serving requests, so capacity means something
new. This part walks a real machine into three separate ceilings, in the order it
hits them, and then into two more that a benchmark of idle connections will never
find. ==Every ceiling here is calculable before you meet it==, which is the whole
reason to know them.
:::

## 21. Ceiling 1: file descriptors

The machine: 16 cores, 61 GB free. The server: a few lines of Go that accept
connections and hold them, ==with no application logic at all==, because the
question is how many sockets fit, not how fast the app is.

In Unix, everything is a file. A network socket is a file, and to touch it you
need a %%file descriptor%%: a small integer indexing the kernel's table of open
files for your process. So the number of connections you can hold is, exactly,
the number of files you can have open.

```text
  $ ulimit -n
  1024

  $ ./server &      then open 2,000 connections at it

  connections established: 1,017        ← stops here, dead on
```

Not 1,024. ==Seventeen fewer than the round number, and the difference is
enumerable==:

```text
  fd 0, 1, 2    stdin, stdout, stderr
  fd 3          the listening socket
  fd 4          the epoll instance the runtime uses to watch them all
  fd 5, 6       runtime internals
  --------------------------------------
  7 descriptors of overhead, then 1,017 connections
```

**What the two sides see is completely different**, and this is the part worth
carrying:

| The client sees | The server sees |
|---|---|
| No connection refused | `accept: too many open files` |
| No error at all | Repeated, with backoff |
| A timeout, waiting for a handshake | ==Healthy. Health checks passing.== |

==The server is up, answering `/healthz`, reporting no errors to your uptime
monitor, and refusing every new connection.== A liveness probe that checks
"process responds to HTTP" says everything is fine. This is the specific reason
!!a health check must exercise the thing that is scarce!!, not merely prove the
process exists.

:::do
Export the ratio, not the count. `open_fds / rlimit_nofile` as a gauge, alerting
at 80%. A raw connection count tells you nothing without the ceiling it is
approaching, and the ceiling differs per deployment.
:::

:::key
Every connection is a file descriptor, so ==your connection ceiling is your
descriptor limit minus about seven==. At the ceiling the server stays healthy and
silently stops accepting, which is why this failure survives so long in
production.
:::

## 22. The thousand-descriptor limit is language-dependent

Same shell, same machine, same moment. Ask two runtimes what their limit is:

```text
  $ ulimit -n
  1024

  Go program:      1,048,575         ← ?
  Python program:      1,024
```

The Go runtime ==raises its own soft limit at startup==. `ulimit -n` reports the
*soft* limit, which is an advisory ceiling a process may lift up to the *hard*
limit on its own, without privileges. Go does exactly that.

The reason is in Go's own standard library comment: some systems set an
artificially low soft limit for compatibility with code using `select()`, which
has a hard-coded maximum descriptor number because of the fixed size of `fd_set`.
++Go does not use `select`, so the runtime raises the limit for itself and leaves
the old software alone.++

And the number is not the hard limit, it is ==the hard limit minus one==:
1,048,576 minus 1. That is deliberate, so the runtime can later detect somebody
else changing the limit underneath it.

```text
  soft limit    what ulimit -n shows. advisory. raiseable by the process
  hard limit    the real ceiling. only root can raise it
```

So the folklore, "you will hit the thousand-descriptor problem", is true and
==incomplete==. In Node, Python or Java you meet it at 1,024 unless you raise the
limit yourself. In Go you do not meet it at all.

:::trap
!!"We set `ulimit -n` in our shell, so the service has a high limit."!! Your shell
is not your service's parent in production. Under systemd the value that applies
is `LimitNOFILE` in the unit file; in a container it is the runtime's default and
whatever the orchestrator sets. ++Read the limit from inside the running process
and export it as a metric++, because it is the only value that is definitely
true.
:::

:::ask Why not just set the limit to a million everywhere?
Because the descriptor limit is the only thing standing between a leak and the
machine. It is a circuit breaker, not an obstacle. Raise it deliberately to a
number you have sized against your memory budget from section 24, and alert on
approaching it. A million descriptors on a box that runs out of memory at 200,000
connections has converted a clean, immediate `too many open files` into an OOM
kill that takes every connection with it.
:::

:::key
The soft limit is advisory and Go raises it to hard-minus-one at startup. ==The
descriptor ceiling is a property of your runtime and your unit file, not of the
machine==, and you should read it from inside the process.
:::

## 23. Ceiling 2: the client's ports, not the server's

Descriptors lifted to a million, run the load again. It stops at ==28,190==, with
an entirely different error: `cannot assign requested address`.

Ask the kernel which ports it may use for outgoing connections:

```text
  $ sysctl net.ipv4.ip_local_port_range
  32768    60999

  60999 - 32768 + 1  =  28,232 ports available
  28,232 - 28,190    =  42     ← in use by other things on this shared box
```

The number was calculable before the error appeared. ==This is not a memory
limit, a descriptor limit or a server limit. It is the load generator running out
of source ports.==

**And this is where the most common myth in the subject lives.** People say a
server can hold only 65,000 connections because there are only 65,535 ports. That
is false. A TCP connection is not identified by a port. It is identified by a
==four-tuple==, and only the tuple must be unique:

```text
  ( source IP , source port , destination IP , destination port )

  our server:   one IP, one port     ← fixed for every connection
  our client:   one IP               ← fixed
  therefore:    only SOURCE PORT can vary
                and there are 28,232 of those
```

Change the client's IP and the tuple has a second free field. Give the load
generator three addresses and ask for 25,000 on each:

```text
  3 addresses × 25,000  =  75,000 connections,  zero failures
  server file descriptors in use: 75,009
```

==The fix was on the client, and no larger server would have helped.== This is
also why load testing a connection-heavy service needs several machines: one box
cannot generate the load, and if you conclude "the server tops out at 28,000" you
have measured your test rig.

:::signal
"Twenty-eight thousand is the ephemeral port range, so that is my load generator,
not my server. A server is limited by the four-tuple, and its address and port
are fixed, so it scales with distinct clients, not with ports." That sentence
kills the 65,000-connection myth and shows where you would look next.
:::

:::do
On the client side of a load test: widen `ip_local_port_range`, add source
addresses, and reuse connections. On the server side: if you are the one dialling
out, to a database or a cache or a pub/sub node, ++you are the client and this
ceiling is yours++. Connection pools exist partly for this.
:::

:::key
==A connection is a four-tuple, not a port.== The 28,000 wall is the client's
ephemeral range, it is calculable in advance from `ip_local_port_range`, and it is
fixed by adding client addresses.
:::

## 24. Ceiling 3: memory, and where 10 KB goes

With descriptors and ports out of the way, the last ceiling is the real one.

```text
  server at rest, 0 connections            7.5 MB
  server holding 75,000 connections      722   MB
  ------------------------------------------------
  difference / 75,000        ≈  9.5 to 10 KB per connection

  measured three times:  9,751   9,752   9,881 bytes
```

++Measure three times and take the shape, not the digit.++ Round it to ==10 KB
per connection== and the arithmetic becomes something you can do in an interview:

```text
    100,000 connections  ──▶  ~1 GB
  1,000,000 connections  ──▶  ~10 GB of heap
```

On a 61 GB box, ==a million idle connections is comfortably a memory question and
nothing more==. That is the headline, and it is genuinely surprising the first
time.

Two qualifications the number needs.

**It is process heap, not total cost.** The kernel keeps its own structures per
socket: the socket itself, and the send and receive buffers, which do not appear
in your process's resident memory at all. The real per-connection cost to the
machine is higher than what your runtime reports.

**Almost none of the 10 KB is the socket.** The lecture says most of it is the
goroutine and the buffers, and does not break it down. Here is arithmetic that
fits, using the common Go WebSocket defaults:

| Component | Bytes |
|---|---|
| Read buffer | 4,096 |
| Write buffer | 4,096 |
| Goroutine stack, initial | 2,048 |
| Bookkeeping, subscription, map entry | a few hundred |
| **Total** | **~10 KB** |

Which tells you exactly where to push. ==Two 4 KB buffers per connection are 80%
of the bill==, and buffers only need to exist while a message is being handled.
The fixes follow directly:

```text
  1. shrink the buffers          most frames are under 126 bytes
  2. pool them                   allocate on use, return to a sync.Pool
  3. drop goroutine-per-conn     watch every socket from one place with
                                 epoll, and spend a goroutine only when
                                 a socket is actually readable
```

That third one is why teams chasing very large numbers abandon the
goroutine-per-connection model. It is the most natural code to write and the
first thing to go at a million connections.

:::ask You said 10 KB. Why do people report 30 KB or 100 KB in production?
Because a real connection is not the benchmark's connection. This server had no
application logic. Add TLS session state, a per-connection outbound queue, the
compression context from section 26, a JSON decoder, and whatever your
application hangs off a session, and the figure moves by an order of magnitude.
==10 KB is a floor established by an empty program==, not a budget. Measure your
own with a heap profile at a realistic connection count.
:::

:::key
About 10 KB of heap per idle connection, so a million is ~10 GB and RAM is the
last ceiling. ==Most of it is buffers, not the socket==, which is why pooling and
an epoll loop are the levers.
:::

## 25. The ceiling the benchmark did not measure

Everything in this part measured ==idle== connections. Production connections are
not idle, and the thing that actually takes real-time servers down is not the
count. It is one client that reads slowly.

**The mechanism.** You write a frame. It goes into the kernel's send buffer. If
the peer is not reading, the buffer fills, TCP flow control closes the window, and
your write blocks or returns "would block". Now you have a decision, and the
default in most code is the wrong one: ==queue it in application memory and carry
on==.

```text
  fast client                      slow client on hotel wifi
  -----------                      -------------------------
  write ──▶ kernel ──▶ gone        write ──▶ kernel buffer FULL
  queue depth: 0                            ──▶ your queue: 1
                                            ──▶ your queue: 400
                                            ──▶ your queue: 90,000
                                                 ↑
                                    unbounded growth, one client,
                                    and the OOM killer takes all
                                    75,000 connections with it
```

%%Backpressure%% is the name for handling this deliberately. The only safe
per-connection outbound queue is a bounded one, and bounded means you must decide
what happens on overflow. There are exactly three useful answers:

| Policy | Do this when |
|---|---|
| **Drop oldest** | Messages are state updates; the newest is the truth |
| **Coalesce** | You can collapse N updates into one current-state frame. ++Best for a board++ |
| **Close the connection** | Correctness needs every message. Let the client reconnect and use the catch-up path of section 32 |

Closing looks brutal and is usually right. ==A client that cannot keep up is
already not seeing the truth==, and the resume protocol is the mechanism you
built for exactly this. Holding 90,000 frames for it is choosing to risk the
whole process for one user who has already fallen behind.

:::signal
"My per-connection send queue is bounded, and on overflow I close with a
4000-range code and let the client resync from its last sequence number." That
one sentence covers backpressure, close codes and the catch-up protocol, and it
is the answer that says you have run one of these.
:::

:::trap
!!"We have plenty of RAM, so a big buffer is fine."!! Buffer size sets how long
you tolerate a slow reader, not whether you tolerate one. Any unbounded queue is
an out-of-memory kill with a delay in front of it, and the delay is proportional
to how much memory you have to lose.
:::

:::key
Idle connections cost RAM; ==slow ones cost you the process==. Bound every
outbound queue and choose an overflow policy on purpose, because the default
policy is unbounded growth.
:::

## 26. Compression, and the budget it destroys

One extension deserves its own page, because it silently invalidates the
arithmetic of section 24.

`permessage-deflate` is the WebSocket compression extension, negotiated at the
handshake and signalled per message by the RSV1 bit from section 16. It is
attractive: JSON compresses well, often by 70% or more, and enabling it is one
option in most libraries.

The cost is that ==deflate is stateful==. A sliding-window context is allocated
per connection, per direction, and at the default window size that is on the order
of ==hundreds of kilobytes per connection==.

```text
  per-connection memory

  no compression       ~10 KB          1M conns ──▶  ~10 GB
  permessage-deflate,  ~300 KB         1M conns ──▶  ~300 GB
  default windows                                    ↑
                                       not a tuning problem. a
                                       different machine order.
```

++Enable it with an explicitly reduced window size, or enable it only for
connections whose message profile justifies it, or leave it off.++ Most real-time
messages are small state deltas where the framing is already six bytes and
compression saves little while costing a great deal.

:::do
If you enable `permessage-deflate`, set the window bits down explicitly, disable
context takeover unless you have measured that you need it, and ++re-measure heap
per connection afterwards++. Never carry a memory estimate across a compression
decision.
:::

:::key
Compression trades a large, stateful, per-connection allocation for bandwidth.
==At a million connections that trade is usually wrong==, and it is the most
common reason a measured memory budget turns out to be off by an order of
magnitude.
:::

:::recall Name the three ceilings in the order a machine hits them, and the error message for each. | 8
:::

:::recall Why is 65,000 connections per server a myth? Give the four-tuple argument. | 6
:::

:::recall Decompose the 10 KB per connection, then give three ways to reduce it. | 7
:::

:::part V | The connection is state

You spent the whole playlist making the backend stateless so that any instance
could serve any request. A persistent connection is state. It lives in one
process, on one machine, and it cannot be moved or shared. This part is the
contradiction and the architecture that resolves it.
:::

## 27. What you just broke

Two instances behind a load balancer. Browser A connects and lands on instance 1.
Browser B connects and lands on instance 2. Both healthy, both holding a live
socket. Aas moves a task in browser A.

==Nothing happens in browser B.==

```text
                    ┌──────────────────┐
   BROWSER A ──────▶│   LOAD BALANCER  │◀────── BROWSER B
                    └────┬────────┬────┘
                         │        │
              ┌──────────▼──┐  ┌──▼──────────┐
              │ INSTANCE 1  │  │ INSTANCE 2  │
              │             │  │             │
              │ socket: A   │  │ socket: B   │
              │ board 412   │  │ board 412   │
              └─────────────┘  └─────────────┘

              knows about A       knows about B
              has never heard     has never heard
              of B                of A
```

Instance 1 has, in its own memory, a socket, a goroutine, and a note that this
socket cares about board 412. Instance 2 has ==no way to learn any of that==.
They are separate processes, possibly in separate data centres, sharing nothing
but a database.

**This is the contradiction.** Statelessness was the property that made horizontal
scaling work: any instance can serve any request, so you can add instances, kill
instances, and deploy without coordination. Notebook 06 section 21 is the full
treatment.

==A persistent connection breaks it, permanently and by definition.== The moment
instance 1 accepts a WebSocket from browser A, instance 1 is the only machine in
the world that can send anything to browser A. Not because of configuration.
Because the socket is a file descriptor in that process's table, and file
descriptors do not travel.

```text
  stateless HTTP                    a held connection
  --------------                    -----------------
  any instance serves any request   one instance serves one client
  scale by adding instances         adding instances helps new clients only
  deploy by replacing instances     replacing an instance drops its clients
  no coordination needed            the instances must now talk
```

:::signal
"A WebSocket is state, and unlike session state I cannot externalise it to Redis,
because the thing that is stateful is the file descriptor itself. So the fix is
never to share the connection. It is to route the ==event== to the instance that
holds it." That reframing is the whole of the next three sections.
:::

:::key
==You cannot move a connection.== Every solution from here accepts that the socket
stays where it is and moves the message to it instead.
:::

## 28. Sticky sessions are not the answer, and not for the reason you think

The reflex suggestion is sticky sessions: tell the load balancer to keep sending
a given client back to the same instance.

The lecture's verdict is right, and its reasoning is worth sharpening.

**The usual objection.** Stickiness pins browser A to instance 1, but browser B is
still on instance 2 and still knows nothing about A. ==The problem is two clients
on two instances, and stickiness is about one client over many requests.== It
solves a problem nobody has here.

**The sharper objection, which is the one to say out loud.** For a WebSocket,
stickiness is close to ==a no-op==, because there is nothing to be sticky about.

```text
  what stickiness does:   route many SEPARATE requests to the same backend

  a WebSocket is:         ONE request, upgraded once, then a single
                          TCP connection that stays pinned to whichever
                          backend accepted it, for its entire lifetime
```

The pinning is inherent. There is no second request to route, so the load
balancer's affinity feature has nothing to act on. !!Enabling sticky sessions to
"make WebSockets work" is configuring something that was already true.!!

Where stickiness ==does== matter is the designs that make repeated requests:

| Design | Does stickiness matter? |
|---|---|
| WebSocket | No. One connection, pinned by construction |
| SSE | Not for the stream. ++Possibly for the POSTs beside it++, if the handler keeps per-user state in process |
| Long polling | ==Yes.== Every poll is a new request and can land anywhere |
| Polling | Yes, for the same reason |

And it has a real cost. Stickiness makes load ==uneven and unshakeable==: a hot
instance stays hot, because the clients that made it hot cannot be moved. In a
system where a connection lasts hours, that imbalance persists for hours.

:::trap
!!"We turned on sticky sessions and real-time started working."!! Then something
else changed at the same time, most likely upgrade support or an idle timeout on
the same load balancer. The affinity itself did nothing for an already-pinned
connection. This is worth being firm about, because it is a widely repeated piece
of folklore.
:::

:::key
A WebSocket is pinned by construction, so stickiness is a no-op for it and
matters only for designs that issue repeated requests. ==The real problem is that
instances cannot reach each other's clients==, and no routing setting fixes that.
:::

## 29. Pub/sub: the instances talk to each other

If the connection cannot move and the event must reach it, then the event has to
travel between instances. That is the entire architecture, and it is one idea:

==The instance that receives the change does not deliver it. It publishes it.==

```text
  1. browser A ──▶ instance 1:  POST /tasks/9/move
  2. instance 1 commits to the database        ← source of truth first
  3. instance 1 PUBLISHES to topic "board.412"
                          │
                          ▼
                 ┌──────────────────┐
                 │  REDIS / NATS /  │
                 │      KAFKA       │
                 └───┬──────────┬───┘
       4. delivered  │          │  delivered to every
          to every   │          │  subscribed instance
                     ▼          ▼
              ┌───────────┐  ┌───────────┐
              │INSTANCE 1 │  │INSTANCE 2 │
              └─────┬─────┘  └─────┬─────┘
                    │              │
       5. each instance looks at ITS OWN connections,
          finds the ones watching board 412, writes the frame
                    │              │
                    ▼              ▼
               browser A      browser B   ← sees it instantly
```

Three properties make this work.

**The producer and the consumer are decoupled.** Instance 1 does not know that
instance 2 exists, how many instances there are, or where browser B is. It knows
the topic name. ==Adding instances requires no change to the publish path.==

**The topic is the unit of routing, and choosing it is a design decision.** Topic
per board is right here: it is the granularity at which people care, and an
instance subscribes only to boards it actually holds connections for. ++Topic per
user is right for notifications. Topic per document is right for an editor.++
!!One global topic is right for nothing!!, because it makes every instance receive
every event in the system.

**The last hop is local.** Once the event reaches an instance, delivery is a map
lookup and a write to sockets in the same process. No network, no coordination.

:::term Pub/sub
Publish and subscribe. Senders write messages to a named topic without knowing
who reads them; readers subscribe to topics without knowing who wrote them. The
broker in the middle is what makes the two sides independent.
:::

:::ask Redis Cluster broadcasts pub/sub messages to every node. Does that matter?
Yes, and it is a real scaling wall. Classic Redis pub/sub in cluster mode
propagates every published message to every node so that a subscriber on any node
receives it, which means your bus does `messages × nodes` of work regardless of
where subscribers actually are. ==Redis 7 added sharded pub/sub, `SSUBSCRIBE` and
`SPUBLISH`, which confines a channel to the shard owning its key slot.== If you
are running clustered Redis for this, use the sharded commands, or you have
rebuilt the fan-out problem inside the thing that was supposed to solve it.
:::

:::key
The connection stays put; the event travels. Pub/sub is how instances reach each
other's clients, and ==topic granularity is the design decision==, because it
decides how much traffic each instance receives that it does not need.
:::

## 30. Redis pub/sub is at-most-once, and deploys are when it bites

A property that is easy to skip and expensive to discover: ==Redis pub/sub is
fire and forget==.

When you `PUBLISH`, Redis writes the message to whichever subscribers are
connected ==at that instant== and then forgets it. There is no queue, no
acknowledgement, no retry, no replay. A subscriber that was not connected does
not get the message, and nothing anywhere records that it missed one.

```text
  at-most-once      delivered zero or one times. never duplicated,
                    sometimes lost.        ← Redis pub/sub

  at-least-once     delivered one or more times. never lost, sometimes
                    duplicated.            ← Redis Streams, Kafka, SQS

  exactly-once      not a delivery property. it is at-least-once plus
                    idempotent handling at the consumer
```

**The scenario where this stops being theoretical is a deploy**, and deploys are
routine.

```text
  t=0.0   instance 3 receives SIGTERM, begins shutdown
  t=0.1   its Redis subscription drops
  t=0.4   a task moves. published to board.412.
          ← nobody on instance 3's former clients receives this. gone.
  t=2.0   replacement container starts
  t=3.5   it subscribes to board.412
  t=3.5+  clients reconnect and resubscribe

  a 3.4 second hole. every event in it is permanently lost.
```

Nothing errors. No metric moves. ==The only symptom is a user whose board is
subtly wrong until they refresh==, and they will not report that as a bug, they
will report the app as flaky.

The decision, stated plainly:

| If you need | Use |
|---|---|
| Cursor positions, typing indicators, presence | ++Redis pub/sub. Loss is fine; the next update corrects it++ |
| Chat messages, task changes, anything with a permanent effect | ==Something durable and ordered==: Redis Streams, Kafka, NATS JetStream |

:::signal
"Redis pub/sub gives me at-most-once, so I use it for state that is self-correcting
and a durable log for anything a user would notice missing. And in both cases the
database is still the source of truth, so a refresh is always correct." The last
clause is what separates a real answer from a memorised one.
:::

:::do
==Whatever the bus guarantees, make the client able to recover.== Section 32 is
the protocol. Building it means the difference between at-most-once and
at-least-once becomes a question of how often a resync runs, rather than a
question of whether the user ever sees the truth.
:::

:::key
Redis pub/sub loses messages by design, and a deploy is the most common time it
does. Choose the bus by whether a lost message is self-correcting, and ==build the
catch-up path either way==.
:::

## 31. Ordering, and why sequence numbers come first

Two events on the same board, published half a millisecond apart. Which arrives
first at browser B?

With plain pub/sub, ==you do not know==, and the answer can differ per subscriber.
For a board that means a card can end in the wrong column and stay there, because
the last write your client applied was not the last write that happened.

```text
  actual order            what a client may apply
  ------------            -----------------------
  task 9 ──▶ doing        task 9 ──▶ done
  task 9 ──▶ done         task 9 ──▶ doing     ← final state is wrong,
                                                  and it is wrong forever
```

Three mechanisms fix this, in increasing strength.

**1. Order per topic at the bus.** A partitioned log gives you total order within
a partition. ==Partition by the entity, board id here==, and every event for one
board is ordered, while different boards stay parallel. This is the standard use
of a Kafka partition key and it is usually enough, because ordering across boards
does not mean anything.

**2. A sequence number per topic.** Assign a monotonic integer as the event is
created, and put it in the payload.

```text
  { "seq": 1841, "type": "task.moved", "task": 9, "to": "doing" }
```

++The client tracks the highest sequence it has applied and discards anything
lower.++ That fixes reordering with no help from the bus at all. More
importantly, ==it makes a gap detectable==: a client that holds 1841 and receives
1843 knows for certain that it is missing something, which no amount of ordering
alone can tell it.

**3. Version the entity itself.** Include the entity's version in each event and
have the client apply only if it is newer. This survives out-of-order delivery
across topics too, and it is what makes a resync idempotent.

```text
  seq gives you:        did I miss anything?         ← detection
  ordering gives you:   is this the newest state?    ← correctness
  versions give you:    can I apply this twice?      ← idempotence
```

You want all three eventually. ==If you only add one thing on day one, add the
sequence number==, because it is a field in a JSON payload and it is the
precondition for everything in Part VI. Retrofitting it after launch means
migrating every client and every producer at once.

:::trap
!!"The bus preserves order, so the client will see events in order."!! Order at
the bus is not order at the browser. Between them sit an instance that may batch
or coalesce, a socket that may be reconnecting, and a client that may be applying
a resync concurrently with live frames. ==The client must be able to order and
deduplicate independently==, which is what the sequence number is for.
:::

:::key
Partition by entity for ordering, carry a per-topic sequence number for gap
detection, and version entities for idempotence. ==The sequence number is the one
that must exist from day one==, because everything in Part VI is built on it.
:::

:::recall Explain why a WebSocket breaks statelessness, and why the fix is not to share the connection. | 7
:::

:::recall Give the sharp objection to sticky sessions, not the usual one. | 5
:::

:::recall Draw the pub/sub path for one task move across two instances, labelling the topic. | 8
:::

:::part VI | Delivery: gaps, storms and fan-out

Connections drop. Not occasionally: constantly, as a normal condition of mobile
networks. And the work of delivering one event is multiplied by everyone
watching. This part is the three problems that appear only at production scale,
each with a documented example from a company that hit it first.
:::

## 32. The catch-up protocol

A connection drops: wifi to LTE, a lid closes, a proxy times out, a container
restarts. ==What happens to events published while the client was gone?==

By default, nothing. They were delivered to whoever was connected and
forgotten, so the user reconnects to a live stream and a stale board.

The fix has one shape, and you saw it in section 9. ==Name every message, and let
the client tell you where it got to.==

```text
  client ──▶ connect, "I am at sequence 0"
  server ──▶ seq 1   task.created
  server ──▶ seq 2   task.moved
             connection breaks

  client ──▶ reconnect, "I got up to sequence 2"
  server ──▶ seq 3, 4, 5 ...          ← the backlog, immediately
  server ──▶ then live frames
```

SSE gives you this free through `Last-Event-ID`. On a WebSocket ==you build it
yourself==, and it is the most valuable thing you will build. Uber's push platform
does exactly this.

Four things have to exist for it to work:

| Requirement | Why |
|---|---|
| A monotonic sequence per topic | Section 31. The precondition |
| A durable log with retention | You cannot replay what you did not keep |
| The client persisting its position | Across reconnects, ideally across reloads |
| ++A fallback when the gap is too large++ | Below |

**The fallback is what people forget.** Retention is finite, so a client away for
two hours may ask for a sequence that has aged out. Answer that honestly:

```text
  client asks for seq 41                     client asks for seq 41
  log retains 900 ... 1841                   log retains 12 ... 1841
                                             ↓
  ══▶ "too old. here is a full snapshot,     ══▶ replay 42 ... 1841
       resync from seq 1841"
```

++Every real-time client needs both paths.++ Resync is also your escape hatch for
any unrecoverable disagreement, which is why the board must always be correct on
refresh. ==The socket is an optimisation over a correct request path, never a
replacement for one.==

:::key
Sequence numbers, a retained log, and a client that remembers its position.
==Plus a snapshot path for when the gap exceeds retention==, because retention is
finite and the client will eventually exceed it.
:::

## 33. Fan-out: events times subscribers

Pub/sub solved reaching every instance. It did not reduce the work, and at scale
the work is the problem.

```text
  writes to perform  =  events  ×  subscribers

  30,000 people watching one board
  1 person moves 1 task
  ──▶ 30,000 frames must be serialised and written
```

One user action, thirty thousand writes. And the multiplication is invisible in
the code: your handler publishes one event and looks like it did one unit of
work.

Discord documented this. With communities of 30,000 people online at once,
publishing a single event took ==between 900 milliseconds and 2.1 seconds==, for
one message, on a platform whose entire product is messaging. Nothing is broken
in that number. It is arithmetic.

**Where the time goes** is worth being precise about, because it decides the fix:

```text
  per recipient:  serialise ──▶ frame ──▶ copy to socket ──▶ syscall
                     ↑
        often the same bytes, recomputed 30,000 times
```

Three fixes, in the order you should reach for them:

**1. Serialise once.** The payload is identical for every recipient. Encode the
frame once and write the same buffer to every socket. ++This is free and is
frequently not done++, because the natural code shape is a loop that marshals per
connection.

**2. Shard the fan-out across the machines that own the recipients.** This is
Discord's answer. Instead of one process walking 30,000 subscribers, the publish
goes to the instances holding those connections and ==each one fans out only to
its own share==. The work is the same in total, but it is parallel, and no single
process serialises 30,000 writes.

```text
  BEFORE                            AFTER
  one publisher                     publish once to the bus
  walks 30,000 subscribers          ↓
  serially                          10 instances, 3,000 each,
  ──▶ 900ms to 2.1s                 in parallel  ──▶ ~90ms
```

**3. Reduce the number of events.** Section 34.

:::ask 30,000 people are watching. Do they all need every event?
Usually not, and this is the question that removes the most work. Subscription
should be scoped to what is actually rendered: the visible column, the open
thread, the current viewport. A user scrolled to the bottom of a board does not
need cursor movements at the top of it. ==Narrowing the topic is cheaper than
optimising the fan-out==, and it is the first thing to look at.
:::

:::key
Delivery work is `events × subscribers`, and it hides inside a single publish
call. Serialise once, ==spread the fan-out across the instances that own the
recipients==, and subscribe to less.
:::

## 34. Coalescing: the other lever

Fan-out multiplies by subscribers. The other factor is events, and it is often
the easier one to attack.

Most real-time payloads are ==state, not history==. If a task moves three times in
two hundred milliseconds, the client does not need three frames. It needs the
final position. Sending all three is work you performed so the client could
discard two of them.

```text
  WITHOUT COALESCING          WITH A 50ms TICK
  event ──▶ write             event ──▶ into per-connection pending
  event ──▶ write             event ──▶ overwrite pending (same entity)
  event ──▶ write             event ──▶ overwrite pending
  3 frames per subscriber     ─── tick ───▶ 1 frame per subscriber
```

**Batching** and **coalescing** are two different savings and you usually want
both:

| | What it does | Saves |
|---|---|---|
| Batching | Many events into one frame on a timer | Syscalls, framing, wakeups |
| Coalescing | Many events about ==one entity== collapse to the latest | The events themselves |

A 50 millisecond tick is imperceptible to a human and reduces a burst of twenty
events to one frame. It also ==turns the slow-client problem from section 25 into
a bounded one==: if the pending set holds at most one entry per entity, a client
that cannot keep up accumulates a set the size of the board, not a queue the size
of history.

++Coalesce anything idempotent and state-shaped++: positions, presence, typing
indicators, counters, progress. !!Never coalesce anything with independent
meaning!!: chat messages, log lines, transactions. Merging two chat messages into
one is data loss, not an optimisation.

:::do
Give each connection a pending map keyed by entity id, and flush it on a ticker
rather than writing on publish. ==This one change usually beats every other
optimisation in this part==, because it attacks the multiplicand rather than the
multiplier, and it makes backpressure bounded for free.
:::

:::key
Coalesce state, batch everything, and never coalesce messages that mean something
individually. A tick you cannot perceive removes most of the work.
:::

## 35. The reconnect storm

An instance holding 50,000 connections dies. What happens next is the failure
that turns one dead instance into an outage.

All 50,000 clients notice within a second or two, and they all reconnect ==at the
same moment==. That alone is survivable: the remaining instances accept
connections. What is not survivable is what each client does next.

```text
  t=0.0   instance dies
  t=0.5   50,000 clients see the socket close
  t=0.6   50,000 reconnect attempts
  t=0.7   50,000 clients ask "what is my initial state?"
              ↓
          which boards, which tasks, who is online,
          what did I miss
              ↓
          50,000 EXPENSIVE requests in one second,
          all of them hitting the database
```

==The reconnection is cheap. The initial state is not.== And it arrives as a
perfectly synchronised spike, which is the worst possible shape for a database.
Slack documented exactly this failure.

Two defences, and you want both.

**1. Jittered backoff on the client.** ++Never reconnect immediately, and never
reconnect on a fixed delay.++ A fixed delay just moves the spike; every client
still arrives together.

```text
  wrong:  sleep(1s)                    ← the whole herd, one second later

  right:  delay = random(0, min(cap, base × 2^attempt))
          base 500ms, cap 30s

          attempt 1 ──▶ somewhere in 0 to 1s
          attempt 2 ──▶ somewhere in 0 to 2s
          attempt 3 ──▶ somewhere in 0 to 4s
```

++Full jitter, the random range from zero, not a fixed delay with a small random
addition.++ The randomness is what spreads the herd; the backoff is what stops it
returning at full strength.

**2. Make the initial state cheap.** This was Slack's fix: ==cache the start
payload at the edge of the network==, so a reconnect storm is absorbed before it
reaches the origin. The same reasoning applies at every layer: precompute the
snapshot, cache it with a short TTL, and serve the same bytes to everyone who
asks in the same second. ==A thundering herd is a caching problem wearing a
real-time costume.==

:::trap
!!"We have autoscaling, so a reconnect storm will scale out."!! Autoscaling
responds in tens of seconds to minutes. A reconnect storm is complete in two.
Worse, the storm hits the database, and adding instances adds database load. Scale
does not defend against synchronised demand; ==jitter and caching do==.
:::

:::key
The reconnect is cheap and the resync is expensive. ==Jitter the reconnect from
zero and cache the initial state==, or one dead instance becomes a database
incident.
:::

## 36. Deploys: draining a connection that never ends

You deploy several times a day. Every deploy replaces every instance. Every
instance holds thousands of connections that, by design, never end on their own.

Standard connection draining does not resolve this. A load balancer stops sending
==new== connections to a draining target and waits for existing ones to close, up
to a deregistration delay (300 seconds on an AWS ALB by default). Ordinary HTTP
requests finish in milliseconds, so draining works. ==A WebSocket does not
finish.== It sits there until the delay expires and is then cut.

```text
  a normal deploy                     a deploy with WebSockets
  ---------------                     ------------------------
  stop new requests                   stop new connections
  in-flight finish in ~50ms           in-flight finish in ... never
  drain complete                      wait out the deregistration delay
  replace                             then CUT 5,000 sockets at once
                                      ──▶ a reconnect storm you scheduled
```

So a deploy manufactures the exact failure of section 35, on purpose, several
times a day.

++The fix is to make the shutdown cooperative rather than waiting for a timeout.++

```text
  1. SIGTERM. stop accepting new connections. fail the readiness probe
  2. tell the clients, in the application protocol:
         { "type": "reconnect", "after_ms": <random 0..30000> }
     or close with code 4002, "rebalancing"
  3. clients disconnect on their own schedule, spread over 30 seconds,
     and reconnect to instances that are already healthy
  4. when the connection count reaches zero, or a deadline passes, exit
  5. only then let the orchestrator replace the container
```

The client's response to a 4002 close is ==different from its response to 1006==:
it knows this was deliberate, it knows a jittered delay was suggested, and it can
skip the "is the network broken" backoff entirely.

Two more details that matter operationally:

- ==Your readiness probe must fail before your liveness probe does.== Otherwise
  the orchestrator kills the container mid-drain.
- ==Set `terminationGracePeriodSeconds` longer than your drain window.== The
  default is 30 seconds in Kubernetes, and a 30-second drain plus a 30-second
  grace period means being killed exactly as the last clients are leaving.

:::signal
"I treat a deploy as a scheduled reconnect storm, so I drain cooperatively: I
tell clients to reconnect with a jittered delay using an application-level
message, rather than letting the load balancer cut them all at once when the
deregistration delay expires." That is an answer nobody gives who has not
operated one of these.
:::

:::key
A connection that never ends cannot be drained by waiting. ==Tell the clients to
leave, with jitter==, and size the grace period around the drain rather than the
default.
:::

:::recall Write the catch-up protocol, including what happens when the gap exceeds retention. | 8
:::

:::recall Give the fan-out formula, Discord's measured numbers, and the three fixes in order. | 7
:::

:::recall Why does a fixed reconnect delay not solve a reconnect storm? Give the correct formula. | 6
:::

:::part VII | The parts the lecture left out

The lecture ends by naming what it did not cover: presence, and collaborative
editing. Those get asked about constantly, so they are here, along with the two
security problems that arrive with any long-lived socket and the protocol that is
lining up to replace WebSockets.
:::

## 37. Authenticating a socket

Authentication on a WebSocket has one awkward constraint and one architectural
problem, and neither is obvious until you hit them.

**The constraint: the browser cannot set headers.** `new WebSocket(url)` takes a
URL and an optional subprotocol list, and no headers. ==You cannot send
`Authorization: Bearer`==, exactly as with `EventSource` in section 10. Three
options:

| Approach | The problem with it |
|---|---|
| **Cookie** | Sent automatically at the handshake. ==Enables the attack in section 39==, and needs `SameSite` |
| **Token in the query string** | !!Lands in access logs, proxy logs and browser history!! |
| **++Authenticate in the first message++** | Connection is open but unauthenticated for a moment; you must enforce a deadline |

++The practical answer is a short-lived, single-use ticket++, fetched from an
ordinary authenticated endpoint and passed in the query string. It leaks into
logs, but a single-use credential with a 30-second life is not worth stealing.

```text
  POST /realtime/ticket   ──▶ { "ticket": "rt_9f3...", "expires_in": 30 }
  new WebSocket("wss://api.example.com/ws?ticket=rt_9f3...")
   ──▶ server redeems it, once, and binds the connection to the user
```

++Do not stop here.++ The harder half of the problem is what happens to that
authentication over the next four hours, which is the next section.

:::key
Browsers cannot set headers on a socket, so the credential goes in the URL.
==Use a short-lived, single-use ticket== rather than a real token, so what lands
in your access logs is worthless by the time anyone reads it.
:::

## 38. The token that never expires

Authentication happened once, at the handshake. The connection lives for hours.

```text
  10:00  handshake. token valid, expires 10:15
  10:15  token expires                    ← nothing happens
  10:20  admin revokes the user's access  ← nothing happens
  14:00  connection still open, still receiving every event
```

==A long-lived connection outlives every credential that authorised it.== HTTP
hid this, because re-authorising every request meant revocation took effect
within one request. Three mechanisms; you want at least the first two:

1. **A connection deadline.** Close with 4001 on expiry and let the client
   re-ticket. The reconnect is cheap because you built section 32.
2. **Authorise per subscription, not per connection.** Being connected is not
   permission to receive board 412. ++Check membership on subscribe++, and again
   when that board's membership changes.
3. **A revocation channel.** A `user.access.revoked` event telling instances to
   drop that user's subscriptions immediately.

Notebook 05 on authorisation applies unchanged; ==what is new is that the check
has no natural moment to re-run==, so you have to create one.

:::signal
"The handshake authenticates the connection once, so I put a deadline on it and
authorise per subscription rather than per connection. Otherwise revoking access
does nothing until the user reconnects."
:::

:::key
==Authorisation happens once and the connection outlives it.== HTTP re-checked on
every request; a socket never re-checks unless you build the moment. A deadline
and a per-subscription check are the minimum.
:::

## 39. Cross-site WebSocket hijacking

A specific attack that catches teams who correctly configured CORS and reasonably
assumed it covered them. ==It does not.==

**The WebSocket handshake is not subject to CORS.** There is no preflight, and the
same-origin policy does not block the connection. What the browser does instead is
send an `Origin` header and ==hand the decision to your server==. If your server
does not look at it, any page on the internet can open an authenticated socket to
your API using your user's cookies.

```text
  1. victim is logged in to app.example.com (session cookie set)
  2. victim visits evil.example
  3. evil.example runs:

         const ws = new WebSocket("wss://api.example.com/ws");

  4. the browser attaches the cookie, because the handshake is a
     normal request with credentials
  5. no preflight. no CORS check. no same-origin block.
  6. your server upgrades the connection
  7. evil.example now has an authenticated, bidirectional socket
     into your API as the victim
```

This is CSRF with a persistent channel and a readable response, which is worse
than CSRF: the attacker not only acts as the user, they ==receive everything you
push to that user, continuously==.

**Modern `SameSite` defaults mitigate this substantially.** Chrome treats cookies
without an explicit `SameSite` as `Lax`, and a handshake initiated by another site
is a cross-site request, so the cookie is not attached. ++That is a real defence
and you should set `SameSite=Lax` or `Strict` explicitly rather than relying on a
browser default.++ !!But do not treat it as the whole answer!!: cookies
deliberately set to `SameSite=None` for other reasons are exposed again, and
non-browser clients send whatever they like.

++The defence that does not depend on any of that is to check `Origin` on every
handshake, against an allowlist, and reject with 403 before upgrading.++

```text
  origin := r.Header.Get("Origin")
  if !allowed[origin] { http.Error(w, "forbidden", 403); return }
```

And the better structural answer is section 37's ticket: ==a credential the
attacker's page cannot obtain==. An `Origin` check is a blocklist against browsers;
a ticket the attacker cannot mint is a positive proof, and it makes the ambient
cookie irrelevant.

:::trap
!!"Our CORS policy is strict, so cross-origin sockets are blocked."!! CORS does
not apply to the WebSocket handshake. Many libraries default to ==accepting any
origin==, and some log a warning nobody reads. Check what your library does; the
default is frequently permissive.
:::

:::key
CORS does not protect the WebSocket handshake. ==Validate `Origin` explicitly==,
set `SameSite` explicitly, and prefer a ticket over an ambient cookie so the
question does not arise.
:::

## 40. Presence: who is online

The lecture names presence as out of scope. It is asked about constantly, and it
is a genuinely hard problem hiding behind a trivial-sounding feature.

**Naive design.** Set a flag on connect, clear it on disconnect. It fails
immediately, because ==disconnects are frequently not observed==: that is section
18. A crashed client, a dead network or a killed container leaves users online
forever.

**The correct primitive is a TTL that must be refreshed.**

```text
  on connect and every 15s:
      SET presence:user:42:device:ab  1  EX 45

  a user is online if ANY of their device keys exists

  no refresh for 45 seconds ──▶ the key expires ──▶ offline,
  without anyone having to notice the disconnect
```

++Presence is derived from a heartbeat, never from an event.++ The TTL does the
work, so the failure mode of a missed disconnect is a 45-second delay rather than
permanent wrongness. Three details make it work in practice:

**Per device, not per user.** A user on a laptop and a phone has two connections
on two instances. ==Online means "any device key exists"==, which a key pattern or
a Redis set with per-member expiry handles cleanly. A single per-user flag makes
closing one tab appear to log you out.

**Flapping.** A commuter's connection drops every ninety seconds, and a naive
implementation broadcasts leave, join, leave, join to everyone watching. ++Debounce
the offline transition++: wait a few seconds before announcing a departure, and
cancel it if they come back. Nobody notices a delayed goodbye; everybody notices a
flickering list.

**Presence fan-out is the worst fan-out in the system.** In a room of `n` people
where everyone sees everyone's status, one join is `n` notifications, and everyone
joining is ==`n²`==. This is why large chat platforms do not show full member
presence in large rooms: they show it for a visible subset, or they show a count,
or they degrade above a threshold.

```text
  10 people   ──▶     100 updates    fine
  1,000       ──▶ 1,000,000 updates  not fine
```

:::do
Above a room size threshold, ++stop pushing per-member presence and push a
count++, which is one small coalesced value regardless of membership. Fetch
individual status on demand for the members actually rendered.
:::

:::key
Presence is a heartbeat with a TTL, per device, debounced on departure. ==Its
fan-out is quadratic==, which is why every large platform degrades it above a
room size rather than scaling it.
:::

## 41. Collaborative editing, in one page

The other thing the lecture names as out of scope, and the correct answer to it in
an interview is short, because the honest answer is "this is a large field and
here is the decision".

**The problem.** Two people edit the same paragraph at the same time. Both
edits are valid, both are already applied locally, and neither can be rejected
without the editor feeling broken. ==Last-write-wins destroys one person's work
and is not acceptable in an editor.==

```text
  document: "hello world"
  Aas inserts "big " at position 6      ──▶ "hello big world"
  Leo inserts "!"    at position 11     ──▶ "hello world!"

  applied naively in either order, positions have shifted
  underneath the second edit and the result is wrong
```

**Two families of answer.**

| | Operational Transformation | CRDT |
|---|---|---|
| Idea | ==Transform an incoming operation against ones already applied== | ==Design the data type so operations commute== |
| Needs a server | Usually yes, to order operations | No. Converges peer to peer |
| Complexity | In the transform functions, which are notoriously hard to get right | In the data structure and its metadata |
| Cost | Smaller documents on the wire | Metadata per character, which grows |
| Used by | Google Docs | Figma, Automerge, Yjs |

**What to say.** ++"I would use an existing CRDT library rather than implement
either."++ That is not a dodge; it is the correct engineering answer, and both
families are famous for subtle bugs found years after deployment.

**What connects back to this book.** A collaborative editor still needs everything
in Parts V and VI, unchanged: a topic per document, ordered delivery, sequence
numbers, a catch-up path, presence for the cursors, and coalescing (cursor
positions are the canonical thing to coalesce, at thirty a second per user). ==The
CRDT solves conflict, not transport.== Everything you have read still applies
underneath it.

:::signal
"OT transforms operations against each other and needs a central server; CRDTs
make operations commutative and do not. I would take a library, because the
correctness bugs in both are subtle and well documented. The transport underneath
is the same real-time system either way." That is a complete answer in four
sentences and it is enough.
:::

:::key
OT transforms, CRDTs commute, and you should use a library for either. ==The
conflict algorithm sits on top of the transport, and does not replace any of it.==
:::

## 42. Where this goes next: WebTransport

The last thing to be able to say, because "why not WebTransport" is a reasonable
follow-up and "I have not heard of it" is a poor answer.

WebSockets sit on TCP, and TCP has one property that hurts real-time work:
==head-of-line blocking==. One lost packet stalls everything behind it, because
TCP guarantees ordered delivery of a single byte stream. If you are sending
cursor positions and one packet is lost, the retransmission delays positions that
have already been superseded.

%%WebTransport%% runs over HTTP/3 and QUIC, and gives you two things a WebSocket
cannot:

```text
  WEBSOCKET                        WEBTRANSPORT
  one ordered stream               many independent streams
  ──▶ head-of-line blocking        ──▶ a loss stalls only its own stream

  reliable only                    reliable streams AND unreliable datagrams
                                   ──▶ send a cursor position and let it
                                       be lost, because the next one is
                                       already more correct
```

Unreliable datagrams are the genuinely new capability. For state that is
superseded within milliseconds, ==retransmission is worse than loss==, and until
now the web platform had no way to express that.

**Be honest about status.** Browser support is uneven: it has shipped in
Chromium-based browsers and Firefox, and ==Safari support has lagged==, so verify
current support before designing around it. Load balancer and CDN support for
HTTP/3 to origin is also less universal than for HTTP/1.1 upgrades.

++So the answer today is still SSE or WebSocket for anything that must work
everywhere++, with WebTransport as the thing to watch, and the thing to reach for
first in games and real-time media where the datagram model is the point.

:::key
WebTransport removes head-of-line blocking and adds unreliable datagrams, which
is the right model for state that is superseded immediately. ==Support is not yet
universal==, so it is the informed answer to "what is next", not the default
choice today.
:::

:::recall Why can a browser not send an Authorization header on a socket, and what replaces it? | 6
:::

:::recall Explain cross-site WebSocket hijacking, and give two defences. | 7
:::

:::recall Why is presence a TTL rather than an event, and why does it degrade above a room size? | 6
:::

:::part VIII | The interview itself

The knowledge is not the deliverable. The delivery is.
:::

## 43. The delivery script

"Two users have the same board open. One moves a task and the other should see it
live. Design it." About twelve minutes, in this order.

1. **Clarify, in three questions.** How many concurrent viewers per board, how
   often do things change, and does the client need to push at a high rate? Those
   three answers are `U`, `E` and the direction question, and ==they decide the
   design before you name any technology==.
2. **Do the polling arithmetic out loud.** `U/T` requests per second, `T/2`
   average latency, and the product is fixed at `U/2`. Say that polling is a
   correct answer if `U/T` is near `E`, and that you are moving on because it is
   not. ==Thirty seconds, and it establishes the entire cost model.==
3. **Skip long polling in one sentence.** One message per connection, then a gap
   where the server cannot reach you. RFC 6202 puts the worst case at more than
   three network transits.
4. **Choose SSE or WebSocket and justify it by direction.** SSE if the client only
   receives, and say that the browser gives you reconnection and `Last-Event-ID`
   resumption free. WebSocket if the client pushes at a rate that makes POSTs
   silly. ++Naming SSE at all is a differentiator++, because most candidates
   reach straight for WebSockets.
5. **Now say the important sentence.** "The moment I hold a connection, my
   backend is stateful: that socket lives in one process and cannot be moved."
   Draw two instances and two browsers, and show that instance 2 cannot reach
   browser A. ==This is the centre of the answer.==
6. **Resolve it with pub/sub, and pick the topic.** Topic per board. Publish on
   change, every instance delivers to its own sockets. Then volunteer that Redis
   pub/sub is at-most-once and that a deploy is when that bites.
7. **Volunteer the production failures before you are asked.** Sequence numbers
   and the catch-up path. Fan-out as `events × subscribers` with Discord's
   numbers. Reconnect storms and jittered backoff. Draining on deploy. ==Each of
   these is one sentence and each one reads as having operated a system.==
8. **Give capacity numbers if asked.** Descriptors, then client ports, then about
   10 KB per idle connection, so a million is roughly 10 GB. Then correct it
   yourself: that is a floor from an empty program, and a slow client with an
   unbounded queue is what actually kills the process.

Then name what you left out: "I have not covered collaborative editing, which
needs a CRDT on top of this transport, or presence, which is a TTL heartbeat with
quadratic fan-out." ==Naming the boundary reads as judgement, not as a gap.==

## 44. Whiteboard drawing order

Draw in this order. It builds an argument rather than a picture.

```text
   1. two browsers, side by side, same board
   2. one arrow: browser A ──▶ server   "the write. ordinary POST."
   3. the question mark: server ──▶ browser B, and say
      "HTTP has no arrow here. everything else follows from that."

   4. ONE server box. show the socket to A and the socket to B.
      this version works. say so.

   5. now split it: TWO instances behind a load balancer.
      redraw the sockets: A on instance 1, B on instance 2.
   6. draw the arrow you cannot draw: instance 1 ──▶ browser B.
      cross it out. THIS IS THE WHOLE PROBLEM.

   7. add the bus underneath. topic "board.412".
      publish from 1, deliver to 1 and 2, each writes its own sockets.
   8. label the sequence number on the event.
   9. only now: the log for catch-up, the snapshot path,
      the coalescing tick, the edge cache for reconnect storms
```

Step 6 is the moment the whiteboard does the work for you. ==Draw the arrow, then
cross it out, and say "a socket is a file descriptor in one process, so this
arrow cannot exist".== Everything after that is you resolving a problem the
interviewer has now watched you find.

## 45. Follow-up question bank

Answer each out loud before checking the section.

| Question | Section |
|---|---|
| Why can the server not just connect back to the browser? | 2 |
| When is polling the right answer? | 3, 4 |
| Halve the poll interval. What happens to cost and to latency? | 4 |
| What exactly is wrong with long polling? | 5 |
| Write a valid SSE event by hand | 8 |
| How does an SSE client resume after a drop? | 9 |
| LLM APIs use SSE. Do they use `EventSource`? | 10 |
| The stream works locally and not in staging. Why? | 11 |
| Why does the app break in the seventh tab? | 12 |
| Why does a WebSocket start as an HTTP GET? | 14 |
| Is `Sec-WebSocket-Key` a security mechanism? | 14 |
| What stops working after the 101? | 15 |
| How many bytes of overhead does a small message cost? | 16 |
| Why does the client mask frames and the server not? | 17 |
| Why do you need ping and pong when TCP has keepalive? | 18 |
| You see nothing but 1006 in the logs. Where do you look? | 19 |
| SSE or WebSocket, and why? | 20 |
| Why is your connection ceiling 1,017 and not 1,024? | 21 |
| Why does Go report a different limit than Python on the same box? | 22 |
| Can a server hold more than 65,535 connections? | 23 |
| How much RAM for a million connections, and what is it spent on? | 24 |
| One client on hotel wifi takes down the process. How? | 25 |
| You enabled compression and memory tripled. Why? | 26 |
| Why does a WebSocket break statelessness? | 27 |
| Do sticky sessions fix real-time? | 28 |
| How do two instances deliver to each other's clients? | 29 |
| What does Redis pub/sub lose, and when? | 30 |
| Two events arrive out of order. What saves you? | 31 |
| A user was offline for 90 seconds. Then what? | 32 |
| 30,000 people watch one board. What is the cost of one move? | 33 |
| How do you reduce the number of events, not just the writes? | 34 |
| An instance dies. Why is that a database problem? | 35 |
| How do you deploy without cutting every connection at once? | 36 |
| How do you authenticate a socket? | 37 |
| When does that authorisation expire, and what re-checks it? | 38 |
| Your CORS policy is strict. Are your sockets safe? | 39 |
| How do you know a user is online? | 40 |
| Two people edit the same paragraph. What do you use? | 41 |
| Why not WebTransport? | 42 |

:::part IX | Appendices
:::

## Appendix A. Numbers to memorise

| Quantity | Value |
|---|---|
| Polling requests per second | `U / T` |
| Polling average latency | `T / 2` |
| Polling cost times latency | ==`U / 2`, a constant== |
| Long polling worst-case latency | More than 3 network transits (RFC 6202) |
| SSE MIME type | `text/event-stream` |
| SSE resume header | `Last-Event-ID` |
| SSE heartbeat interval | 15 seconds, a `:` comment |
| HTTP/1.1 connections per origin | ~6. HTTP/2 multiplexes instead |
| WebSocket RFC | 6455 |
| WebSocket handshake status | ==101 Switching Protocols== |
| `Sec-WebSocket-Key` | 16 random bytes, base64 |
| Handshake constant | `258EAFA5-E914-47DA-95CA-C5AB0DC85B11` |
| Accept computation | `base64(SHA1(key + constant))` |
| Opcodes | 0 continuation, 1 text, 2 binary, 8 close, 9 ping, 10 pong |
| Frame header, small payload | ==2 bytes, +4 for the client mask== |
| Payload length encoding | 7 bits; 126 means 2 more bytes; 127 means 8 more |
| HTTP overhead per poll | ~1 KB, mostly cookies |
| Masking key | 4 bytes, cleartext, fresh per frame, client to server only |
| Ping interval, typical | 20 to 30 seconds |
| Pong deadline, typical | 30 seconds |
| TCP keepalive default (Linux) | ==2 hours. Useless for this== |
| Close code 1006 | Abnormal. Set locally, ==never sent== |
| Application close codes | 4000 to 4999 |
| Descriptor overhead per process | ~7 (stdio, listener, epoll, internals) |
| Default `ulimit -n` | 1,024 soft |
| Go's raised limit | Hard limit minus one (e.g. 1,048,575) |
| Default ephemeral port range | 32,768 to 60,999 = ==28,232 ports== |
| TCP connection identity | The 4-tuple, not the port |
| Heap per idle connection | ==~10 KB== (measured 9,751 / 9,752 / 9,881) |
| 1M idle connections | ~10 GB of heap, before kernel structures |
| Buffers' share of that 10 KB | ~80%: two 4 KB buffers |
| `permessage-deflate` per connection | Hundreds of KB at default window size |
| ALB idle timeout | 60 seconds |
| Nginx `proxy_read_timeout` | 60 seconds |
| ALB deregistration delay | 300 seconds |
| Kubernetes grace period default | 30 seconds |
| Discord fan-out, 30k online | ==900 ms to 2.1 s for one message== |
| Coalescing tick | 50 ms, imperceptible |
| Presence TTL / refresh | 45 s TTL, refreshed every 15 s |
| Presence fan-out | ==`n²` in a room of `n`== |
| Backoff formula | `random(0, min(cap, base × 2^attempt))` |

## Appendix B. Glossary

Every term glossed in this book, in one place. Each entry links back to the page
where it first appeared.

:::glossary
:::

## Appendix C. Self-test

Close the book. Anything you cannot answer in two sentences goes back to the
section beside it.

:::recall Both polling formulas, and why their product cannot be improved. | 6
:::

:::recall The four transports compared on direction, cost scaling, reconnect logic and resume. | 8
:::

:::recall Write a valid SSE body with two events, a heartbeat and a resumable id. | 7
:::

:::recall Draw the WebSocket frame header with all six opcodes and the length encoding. | 8
:::

:::recall Why masking exists, why the key is in cleartext, and why servers do not mask. | 6
:::

:::recall Why an idle and a dead connection are indistinguishable, and what that forces you to build. | 6
:::

:::recall The three capacity ceilings in order, with the error message and the fix for each. | 8
:::

:::recall Decompose 10 KB per connection, then give three ways to reduce it. | 6
:::

:::recall Why a persistent connection breaks statelessness, and why the connection cannot be moved. | 6
:::

:::recall The sharp objection to sticky sessions, not the usual one. | 5
:::

:::recall What Redis pub/sub loses, when it loses it, and what to use instead. | 6
:::

:::recall The catch-up protocol, including the case where the gap exceeds retention. | 7
:::

:::recall The fan-out formula and its three fixes, in the order you would apply them. | 6
:::

:::recall Why a fixed reconnect delay does not fix a reconnect storm. Give the formula that does. | 6
:::

:::recall How you deploy without cutting every connection at once. | 6
:::

:::recall Why authorisation on a socket has no natural moment to re-run, and what you do about it. | 6
:::

:::recall Cross-site WebSocket hijacking, and two defences. | 6
:::

:::redraw The whole system: two browsers, two instances, the load balancer, the bus, the log, the snapshot path. | Mark the arrow that cannot exist, and label where the sequence number is assigned. Then compare with the drawing you made on the title page.
:::
