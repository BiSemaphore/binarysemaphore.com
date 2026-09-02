:::title Before you read on: write down the last time you made something faster. Then write down the number that told you to. If there is no number, that is what this book is about.
Study Notebook / 06
Scaling and Performance
Where the time actually goes, and how you know
Senior backend and full-stack interview preparation. Read with a pen.
:::

## How to use this book

This book follows _Backend Scaling and Performance Engineering_, parts one and
two (`youtube.com/watch?v=z7kt_p44rjs` and `watch?v=sOhAopEwjH4`, 4h05 across
the two, the longest subject in the _Backend from First Principles_ playlist).

Most scaling material is a catalogue: here is caching, here is sharding, here
is a load balancer. A catalogue is useless in an interview, because the
interviewer is not asking whether you know what a read replica is. They are
asking whether you would reach for one, and why, and what it would cost you.

So this book is organised around one question instead.

:::key
==Where does the time actually go?== Every technique in this book is a way of
moving time somewhere cheaper: to another machine, to a closer machine, to a
later moment, or to no work at all. If you cannot say where the time goes now,
you cannot know which of them applies, and you will spend a week on the wrong
one.
:::

The interview version of the same question is shorter and more brutal:
**which number told you to do that?**

#### Scope

Performance means something different in a browser, in a compiler, in a game
engine. This book stays where the lecture stays, in ==the backend you write and
the infrastructure directly around it==: your handlers, your queries, your
cache, the machines your code runs on, and the network between them.

#### What this book adds

The lecture is strong on intuition and light on numbers. Where a piece of folk
wisdom has an actual formula behind it, this book gives you the formula, because
a number is what turns an opinion into an answer. It also fills four gaps the
lecture leaves open: backpressure, retry storms, cache stampede, and tail
latency amplification. Each is marked where it appears.

#### The five block types

| Block            | What it means                                                              |
| ---------------- | -------------------------------------------------------------------------- |
| Interviewer asks | A real follow-up you should expect. Answer it out loud before reading on.  |
| Senior signal    | The specific sentence that separates a senior answer from a mid-level one. |
| Trap             | A plausible answer that is wrong, or right for the wrong reason.           |
| Do this          | The concrete practice, in the form you would actually apply it.            |
| Key idea         | The one thing to carry away from the section.                              |

Recall rules and full-page redraw plates appear at the end of each part. Use
them. Every prompt in this book also appears in Notebook 00, the Question Bank,
where you can work them cold.

#### Related notebooks

This book deliberately does not repeat what other notebooks cover in depth.

- Indexes, `EXPLAIN ANALYZE`, isolation levels: Notebook 04, Postgres.
- Queues, workers, leases, idempotency, dead letters: Notebook 01, Large-Scale
  Data Ingestion, Parts IV and V.
- Object storage, presigned URLs, CDN origins: Notebook 02, Object Storage.
- Rate limiting and the abuse side of load: Notebook 05, Backend Security.

:::toc
:::

:::part I | What "fast" means
Six sections of vocabulary. This is the part people skip, and it is the part
that decides whether the rest of the book is usable, because every technique
later is justified by a number defined here.
:::

## 1. "Slow" is not a bug report

A user says the app is slow. A product manager repeats it. Somebody opens a
ticket. And every one of those sentences contains exactly zero actionable
information.

Here is what "the app is slow" can mean, all of which have different fixes:

```text
  "the app is slow"
        │
        ├── every request takes 800ms          ← a systemic problem
        ├── one endpoint takes 8s              ← one bad query or call
        ├── it is fine until 6pm               ← a capacity problem
        ├── it is fine for me, slow for them   ← a geography problem
        ├── the first click is slow            ← a cold start or cold cache
        └── it hangs, then works               ← queueing, or a retry storm
```

Six different systems. Six different fixes. One sentence.

:::signal
The first thing a senior engineer does with "it is slow" is **turn it into a
measurable claim**. Which endpoint, at which percentile, measured where, at what
throughput, compared to what it was. Until you have those five, you do not have
a problem statement, you have a mood.
:::

The whole of Part I exists to give you those five words. Latency, percentile,
throughput, utilization, headroom. They are not jargon for its own sake. Each
one is a different question you can ask about the same slow endpoint, and
together they narrow "slow" down to something with a fix.

:::trap
Skipping this part because you already know what latency means. Most engineers
who know what latency means still quote it as a single number, still measure it
on the server rather than at the client, and still cannot say what happens to it
at 90% CPU. The words are common. The precision is not.
:::

## 2. Latency is a distribution, not a number

%%Latency%% is the time from the user's action to the user's result. Not the
time your handler took. The whole round trip: the click, the request across the
network, your routing, your handler, your database, whatever external calls you
made, the response back, and the render.

Two requests to the same endpoint do not take the same time.

```text
  request A ──────  50 ms      hit the cache, server was idle
  request B ──────────────────────────── 200 ms
                               missed the cache, server was
                               already handling 50 other requests

  average    ─────────────── 125 ms      describes neither request
```

That average of 125ms is arithmetically correct and practically worthless. It
describes a request that never happened.

Now scale the same arithmetic up, because this is where it becomes dangerous.
You measure a thousand requests and the average comes out at 100ms. Excellent
number. Put it on a dashboard. But underneath it:

```text
  990 requests    completed under  50 ms
   10 requests    took            5000 ms

  average                          100 ms   ← looks healthy
```

At a million requests a day, that 1% is ten thousand real people staring at a
loading spinner for five seconds. The average hid all of them, and it will keep
hiding them no matter how bad they get, because ==an average is a summary that
deletes exactly the information you need==.

#### Percentiles

The fix is to stop summarising and start reporting the shape of the
distribution. A %%percentile%% names a latency and tells you what fraction of
requests came in under it.

| Metric        | Reads as        | Means                                     |
| ------------- | --------------- | ----------------------------------------- |
| `P50 = 400ms` | median          | Half of requests were faster than 400ms   |
| `P90 = 900ms` | 90th percentile | 10% of requests were slower than 900ms    |
| `P99 = 2s`    | 99th percentile | 1% of requests were slower than 2 seconds |

The useful mental move is to subtract from 100. P99 means one in a hundred. P95
means one in twenty. ==Say the fraction out loud and the number stops being
abstract==: "one request in twenty takes over two seconds" is a sentence
somebody will act on. "P95 is 2000" is not.

:::figure percentiles
The same thousand requests, drawn as a distribution rather than collapsed to a
mean. The long thin tail on the right is where your worst experiences live, and
it is the part the average is worst at describing.
:::

:::ask Where should latency be measured?
==At the client, not in the handler.== A handler that reports 40ms tells you
nothing about the 300ms the request spent queued in your load balancer, the
150ms of TLS handshake, or the 200ms of network to a user in another continent.
Server-side timings are for finding the bottleneck once you know there is one.
Client-side or synthetic timings are for knowing whether there is one. Mature
teams keep both and know they will not match.
:::

:::signal
"Our P99 is 2 seconds" is a better sentence than "our average is 100
milliseconds" even when both describe the same system, because only one of them
can be acted on. Quoting a percentile unprompted is one of the fastest ways to
sound like you have run something in production.
:::

## 3. Why P99 is your most valuable customers

There is an obvious reason to care about the slow tail: those are real users
having a bad time, and fairness alone says they count.

There is a second reason that is less obvious and more useful in an interview.

==The requests in your tail are not random.== They are slow for reasons, and the
reasons correlate with value. The request that fans out to three services, hits
a large join, calls the payment provider and waits on a webhook is slow _because_
it is doing something important. The request that returns a cached marketing
page is fast because it is doing nothing.

```text
  a fast request                     a slow request
  ──────────────                     ──────────────
  GET /health                        POST /checkout
  GET /static/logo.svg               POST /orders/:id/refund
  GET /products (cached)             GET /reports/annual
  browsing                           paying
```

So the population sitting at P99 skews towards **users doing the things you
charge for**. Optimising the median makes your marketing pages faster.
Optimising the tail makes your checkout faster.

:::signal
"We watch P99, not because of the average user, but because the tail correlates
with the expensive operations, which correlate with the paying customers." That
one sentence connects a performance metric to revenue, which is the connection
most candidates never make.
:::

#### The gap the lecture leaves: tail latency amplification

Here is something the lecture does not cover, and it is the single most
important consequence of caring about tails.

Suppose one request to your API fans out to ten internal services. Each of them
is well behaved: P99 of 100ms, meaning each is slow one time in a hundred. Your
overall request is only fast if ==every single one== of the ten is fast.

```text
  P(all ten fast)  =  0.99 ^ 10  =  0.904

  so roughly 1 request in 10 hits at least one slow call.
  a 1-in-100 event at the service level
  becomes a 1-in-10 event at the request level.
```

Your P90 is now determined by your dependencies' P99. Fan out to a hundred
services and it is worse than a coin flip.

:::key
!!Fan-out amplifies tails.!! Every extra service on the critical path multiplies
the chance of hitting somebody's bad day. This is why large systems obsess over
tail latency in ways that look paranoid from the outside, and it is the real
performance argument against chatty microservices, which we return to in
section 37.
:::

:::do Three fixes for an amplified tail

- ++Hedged requests.++ After waiting P95 for a reply, send the same read to a
  second replica and take whichever answers first. Costs a few percent extra
  load, cuts the tail hard.
- ++Fewer hops on the critical path.++ The cheapest fix by far. Every hop you
  remove removes its whole distribution.
- ++Aggressive per-call timeouts with a fallback.++ A degraded answer in 200ms
  usually beats a perfect answer in 3 seconds. Decide that in advance, per call.
  :::

## 4. Throughput, and the curve that bends

%%Throughput%% is how many requests your system completes per unit of time,
usually requests per second. Latency is about one request. Throughput is about
all of them.

You need both, because a latency number without a throughput number is
meaningless. "Our P99 is 150ms" invites the question "at what load?" A system
can be beautifully fast at 10 requests per second and fall apart at 1,000.

```text
   10 rps  →  P99  150 ms
  100 rps  →  P99  180 ms
  500 rps  →  P99  400 ms
 1000 rps  →  P99  2000 ms    ← same code, same query, same machine
```

Nothing in your application changed between the first row and the last. What
changed is that requests started waiting for each other.

This is the relationship to internalise, and it is not linear:

```text
  latency
    │                                          ╱
    │                                        ╱
    │                                      ╱
    │                              ______╱
    │        ______________──────
    │───────
    └───────────────────────────────────────── throughput
```

Flat, flat, flat, then a wall. ==Throughput does not degrade latency gradually.
It degrades it slowly and then all at once.==

:::ask Can I trade latency for throughput?
Yes, deliberately, and it is often the right call. Batching is the standard
example: waiting 10ms to collect writes and flushing them in one round trip
raises every individual request's latency by up to 10ms and can multiply total
throughput several times over. The same trade sits behind connection pooling,
group commit and the Nagle algorithm. ++State which one you are optimising for
before you tune anything++, because a change that helps one usually hurts the
other.
:::

## 5. Utilization and the knee

%%Utilization%% is the fraction of a resource's capacity currently in use. 0% is
idle, 100% is saturated. Its relationship with latency is the most
counterintuitive thing in this book, and the most useful.

The intuition first. It is Sunday evening at an ice cream shop and the shop is
empty. You order, you pay, you get your ice cream immediately. Now it is Tuesday
lunchtime and there are eleven people ahead of you. ==The server has not slowed
down at all.== Every cone still takes two minutes to make. But your wait went
from two minutes to twenty-four, and you did not get a worse ice cream, you got
the same ice cream later.

That is queueing, and it is the entire story of server latency under load. Your
CPU does not get slower as it gets busier. Requests just start waiting behind
other requests.

Now the number, which the lecture describes but never quantifies. For a simple
queue, the average time in the system relates to utilization like this:

```text
  wait multiplier  =  1 / (1 - u)          u = utilization

  u = 0.50   →   2x the idle service time
  u = 0.70   →   3.3x
  u = 0.80   →   5x
  u = 0.90   →   10x
  u = 0.95   →   20x
  u = 0.99   →   100x
```

Read the bottom of that table again. ==Going from 90% to 95% utilization does
not cost you 5% of anything. It doubles your latency.== And you got no warning
on the way, because from 0% to 60% the curve looks almost flat.

:::figure knee
Utilization against latency. The intuitive expectation is the straight line. The
truth is the curve, and the interesting region is narrow: everything between 0
and 60% looks the same, and everything past 85% is a different system.
:::

:::key
[[The knee]] is the point where the curve turns up, typically somewhere between
70% and 85% depending on how variable your traffic and your service times are.
==Below the knee, extra load costs you almost nothing. Above it, extra load
costs you everything.== Capacity planning is the practice of staying left of the
knee.
:::

:::signal
Saying "we run at about 60% CPU because the queueing curve gets vertical past
80" tells an interviewer you understand why the number is 60 rather than having
been told 60. The formula is `1/(1-u)`, it comes from queueing theory, and being
able to name it costs you one sentence.
:::

#### Little's Law, which is worth one line of memory

The other formula worth carrying, and again the lecture skips it:

```text
  L  =  λ  ×  W

  L  =  requests in the system  (concurrency)
  λ  =  arrival rate            (throughput, rps)
  W  =  time in the system      (latency, seconds)
```

It is exact, it needs no assumptions, and it settles arguments. If you serve 500
requests per second at 200ms each, you have 100 requests in flight on average.
That number tells you how many workers, connections, or threads you actually
need, and it is the fastest way to catch a wrong pool size.

:::ask We have 20 worker threads and P99 is climbing. Where do I start?
Little's Law. At 500 rps and 200ms you need 100 concurrent slots to keep up, and
you have 20. ==The threads are not slow, there are not enough of them==, and
every request beyond the twentieth is queueing before it starts. Either raise
concurrency, cut W, or shed load. Adding CPU will not help, because the CPU is
not what is scarce.
:::

## 6. Headroom, and why traffic arrives in bursts

If latency goes vertical near 100% utilization, then the practical rule follows
immediately: ==you cannot run a system at 100% utilization and also expect it to
work==. You need slack.

Production systems typically target 60% to 80% of capacity, reserving the rest
as %%headroom%%. That reserve is not waste. It is the thing absorbing the
difference between average load and actual load.

Because traffic does not arrive evenly.

```text
  what capacity planning assumes        what actually arrives
  ──────────────────────────────        ─────────────────────
  ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄              ▁▁▇█▁▁▁▁▁▁▅█▇▁▁▁▁▁▁▁▁█▇
  a steady 400 rps                      the same 400 rps on average
```

Traffic comes in %%bursts%%. A push notification goes out and thirty thousand
people open the app in the same four seconds. A cron job fires on the hour
across every tenant at once. Somebody's post gets traction. Your average for the
hour is comfortably under capacity and your peak second is triple it.

:::trap
!!Sizing for average load.!! It is arithmetically defensible and operationally
useless. You will be fine for fifty-nine minutes and down for one, and the one
is the minute somebody was checking out. Size for the peak you actually observe,
then keep headroom on top of that.
:::

#### The gap the lecture leaves: what to do when headroom runs out

The lecture stops at "keep a buffer". But buffers get consumed, and what happens
then decides whether you have a slow system or a dead one.

When demand exceeds capacity, the requests have to go somewhere. By default they
go into a queue: the socket backlog, the thread pool queue, the connection pool
wait list. And an unbounded queue under sustained overload is a machine for
converting a capacity problem into a total outage, because every request in it
ages until the client has already given up, and you spend your remaining
capacity computing answers nobody is waiting for any more.

:::do The two things you owe an overloaded system

- ++Bounded queues.++ Every queue gets a maximum depth. When it is full, reject
  immediately with 503 and `Retry-After`. ==A fast rejection is a better answer
  than a slow success no one is waiting for.== This is %%load shedding%%.
- ++Backpressure.++ Push the limit outward: bounded pools, a concurrency cap per
  endpoint, and a rate limit at the edge. The goal is that overload is felt at
  the boundary where you can decide what to drop, not in the middle where you
  cannot.
  :::

:::signal
"Under overload we shed load rather than queue it, because queueing turns a
degradation into an outage." Almost nobody says this in an interview. It is the
difference between having read about scaling and having been paged at 3am.
:::

:::recall Define latency, throughput and utilization in one sentence each, then give the wait multiplier at 80% and at 95%. | 6
:::

:::recall Write out Little's Law, and use it to size a worker pool for 800 rps at 250ms. | 5
:::

:::part II | Finding the bottleneck
Four sections on the discipline that makes the rest of the book safe to use.
Every technique after this part is expensive, and applying an expensive
technique to a problem you do not have is the most common way engineers waste a
quarter.
:::

## 7. Never guess. The week spent on the wrong fix

This is the story the whole lecture is built around, and it is worth telling
carefully because you have already lived some version of it.

There is an endpoint, `GET /products/:id`. It feels slow. What is the first
thought? The database. It is always the database. So you do what everyone does:
you add Redis, you put a cache in front of the query, you spend a week getting
invalidation right, you deploy it.

The endpoint is still slow.

So now, a week late, you do what you should have done first. You add timing
around every step:

```text
  GET /products/:id                                total  520 ms
  ├── routing and deserialization           2 ms
  ├── auth check                            3 ms
  ├── database query                       10 ms   ← the suspect
  ├── redis lookup                          5 ms   ← the week you spent
  └── audit log write to Elasticsearch    500 ms   ← the actual bottleneck
      (synchronous, blocking, in the request path)
```

The database was never the problem. It was 10ms. The cache you built saves 10ms
on a 520ms request, a 2% improvement, which is why it looked like it did nothing.
==The bottleneck was a logging call that nobody thought of as a network call.==

:::figure bottleneck
The measured request. Four of the five segments are rounding error. The one that
matters was not on anyone's list of suspects, and the fix everyone reached for
first targeted a segment worth 2% of the total.
:::

:::key
==Never guess. Always measure.== Not because guessing is unprofessional, but
because the bottleneck is almost never where you expect. If it were where you
expected, you would have fixed it already. The surprise is the whole point of
measuring.
:::

:::trap
!!"The database is slow."!! It is the reflex diagnosis and it is wrong more often
than it is right. Databases are the loudest component, so they get blamed. In
practice the culprits that actually show up are: a synchronous call to something
external, serialization of a large payload, an N+1 hidden inside an ORM, and a
response body big enough that the network transfer dominates. Any of those can
be the 500ms while your query sits at 10.
:::

:::signal
The senior move is not knowing more fixes. It is refusing to apply one until the
measurement points at it. "I would not add a cache until I could see the query
in a trace, because the last three times I have seen this, the time was
somewhere else."
:::

## 8. Profiling, and what a flame graph shows

%%Profiling%% is measuring where your process actually spends time. A profiler
attaches to the running application, samples the call stack many times a second,
and aggregates what it saw.

The raw output is thousands of functions with fractional percentages, which is
unusable. The %%flame graph%% makes it readable:

```text
  ┌──────────────────────────────────────────────────────────┐
  │                      handleRequest                       │  100%
  ├───────────────────────────┬──────────────────────────────┤
  │      serializeJSON        │        queryProducts         │
  │           58%             │             31%              │
  ├───────────────────────────┼──────────────┬───────────────┤
  │       stringify           │  buildQuery  │   execute     │
  └───────────────────────────┴──────────────┴───────────────┘

  width  = share of total time
  stacked = called by the frame below
```

Width is time. Stacking is the call relationship. You read it by scanning for
the widest block near the top and asking why that is wide.

And the first time you look at one of these for your own service, you will be
wrong about something. The expectation is that the complex business logic
dominates. The reality is often that you spend more time turning objects into
JSON than you spend computing the objects.

#### A correction to the lecture

The lecture says profilers are "not very good at IO bound tasks". That is close
but imprecise enough to trip you in an interview, so here is the sharper version.

```text
  CPU sampling profiler     samples only threads that are ON CPU.
                            a thread blocked on a socket is invisible.
                            → wrong tool for a slow database call.

  wall-clock profiler       samples all threads, running or blocked.
                            shows waiting as time.
                            → right tool, but noisier.
```

==It is not that profilers cannot see IO. It is that the default profiler is a
CPU profiler, and CPU profilers deliberately ignore waiting.== If your service
is mostly waiting, and most backend services are, a CPU profile will show you a
nearly idle process and tell you nothing.

:::do When to reach for a profiler

- ++Use it when CPU is high++ and you need to know which code is burning it:
  serialization, compression, crypto, image work, a regex with catastrophic
  backtracking.
- ++Do not reach for it first++ on a typical CRUD service. Your time is in
  waiting, and the next section has the right tool for that.
  :::

## 9. Distributed tracing, and why waiting needs it

Most backend latency is %%IO bound%%: waiting on a database, a queue, a cache,
an object store, another service. The work is not computing, it is waiting, and
waiting is what a trace measures.

%%Distributed tracing%% follows one request through every component it touches
and records when each stage started and ended. One request produces one trace,
made of nested %%spans%%.

```text
  trace: GET /orders/8f21                                  842 ms
  ├─ span  api-gateway                                     842 ms
  │  ├─ span  auth-service.verify                    ▉      18 ms
  │  ├─ span  orders.handler                         ▉▉▉▉▉ 800 ms
  │  │  ├─ span  db.select orders                    ▉      12 ms
  │  │  ├─ span  db.select line_items  (× 24)        ▉▉▉   310 ms   ← N+1
  │  │  └─ span  payments.getStatus                  ▉▉▉▉  470 ms   ← external
  │  └─ span  serialize response                     ▉      21 ms
```

That single picture answers the question the whole of Part II is about. The time
is in two places, an N+1 and an external call, and neither of them is "the
database is slow".

:::signal
The phrase to have ready is ==logs, metrics and traces==. Logs tell you what
happened in one component. Metrics tell you the aggregate shape over time.
Traces tell you where one request spent its life across components. They answer
different questions and you need all three. Naming the three and saying what
each is for is a complete answer to a very common interview question.
:::

:::ask Is tracing every request too expensive?
Yes, at volume, which is why nobody does it. You sample: typically 1% of normal
traffic plus 100% of anything that errored or exceeded a latency threshold, a
strategy called ++tail-based sampling++. You keep the interesting traces and
throw away the boring ones. The overhead of the instrumentation itself is
usually a low single-digit percentage, which is cheap compared to a week spent
guessing.
:::

:::trap
!!Averaging away the trace you needed.!! A dashboard showing mean span duration
per service has the same defect as any average: the one pathological request is
invisible. Keep the slow traces individually. The useful artifact is not "the
p99 of the payments span", it is ==one actual request that took 8 seconds, with
all its spans==.
:::

## 10. What to measure, in what order

A method, so that "measure first" is an instruction rather than a slogan.

:::do The order to work in

1. ++Confirm it is real.++ Which endpoint, which percentile, since when, at what
   throughput. If you cannot draw the graph, you do not have a problem yet.
2. ++Split the round trip.++ Client-observed total, minus server-observed total,
   is network and queueing. Knowing which side of that line the time is on
   eliminates half the possible causes immediately.
3. ++Get one slow trace.++ Not an aggregate. One real request that was slow, with
   its spans. This usually ends the investigation.
4. ++Attribute the time.++ Write down the segments and their milliseconds, like
   the table in section 7. Anything under 5% of the total is not your problem, no
   matter how ugly the code is.
5. ++Only now choose a technique.++ And check the arithmetic before you build:
   if the segment is 10% of the request, the best possible outcome of fixing it
   perfectly is a 10% improvement.
   :::

That last step has a name worth knowing, because it is the formal version of the
week wasted in section 7.

```text
  Amdahl's law:   the most a fix can help is bounded by
                  the share of total time it applies to.

  a segment worth  60%  of the time, made infinitely fast  →  2.5x  faster
  a segment worth  10%  of the time, made infinitely fast  →  1.1x  faster
  a segment worth   2%  of the time, made infinitely fast  →  unmeasurable
```

:::key
==Fixing a 2% segment perfectly gives you a 2% improvement.== The cache in
section 7 worked exactly as designed and was still a waste of a week, because
the segment it targeted was worth 10ms out of 520. Do this multiplication before
you start, not after you deploy.
:::

:::signal
"Before I optimise anything I want to know what share of the request it is,
because that bounds the best possible outcome." This is Amdahl's law stated as a
working habit rather than as a piece of trivia, and it is the single most
senior-sounding thing you can say about performance work.
:::

:::recall Name the four measurement tools and the question each one answers. Then give the five-step order. | 7
:::

:::redraw The measured request from section 7, with milliseconds on every segment. | Then mark which segment the team optimised, and calculate the improvement that fix could possibly have produced.
:::

:::part III | The database
Six sections. The database is blamed too often and is still, when it is
genuinely the problem, the highest-leverage place to work. This part is about
the three failures that account for most of it: a query shape, a missing index,
and a connection you paid for more times than you needed to.
:::

## 11. N+1: the shape, not the name

You are rendering twenty blog posts and each needs its author's name. The list
endpoint does not include authors. So:

```js
const posts = await db.select().from(postsTable).limit(20);

for (const post of posts) {
  // and here it is
  post.author = await db
    .select()
    .from(users)
    .where(eq(users.id, post.authorId));
}
```

Twenty posts, twenty-one queries. A hundred posts, a hundred and one. The name
%%N+1%% is literally the count: one query to get N things, then N queries to
decorate them.

```text
  items shown     queries issued
  ───────────     ──────────────
      20                21
     100               101
    1000              1001         ← at 5ms each, that is 5 seconds
```

Two things are wrong here, and the second is the one that matters.

The obvious one is the linear relationship. ==The number of round trips should
not scale with the number of rows on the page.== Any engineer feels that.

The less obvious one is what a round trip actually costs. It is not just the
query. Each one pays for network transit both ways, possibly a connection
acquisition, query parsing, planning, execution, and result serialization. A
query that the database executes in 0.2ms can easily cost 5ms end to end. The
overhead dominates, and you are paying it a thousand times.

:::do Fix it in one of two ways

- ++Join.++ One query returns posts with their authors already attached. Best
  when the relationship is simple and you want one round trip.
- ++Batch, then stitch.++ Collect all the author IDs, issue one
  `WHERE id = ANY($1)`, and map them back in application code. Two queries
  total, regardless of N. Best when the join would multiply rows awkwardly or
  the data comes from different stores.
  :::

Every ORM has primitives for this and every ORM makes the bug easy to write,
which is not a coincidence. The whole point of an ORM is that database access
looks like ordinary object access, and ordinary object access inside a loop
looks completely innocent.

| ORM        | The primitive                                   |
| ---------- | ----------------------------------------------- |
| Django     | `select_related` (FK), `prefetch_related` (M2M) |
| Rails      | `includes`                                      |
| Prisma     | `include`                                       |
| Drizzle    | `leftJoin`, or `with`                           |
| SQLAlchemy | `joinedload`, `selectinload`                    |

:::key
==An ORM hides the round trip, not the cost of it.== The fix is not to abandon
the ORM, it is to turn on query logging in development so the loop you wrote
shows up as twenty-one lines in your terminal while you are writing it, rather
than as a P99 six months later.
:::

:::ask Is N+1 always bad?
No, and saying so is a useful nuance. For N of three, on a warm connection, the
extra round trips cost microseconds and the batched version is harder to read.
++The problem is unbounded N.++ If N is the size of a page and pages are capped
at 50, you have a small constant. If N is "however many line items this order
has", you have a bug waiting for your largest customer. Ask what bounds N; that
is the real question.
:::

:::trap
!!Fixing N+1 by fetching everything up front.!! Replacing 100 small queries with
one query that returns 100,000 rows and 40 columns you do not use is not a fix.
You moved the cost from round trips to transfer and memory. Batch the specific
rows you need, by ID.
:::

## 12. Indexes: the catalogue, the tree, and the cost

Imagine a library with a million books and no catalogue. Someone asks for
everything by one author. Your only option is to walk the entire building and
look at every book. Three days later you hand them a box. Then the next person
asks the same question and you start again.

That walk is a %%sequential scan%%, also called a full table scan: read every
row, test each one, keep the matches. For a large table it is the difference
between a query taking 4 seconds and taking 40 milliseconds.

An %%index%% is the catalogue. Concretely it is usually a B-tree holding a
sorted copy of one column's values, each with a pointer to the row it came from.

```text
  posts table (unsorted, on disk)     index on author_id (sorted)
  ───────────────────────────────     ───────────────────────────
  row 1   author_id = 7                1 → row 4, row 812
  row 2   author_id = 3                3 → row 2, row 55
  row 3   author_id = 9                7 → row 1
  row 4   author_id = 1                9 → row 3, row 6, row 91
  ...     a million more               ...

  WHERE author_id = 9
    without index: read 1,000,000 rows, keep 3
    with index:    walk the tree, read 3 rows
```

Sorted order is the whole trick. It is what lets the database discard almost
everything without looking at it, and it is also why a B-tree index helps range
queries (`>`, `<`, `BETWEEN`) and `ORDER BY`, not just equality.

#### Indexes are not free

This is the part that gets skipped, and the part interviewers probe.

```text
  cost 1   space          the index is a second copy of that column,
                          plus pointers. large tables, large indexes.

  cost 2   write latency  every INSERT, UPDATE and DELETE must also
                          update every index on that table, in sync.
```

The second one is what bites. ==Indexes make reads faster and writes slower,
always.== A table with twelve indexes pays twelve tree updates on every insert.
Teams that respond to a slow read by indexing every column end up with a table
that reads beautifully and cannot be written to.

:::do How to decide what to index

- ++Index at design time only when it is obvious.++ Foreign keys you will
  filter or join on, columns with a uniqueness constraint, the column you sort
  every listing by. Postgres indexes the primary key for you; it does **not**
  index foreign keys for you, which surprises people.
- ++Index everything else from evidence.++ Wait for the trace that shows the
  slow query, then the `EXPLAIN ANALYZE` that shows the sequential scan, then
  index that column. Section 14.
- ++Periodically look for unused indexes and drop them.++ They are pure write
  cost. In Postgres, `pg_stat_user_indexes` tells you which ones have never been
  scanned.
  :::

:::signal
"Indexes trade write throughput for read latency" is the sentence. Candidates who
only know that indexes make things faster get caught by the follow-up: _so why
not index every column?_ Having the trade ready means the follow-up is not a
trap, it is your next sentence.
:::

Notebook 04, Postgres, sections 25 to 31 go considerably deeper on index types,
partial indexes, and building them without locking a live table.

## 13. Composite and covering indexes

Two refinements that come up constantly, and one rule that people get wrong.

#### Composite: one index over several columns

If you frequently query by `user_id` and sort by `created_at`, one index over
both beats two separate indexes.

```sql
CREATE INDEX idx_posts_user_created ON posts (user_id, created_at DESC);
```

==Order matters, and it is not symmetric.== The index is sorted by `user_id`
first, then by `created_at` within each user. So:

```text
  WHERE user_id = 7 AND created_at > '2026-01-01'    ✓ uses the index fully
  WHERE user_id = 7                                  ✓ uses the leading column
  WHERE user_id = 7 ORDER BY created_at DESC         ✓ index provides the sort
  WHERE created_at > '2026-01-01'                    ✗ cannot use it at all
```

The rule is the %%leftmost prefix%%: an index on `(a, b, c)` serves queries on
`a`, on `a, b`, and on `a, b, c`, and does nothing for a query on `b` alone.
Think of a phone book sorted by surname then first name; it is useless for
finding everyone called James.

:::do Choosing the column order
++Equality columns first, then the range or sort column.++ `WHERE user_id = ?
AND created_at > ?` wants `(user_id, created_at)`, not the reverse. Put the
column you filter to a single value in front, and the column you scan a range of
behind it.
:::

#### Covering: when the index is the answer

A query that only needs columns present in the index never has to visit the
table at all. This is an %%index-only scan%%, and the index is said to cover the
query.

```sql
CREATE INDEX idx_dept_name ON departments (name) INCLUDE (id);

SELECT id, name FROM departments WHERE name = 'Sales';
-- everything needed is in the index. the heap is never touched.
```

For a table with a hundred columns where the UI shows two, this can be a large
win: you read a narrow index instead of wide rows. The cost is the usual one,
a bigger index and more write amplification, so cover only the queries that
actually run hot.

:::ask Why did my index not get used?
Four common reasons, and having them ready is a strong answer. ++The column is
wrapped in a function++ (`WHERE lower(email) = ?` will not use an index on
`email`; index the expression instead). ++A leading column is missing++, per the
prefix rule above. ++The planner thinks a scan is cheaper++, which is often
correct on a small table or a low-selectivity predicate. ++Statistics are
stale++, so run `ANALYZE`. Notebook 04 section 29 works through each.
:::

## 14. EXPLAIN ANALYZE: deciding instead of guessing

You have a trace pointing at one slow query. Now you need to know why, and the
database will simply tell you.

```sql
EXPLAIN ANALYZE
SELECT p.id, p.title, u.name
FROM posts p JOIN users u ON u.id = p.author_id
WHERE p.published_at > now() - interval '7 days'
ORDER BY p.published_at DESC
LIMIT 20;
```

`EXPLAIN` shows the plan the planner chose. `ANALYZE` actually runs the query
and shows what really happened, which is the part you want, because planner
estimates and reality diverge and the divergence is usually the bug.

What you are scanning the output for:

```text
  Seq Scan on posts                     ← reading the whole table
    rows=1,240,000  actual time=980ms
                                        after adding the index:
  Index Scan using idx_posts_published  ← reading only what matches
    rows=340  actual time=1.2ms
```

```text
  read these, ignore the rest at first
  ────────────────────────────────────
  Seq Scan vs Index Scan     is it reading everything?
  rows= estimated vs actual  a 100x gap means bad statistics
  actual time=               where the milliseconds really are
  Nested Loop with high      the N+1 in disguise, inside one query
    loop count
```

:::do The loop that ends the argument

1. Run `EXPLAIN ANALYZE` on the slow query. Note the total and the scan type.
2. Add the index the plan implies.
3. Run it again. ==If the plan still says `Seq Scan`, the index is wrong, not the
   database.== Fix the index rather than adding a second one.
4. Check the write path did not regress, because you just added write cost.
   :::

:::signal
"I would `EXPLAIN ANALYZE` it before adding an index, because the planner will
tell me whether the index I am about to create would even be used." This closes
the loop between measuring and fixing, and it is the exact discipline Part II
was arguing for, applied to the one place where the tool is unambiguous.
:::

## 15. Connections are not free

On your laptop a database connection is instant and free, so you never think
about it. In production it is neither, and finding this out at 2am is common.

Here is what actually happens when your backend opens a connection:

```text
  1  TCP three-way handshake                    network round trips
  2  TLS negotiation                            more round trips, crypto
  3  authentication                             a lookup
  4  session state setup                        server-side bookkeeping
  5  the database allocates memory for it       several MB, per connection
```

Two consequences follow.

==If you open a connection per query and close it, you pay all five costs on
every query.== That is latency added to every single request, for nothing.

And the second, which is worse: connections are a bounded resource. A Postgres
instance is typically configured for a few hundred, because each one costs real
memory and a backend process.

```text
  max_connections = 300
  your traffic spikes to 5,000 concurrent requests
  each request opens a connection

  → connections refused, and the database is now the outage
```

:::key
==The database's connection limit is a hard ceiling that your application's
concurrency can trivially exceed.== A web tier scales by adding concurrency; a
database does not. The mechanism that reconciles those two facts is pooling, and
without it horizontal scaling eventually kills your database rather than
relieving it.
:::

## 16. Pooling, and the autoscaler that killed the database

A %%connection pool%% keeps a set of established connections open and lends them
out. Your code borrows one, runs a query, and returns it. The five setup costs
are paid once per connection, not once per query, and the pool size caps how
many can exist.

```text
  without a pool                    with a pool
  ──────────────                    ───────────
  query → open → run → close        query → borrow → run → return
  5 costs, every time               5 costs, once. then reuse.
  unbounded connections             a hard cap you chose
```

That solves both problems at once. But _where_ the pool lives turns out to
matter enormously, and this is the failure that catches people.

#### Internal pooling, and how it fails

Modern drivers pool for you, inside your process. That is fine with one server.
Now horizontally scale, and each instance brings its own pool.

```text
  instance A   pool max 150  ┐
  instance B   pool max 150  ├── 450 possible connections
  instance C   pool max 150  ┘

  database     max_connections = 300
```

Nothing is misconfigured from any single instance's point of view. Each one is
politely capped at 150. But the cap is per process, and ==the autoscaler adds
processes==. Traffic spikes, Kubernetes helpfully adds a third replica, the
three pools together ask for more than 300, and the database starts refusing
connections. The scaling event caused the outage.

:::figure pool
Three application instances, each correctly capped, summing past a limit none of
them can see. The fix is not a smaller per-instance cap, which just wastes
capacity when you have fewer replicas; it is a pool that knows the real total.
:::

#### External pooling

Put one pooler between all the instances and the database. For Postgres that is
usually PgBouncer.

```text
  A ─┐
  B ─┼──→  PgBouncer  ──→  Postgres
  C ─┘     (250 conns)     (max 300)

  every instance shares one budget. adding a replica does not add connections.
```

:::do Configuring this without surprises

- ++Use an external pooler once you autoscale.++ The moment instance count is
  dynamic, per-instance caps cannot add up to a safe number.
- ++Understand transaction mode.++ PgBouncer in transaction pooling mode gives
  you the best reuse, and !!breaks anything that assumes session state!!:
  session-level `SET`, advisory locks, prepared statements, `LISTEN/NOTIFY`.
  Know which your code relies on before you switch.
- ++Size it from Little's Law++, not from optimism. At 500 rps with 20ms of
  in-database time you need 10 concurrent connections, not 300. Oversized pools
  make the database slower, because the contention moves inside it.
  :::

:::trap
!!"More connections means more throughput."!! Past the point where the database
can keep its cores busy, additional connections add lock contention and context
switching and make everything slower. A pool of 20 frequently beats a pool of
200 on the same hardware. This is the utilization knee from section 5, wearing a
different hat.
:::

:::signal
"Each instance had a 150-connection pool, we autoscaled to three, and 450 hit a
300-connection limit" is a war story shape. If you have one of these, tell it.
Interviewers remember the candidate who explained how their own scaling event
caused their own outage, because it demonstrates you have operated something.
:::

:::recall The three database performance failures in this part, and the one measurement that identifies each. | 6
:::

:::recall Why does an index on (user_id, created_at) not help a query filtering only on created_at? | 4
:::

:::part IV | Caching
Five sections. Caching is the first thing everyone reaches for and the thing
most often applied to the wrong segment, as section 7 showed. This part assumes
you have measured, and covers what to decide once you have.
:::

## 17. What caching actually buys

The idea is almost too simple to state: store the result of an expensive
operation so you do not have to perform it again.

```text
  without                              with
  ───────                              ────
  request → complex query → 800 ms     request → cache hit → 50 ms
```

Sixteen times faster, for a lookup. That is the whole appeal, and it is real.

But notice what the arithmetic actually says. The cache did not make the query
faster. ==The query still takes 800ms every time it runs.== Caching bought you
the right to run it less often. Everything difficult about caching follows from
that one distinction, because "less often" means somebody has to decide when.

:::key
A cache is a bet that ==the data will be read more often than it changes==. When
that is true, a cache is close to free money. When it is false, you have added a
component, a failure mode, and a class of bug where users see data that is no
longer true, in exchange for nothing.
:::

:::do Before adding a cache, answer three questions

- ++What is the read-to-write ratio for this data?++ If it is 2:1, do not
  bother. If it is 10,000:1, cache it.
- ++How stale is acceptable, in seconds?++ If the answer is "not at all", you are
  not looking for a cache, you are looking for a faster query.
- ++What share of the request is this segment?++ Section 10. A cache on a 10ms
  segment of a 520ms request is a week of your life for 2%.
  :::

## 18. Invalidation: the second hard problem

There is a joke that the two hard problems in computer science are naming things
and cache invalidation. It survives because it is accurate. The difficulty is
structural: the cached copy and the real data are two things that must agree,
and nothing in the system enforces that they do.

Two strategies, and you will use both.

#### Time-based expiry

Set a %%TTL%%. After it elapses, the entry is gone and the next request
recomputes it.

```text
  SET user:42 {...} EX 300        valid for five minutes
```

Simple, self-healing, and requires no discipline anywhere else in the codebase.
The cost is that you have chosen your staleness in advance and you will
sometimes be wrong: too short and your hit rate collapses, too long and you
serve data users know is out of date.

#### Event-based invalidation

Delete the entry when the underlying data changes.

```js
await db.update(users).set({ name }).where(eq(users.id, id));
await cache.del(`user:${id}`); // must not be forgotten
```

Precise: no guessing at a TTL, no window of avoidable staleness. And the cost is
in that comment. ==Every code path that writes this data must remember to
invalidate.== Miss one, and you serve stale data indefinitely, with no TTL to
eventually rescue you. Six months later somebody adds an admin tool that updates
the row directly and nobody connects the bug report to it.

:::do Use both, deliberately
++Event-based invalidation for correctness, with a TTL underneath as a safety
net.++ The events keep it fresh; the TTL bounds how wrong you can be if an event
is missed. A five-minute TTL turns "stale forever" into "stale for at most five
minutes", which is the difference between a bug and an inconvenience.
:::

#### The gap the lecture leaves: cache stampede

The failure that TTLs create and nobody warns you about.

A popular key expires. In the next millisecond, four hundred concurrent requests
all miss, and all four hundred run the 800ms query at once.

```text
  t=0.000   TTL expires
  t=0.001   400 requests miss
  t=0.001   400 identical queries hit the database
  t=0.002   the database is the bottleneck it was cached to protect
```

This is %%cache stampede%%, or the thundering herd. It is worst for exactly the
keys you care most about, because popularity is what creates the pile-up. And it
tends to happen at the least convenient moment, because entries cached together
expire together.

:::do Three fixes, cheapest first

- ++Jitter the TTL.++ `300 + random(0..60)` seconds. One line, and it stops
  synchronised expiry, which is the most common form.
- ++Single-flight.++ The first request to miss takes a short lock and recomputes;
  the rest wait for its result or briefly serve the stale value. One query
  instead of four hundred.
- ++Stale-while-revalidate.++ Serve the expired value immediately and refresh in
  the background. Best perceived latency, and the right default for anything
  where a few seconds of staleness is harmless.
  :::

:::signal
Bringing up stampede unprompted when asked about caching is a strong signal,
because it is the failure you only meet in production. "We jitter TTLs and
single-flight the recompute, otherwise expiry of a hot key turns into a
self-inflicted load spike."
:::

## 19. Where the cache lives

Two options, and a third that is both.

#### Local: a map in your process

```text
  instance A   [ map ]  ──→ database
  instance B   [ map ]  ──→ database
  instance C   [ map ]  ──→ database
```

Fastest possible read: nanoseconds, no network, no serialization. And with three
instances you now have three caches that disagree. Invalidate on instance A and
B and C keep serving the old value until their own TTLs expire. ==The
inconsistency window is not a bug you can fix; it is the architecture.==

#### Distributed: Redis, Valkey, Memcached

```text
  instance A ─┐
  instance B ─┼──→ [ Redis ] ──→ database
  instance C ─┘
```

One copy, so one truth. Invalidation works. Every instance sees the same value.
The cost is a network round trip on every read, so you are trading roughly 2ms
of in-process lookup for maybe 1ms on a local network, and considerably more if
the hop crosses an availability zone.

|                   | Local                     | Distributed                   |
| ----------------- | ------------------------- | ----------------------------- |
| Read latency      | Sub-millisecond           | Network round trip            |
| Consistency       | Per instance, diverges    | One copy                      |
| Survives a deploy | No, memory is lost        | Yes                           |
| Capacity          | Bounded by process memory | Bounded by the cluster        |
| Failure mode      | Silent staleness          | A dependency that can be down |

#### Tiered: the small hot set locally, everything else shared

```text
  request → local map (hot set) → Redis (everything) → database
              ~0 ms                 ~1 ms               ~800 ms
```

The usual production answer. Keep a small local cache for the handful of keys
read constantly, back it with a shared cache, and give the local tier a short
TTL so the inconsistency window is measured in seconds.

:::ask What happens when Redis goes down?
The honest answer is what separates candidates. ==A cache in front of a database
that cannot survive a cache outage is not a cache, it is a load-bearing
dependency you have not budgeted for.== If your steady-state hit rate is 95%,
losing the cache means twenty times the query volume arriving at once, which
will take the database with it. Plan for it: fail open with a circuit breaker,
shed load while it recovers, and know from a load test whether your database can
take the cold-start traffic. Many teams discover the answer is no during the
incident.
:::

## 20. Three patterns: aside, through, behind

The pattern decides who writes to the cache, and when.

#### Cache-aside, also called lazy loading

```text
  read:    check cache → miss → query db → store in cache → return
  write:   write db → delete cache entry
```

The default, and what most people mean when they say caching. Only data actually
requested gets cached, and a cache failure degrades to a slow read rather than a
broken write. The cost is that every miss pays the full latency, and the first
request after any write always misses.

#### Write-through

```text
  read:    check cache → almost always hit
  write:   write db AND write cache, both before responding
```

The cache is never stale and reads essentially never miss. Writes get slower,
because you are doing two writes on the critical path, and you cache data that
may never be read.

#### Write-behind, also called write-back

```text
  read:    check cache
  write:   write cache → respond → write db asynchronously, later
```

The fastest writes by a wide margin, because the client waits only for the
cache. And the sharpest edge: !!there is a window where the cache holds data the
database does not.!! If the process dies in that window, the write is gone, and
you already told the user it succeeded.

| Pattern       | Read                    | Write               | Use when                                      |
| ------------- | ----------------------- | ------------------- | --------------------------------------------- |
| Cache-aside   | Miss costs full latency | DB, then invalidate | Almost always. Start here                     |
| Write-through | Near-always hit         | Slower, two writes  | Reads dominate and staleness is unacceptable  |
| Write-behind  | Near-always hit         | Fastest             | Write-heavy, and losing a write is survivable |

:::trap
!!Reaching for write-behind because it is the fastest.!! It is fastest because it
lies to the client about durability. That is a legitimate trade for a view
counter and a firing offence for a payment. ++The question is never which is
fastest, it is what you can afford to lose++, and you should say so out loud
when asked.
:::

## 21. Hit rate, and the four things that move it

%%Cache hit rate%% is the fraction of lookups served from the cache. It is the
one number that tells you whether the cache is working.

```text
  90%  hits → good. one request in ten reaches the database.
  70%  hits → workable, worth tuning.
  20%  hits → you have added a component and a bug surface for nothing.
```

A 20% hit rate is worse than no cache at all: you pay the lookup, miss, pay the
query anyway, and pay the write to store a result that will expire before it is
read again.

Four levers, in the order worth pulling them:

:::do

1. ++Understand the access pattern.++ The biggest lever by far and the one people
   skip. Caching works because access is skewed: a small set of keys gets most
   of the traffic. If your access is uniform, no cache size will save you, and
   the answer is a faster query, not a cache.
2. ++TTL.++ Longer TTL raises hit rate and staleness together. This is a dial
   between two things you want, and there is no setting that gives you both.
3. ++Size.++ More memory holds more keys and evicts less. Watch the eviction
   rate: if you are evicting heavily, you are paying to store things you throw
   away before they are read.
4. ++Eviction policy.++ LRU is the sane default. LFU suits a stable hot set that
   would otherwise be flushed by a scan.
   :::

:::signal
"Our hit rate is 94%, and the misses are almost entirely first-request-after-
write, which is expected for cache-aside" says three things at once: you measure
it, you know what number is good, and you know _why_ your misses happen. That
last one is the rare part.
:::

:::recall Two invalidation strategies, one failure of each, and what stampede is. | 6
:::

:::recall Three caching patterns, and the one thing write-behind risks that the others do not. | 5
:::

:::redraw The tiered cache: local, distributed, database, with realistic latencies on each hop. | Then mark where a stampede happens and which of the three fixes you would apply first.
:::

:::part V | More machines
Five sections. Everything so far made one machine do less work. This part is
about what happens when one machine is not enough, and about the property your
code has to have before more machines help at all.
:::

## 22. Vertical scaling, and its three ceilings

Your traffic grows and the server runs out of room. There are exactly two
answers to that, and this is the simpler one.

:::term Vertical scaling
Making one machine bigger. Also called scaling up. You replace a server with a
more powerful server: more CPU cores, more RAM, faster disks, a better network
card. Your code does not change and your architecture does not change; only the
size of the box does.
:::

```text
  before                 after
  ──────                 ─────
  4 cores                16 cores
  8 GB RAM               64 GB RAM
  SSD                    NVMe SSD
  1 Gbps                 10 Gbps
```

The appeal is that ==nothing about your system has to be redesigned==. No load
balancer, no session store, no distributed state, no new failure modes. You
click a bigger instance type and reboot. Twice the CPU handles roughly twice the
requests, twice the RAM caches roughly twice the data, and the arithmetic is
about as honest as arithmetic gets in this field.

It is also often cheaper than it looks. One machine of size 2N usually costs
less than two machines of size N, and it costs far less operational attention:
one thing to patch, one thing to monitor, one thing to back up.

So why does anyone do anything else? Three ceilings.

:::do The three limits of vertical scaling

1. ++There is a biggest machine.++ Every cloud provider has a largest instance
   type. When you reach it, you are done; there is no next step, at any price.
2. ++It is a single point of failure.++ One very powerful machine that is down is
   still down. Standby servers and automatic failover reduce this, and do not
   remove it.
3. ++It exists in one place.++ A server in Virginia serves users in Mumbai
   across 200ms of physics that no upgrade can buy back. Section 31.
   :::

:::signal
++Start vertical.++ It is genuinely the right first answer for most systems, and
saying so is a stronger signal than reaching for a distributed architecture,
because it shows you weigh complexity as a cost. "I would scale up until either
we hit the instance ceiling or we need multi-region, because the moment we go
horizontal we inherit a distributed systems problem we did not have."
:::

## 23. Horizontal scaling, and the bill it comes with

:::term Horizontal scaling
Adding more machines of the same size rather than one larger machine. Also
called scaling out. Instead of one server handling all traffic, several
identical servers each handle a share of it, coordinated by a load balancer in
front.
:::

```text
        ┌──→ instance A
  LB ───┼──→ instance B
        └──→ instance C
```

The theoretical wins are real and they are the mirror image of the three
ceilings:

- **No hard limit.** One instance takes 1,000 rps, five take 5,000. Add more.
- **Redundancy.** One instance dies and the other two absorb its traffic. The
  system degrades instead of stopping.
- **Geography.** Instances can live in different regions, and a request can be
  routed to the nearest one.

Now the bill, because every one of those wins is bought with a question you now
have to answer:

```text
  how do requests get distributed?          → a load balancer, and an algorithm
  how do instances share state?             → externalise all of it. section 24
  how do you know an instance is dead?      → health checks. section 26
  what happens when the network between
    them fails?                             → they make conflicting decisions
  when do you add and remove instances?     → autoscaling, section 38
```

:::key
==Distributed systems do not remove problems. They trade one set of problems for
another.== You give up "my server is too small" and receive "my servers disagree
about what is true". Sometimes that is a much better trade. It is never a free
one, and an interviewer is listening for whether you know that.
:::

#### The gap the lecture leaves: linear scaling is a lie you should price in

"Five servers give five times the throughput" is the pitch. It is never quite
true, and knowing why is a strong signal.

```text
  ideal        │                                    ╱
               │                                  ╱
  real         │                            ____╱‾‾‾‾‾───___
               │                        ___╱                 ‾‾‾──
               │                    ___╱
               └──────────────────────────────────────────── instances
```

Two forces bend the line. **Contention**: the shared thing everybody still
queues for, which is usually the database. **Coherence**: the cost of keeping
instances in agreement, which grows faster than linearly because it is pairwise.
Past some count, adding a machine makes the system slower.

:::trap
!!Assuming the bottleneck moved because you added servers.!! If ten instances all
talk to one database, ten instances are ten times the pressure on the one thing
you did not scale. ==Horizontal scaling of the stateless tier relocates the
bottleneck to the stateful tier==, which is what Part VI is about.
:::

## 24. Statelessness is the price of admission

Horizontal scaling works for exactly one reason: any instance can serve any
request. The moment that stops being true, the whole scheme breaks in ways that
look like haunted-house bugs.

:::term Stateless
A server is stateless when it holds no data that only it has. Every request can
be served by any instance, because everything needed to serve it comes with the
request or from shared storage. Note that stateless does not mean there is no
state; it means the state lives somewhere all instances can reach.
:::

Here is the failure, and it is the most common one in the industry:

```text
  1  user logs in → load balancer sends them to instance A
  2  instance A creates a session, stores it in its own memory
  3  next request → load balancer sends them to instance B
  4  instance B has never heard of this session
  5  401. the user is thrown back to the login screen.
```

Nothing is broken. Every line of code works. The user is logged in and logged
out at random depending on which machine answered, and it will be intermittent,
which is the worst kind of bug to be handed.

The fix is always the same shape: ==take the thing that lives in one instance
and put it where every instance can reach it.==

| Stored in the instance               | Move it to                                             |
| ------------------------------------ | ------------------------------------------------------ |
| Sessions in a local map              | Redis, or a signed token the client carries            |
| Uploaded files on local disk         | S3 or another object store                             |
| A local cache                        | A shared cache, or accept a short inconsistency window |
| SQLite on the local filesystem       | Postgres, or any networked database                    |
| In-memory rate limit counters        | Redis, with atomic increments                          |
| Scheduled jobs on a timer in-process | A queue, or a leader-elected scheduler                 |

That last row catches people: three instances each running a cron loop means
your nightly email goes out three times.

:::ask What about sticky sessions?
They work and they are a trap. %%Session affinity%% pins a user to one instance
so the local session keeps working, which lets you skip the refactor. The costs:
load stops being balanced (one instance gets all the heavy users), an instance
dying logs out everyone pinned to it, and ==you cannot deploy without dropping
sessions==. Autoscaling makes all three worse, because instances come and go by
design. It is a legitimate short-term bridge and a bad destination, and saying
exactly that is the answer.
:::

:::signal
"Horizontal scaling is not an infrastructure change, it is a code change." Most
candidates describe it as adding servers. Describing it as ==externalising
state== shows you know where the actual work is, and it explains why the
migration takes a quarter rather than an afternoon.
:::

## 25. The load balancer, and five algorithms

:::term Load balancer
A component that sits in front of your servers, receives every incoming request,
and forwards it to one of them. It also returns the response to the client, so
clients only ever see one address. Every horizontally scaled system has one.
:::

The interesting part is not the forwarding, it is the choice. Five algorithms,
in rough order of how much they know.

#### Round robin

Requests go to instances in rotation: A, B, C, A, B, C.

```text
  R1 → A     R2 → B     R3 → C     R4 → A ...
```

Perfect when requests cost roughly the same and servers are roughly identical.
The failure is skew. Suppose two request types: a 200ms read and a 2s write. A
rotation is blind to the difference, so a run of expensive requests can land on
one instance and take it down while the other two are idle.

#### Weighted round robin

Same rotation, but a bigger server gets proportionally more. An instance with
twice the CPU takes two requests per cycle instead of one. Fixes uneven
hardware; does nothing about uneven requests.

#### Least connections

Send the next request to whichever instance currently has the fewest requests in
flight.

```text
  A  [████████ 2s request, still open]   1 active
  B  []                                  0 active   ← next request goes here
  C  []                                  0 active
```

This is the first algorithm that is aware of cost, and it is aware of it in a
clever indirect way: ==an expensive request holds its connection open longer, so
the instance handling it automatically looks busier.== You do not have to
classify requests; the duration does it for you. For mixed workloads this is
usually the right default.

#### Least response time

Track how fast each instance is actually answering and favour the quick ones. A
struggling instance receives less traffic, which gives it room to recover.
Guards against the instance that is slow but not dead.

#### Resource-based

The load balancer reads real CPU and memory from each instance and routes on
that. Most accurate, most operationally involved, and it needs an agent
reporting metrics.

:::do Choosing
++Round robin for uniform work, least connections for anything else.++ That
covers the large majority of real systems. Reach past those two only when you
have a measurement showing the imbalance they leave.
:::

#### L4 and L7, which the lecture does not separate

Worth knowing because interviewers ask it and the answer is short.

```text
  L4  transport layer   routes on IP and port. does not read the request.
                        fast, cheap, protocol-agnostic.
                        cannot route by URL. cannot terminate TLS meaningfully.

  L7  application layer routes on the HTTP request itself: path, host, headers,
                        cookies. terminates TLS. can retry, rewrite, rate limit.
                        this is what nginx, HAProxy, ALB and Envoy do.
```

==Anything that routes `/api` to one service and `/images` to another is
operating at L7, because it had to read the URL to decide.==

## 26. Health checks, and the server that is up but dead

A load balancer that does not know an instance is broken will keep sending it
traffic. Round robin is loyal that way: one instance in three is returning 502
and the algorithm keeps handing it a third of your users.

:::term Health check
A request the load balancer sends to each instance on a schedule, purely to find
out whether it is working. A healthy instance answers 200. An instance that
fails is removed from rotation until it starts answering again.
:::

```text
  every 2s:  LB → GET /healthz → instance

  200        keep it in rotation
  500 / timeout / connection refused
             remove it. stop sending user traffic.
             keep probing, so recovery is detected automatically.
```

The loop is self-healing in both directions, which is the important property:
nobody has to notice the failure, and nobody has to remember to put the instance
back.

#### Liveness and readiness are different questions

The distinction that actually matters in production, and it is missing from most
introductions:

```text
  liveness    "is this process alive?"
              failing → restart the container.

  readiness   "should this instance receive traffic right now?"
              failing → remove from the load balancer. do not restart.
```

They come apart constantly. An instance that has just started and is still
warming its connection pool is alive but not ready. An instance whose database
connection has dropped is alive but should not receive traffic. ==Wiring a
readiness failure to a restart turns a recoverable blip into a crash loop==, and
wiring a liveness check to a database query means one database hiccup restarts
your entire fleet at once.

:::do Write the check properly

- ++Make `/healthz` shallow and cheap.++ It runs every couple of seconds against
  every instance, forever. It should not query the database.
- ++Make readiness check dependencies, and only the ones you cannot serve
  without.++ If your service can serve 80% of its endpoints without the
  recommendations API, its readiness must not depend on it.
- ++Fail readiness during shutdown, before you stop accepting connections.++ Stop
  taking new traffic, drain in-flight requests, then exit. Otherwise every
  deploy drops requests. Notebook 13 covers graceful shutdown in full.
  :::

:::trap
!!A health check that queries the database.!! It looks thorough. Then the
database has a two-second hiccup, every instance fails its check simultaneously,
the load balancer removes all of them, and a transient database problem becomes
a total outage. ==Shared dependencies make health checks correlated==, and
correlated health checks fail the whole fleet at once.
:::

:::recall Name the three ceilings of vertical scaling, and the four questions horizontal scaling forces you to answer. | 7
:::

:::recall Five load balancing algorithms. Which one handles mixed request costs without being told about them, and how? | 6
:::

:::redraw The horizontally scaled stack: clients, load balancer, three instances, and every piece of externalised state. | Mark which box each of session data, uploaded files, and cached values must live in, and why.
:::

:::part VI | The stateful part
Four sections. Scaling the application tier is mostly a matter of externalising
state and adding machines. The place you externalised it to is now the thing
that cannot be duplicated casually, and this part is about what people do about
that.
:::

## 27. Read replicas

Once your instances are stateless and behind a load balancer, you can add as
many as you can afford. All of them talk to one database, and that database is
now taking the entire pressure of a tier you just made arbitrarily wide.

:::term Read replica
A copy of your database that receives a continuous stream of changes from the
main instance and serves read queries only. Writes still go to one place. Also
called a follower, a secondary, or a standby.
:::

:::term Primary
The one database instance that accepts writes. Every change is made here first
and then propagated to the replicas. Older documentation calls it the master or
the leader; the concept is identical.
:::

```text
                  writes
  app instances ──────────→  PRIMARY
                                │  replication stream
                                ├──────→ replica (Mumbai)
      reads ────────────────────┼──────→ replica (Frankfurt)
                                └──────→ replica (Singapore)
```

Two things this buys you.

**Load.** Most applications read far more than they write. If reads are 80% of
your queries and they all move to replicas, ==your primary's query load drops by
80%== without you having optimised a single query.

**Latency.** A replica in Mumbai serving Indian users is a few milliseconds
away. The primary in Virginia is 200ms away. For reads, geography stops being a
tax.

:::ask What read-write ratio should I assume?
Do not assume; measure it, and say so. The usual claim is 90/10 or 80/20, and it
is true for content-heavy applications and false for plenty of others. An
analytics ingest pipeline can be 95% writes. An internal admin tool can be
50/50. ==Read replicas only help in proportion to how read-heavy you actually
are==, and quoting a measured ratio for your own system is a much better answer
than quoting the industry average.
:::

:::trap
!!"Replicas make my database highly available."!! Not by themselves. If the
primary dies, writes stop, and something has to promote a replica to primary,
update every client's idea of where to write, and guarantee that no two
instances think they are the primary at once. That machinery is %%failover%%,
and it is a separate feature with its own failure modes. Replication gives you
read capacity; failover gives you availability, and they are not the same
purchase.
:::

## 28. Replication lag, and the read-after-write bug

Replication is not instant. Data written to the primary takes time to reach a
replica, and that time has a name.

:::term Replication lag
The delay between a write committing on the primary and that write becoming
visible on a replica. Typically milliseconds within one region and can be
hundreds of milliseconds across continents, because it is bounded by the speed
of light through undersea cable.
:::

Now here is what that does to a completely ordinary user interaction:

```text
  t=0ms     user in Mumbai edits their name: "Ana" → "Anaya"
  t=0ms     PATCH /profile  → routed to the PRIMARY in Virginia. committed.
  t=5ms     200 OK returns to the browser
  t=6ms     the SPA immediately fires GET /profile to refresh the form
  t=8ms     the read goes to the MUMBAI REPLICA
  t=8ms     the replica has not received the change yet

            the form redraws showing "Ana"
```

The user pressed save, got a success message, and watched their change
disappear. Nothing failed. Every component did exactly what it was designed to
do, and the result is a bug report that says "saving does not work" and cannot
be reproduced by anyone on the same continent as the primary.

:::figure replica-lag
The write goes east, the read comes back from the local replica, and the two
cross in the middle. The window is small and the user interface is fast enough
to land inside it every time.
:::

This is the %%read-after-write%% problem, and it is the single most common way
read replicas break an application.

:::do Four fixes, in the order to try them

1. ++Route reads to the primary for a short window after a write.++ Sticky for
   a few seconds, keyed on the user or session. Simplest, and it fixes the case
   that actually occurs.
2. ++Return the written object in the write response.++ The `PATCH` already
   knows the new state, so `RETURNING` it means the client never needs the
   follow-up read at all. ==This deletes the problem instead of managing it==,
   and it is usually the best answer.
3. ++Wait for the replica to catch up.++ Track the write position and have the
   read block until the replica has reached it. Correct, and it converts a
   consistency bug into a latency cost.
4. ++Change the interface.++ Optimistic UI: show what the user typed, since you
   already know the write succeeded. Costs no backend work at all.
   :::

:::key
==Every distributed system trades consistency for something, and the trade
shows up in the user interface, not in the architecture diagram.== The right
question is never "is this consistent?" but "which reads can tolerate being a
few hundred milliseconds stale, and which cannot?" Profile pages can. Account
balances cannot.
:::

:::signal
"Read replicas give you eventual consistency, so I would send read-after-write
back to the primary for a few seconds, or return the object from the write and
skip the read entirely." Naming the failure and giving two fixes with a
preference is a complete senior answer to a very common question.
:::

## 29. Sharding, and the key that is hard to choose

Replicas scale reads. They do nothing for writes, because every write still goes
to one primary, and they do nothing for a table that has become too large to
query quickly. For those you need to split the data itself.

:::term Sharding
Splitting one logical table across several physical databases, so that each one
holds a different subset of the rows. Also called horizontal partitioning. Each
piece is a shard, and no shard holds the whole table.
:::

:::term Shard key
The column whose value decides which shard a row lives in. Choosing it is the
whole design, because it determines how evenly data spreads, which queries stay
fast, and which queries become impossible.
:::

```text
  one orders table, 10 billion rows
                    │
        ┌───────────┴───────────┐
   shard 1                  shard 2
   user_id 1..500M          user_id 500M..1B
   5 billion rows           5 billion rows
```

Two wins at once. Each shard holds fewer rows, so queries against it are faster.
And each shard is a separate machine, so total write capacity multiplied.

#### Choosing the key, where the lecture is loose

The lecture suggests sharding orders by date: January to June on one instance,
July to December on the other. That is a clean way to explain the mechanism and
==a poor sharding key in practice==, and knowing why is exactly the kind of
detail an interview probes.

```text
  sharded by order_date
  ─────────────────────
  shard 1   Jan-Jun    ▁▁▁▁▁   cold. nobody writes to the past.
  shard 2   Jul-Dec    ██████  every single new order lands here.

  → you have two machines and one of them is doing all the work.
```

That is a %%hot shard%%. You paid for distribution and got none, because time
only moves in one direction.

| Strategy           | Spreads writes                     | Range queries                | Watch out for                   |
| ------------------ | ---------------------------------- | ---------------------------- | ------------------------------- |
| Hash of `user_id`  | Evenly                             | Lost, hashing destroys order | Resharding is painful           |
| Range of `user_id` | Unevenly, early users cluster      | Preserved                    | Hot shard on new signups        |
| Range of date      | Terribly, all writes on the newest | Excellent                    | The hot shard above             |
| Geography          | By population                      | Within a region              | Regulatory upside, uneven sizes |

:::do How to actually choose

- ++Shard by the thing you filter on most.++ If nearly every query says
  `WHERE user_id = ?`, shard on `user_id`. Queries then hit exactly one shard,
  which is the entire point.
- ++Hash it unless you need ranges.++ Hashing spreads writes evenly. Only use
  range sharding when scanning a contiguous range is a query you actually run.
- ++Make sure the key is on every hot query.++ A query that does not include the
  shard key must be sent to every shard and the results merged. That is a
  %%scatter-gather%%, and it is as slow as the slowest shard.
  :::

#### The three costs nobody mentions up front

```text
  cross-shard joins       two shards, two machines. the join now happens in
                          your application code, or not at all.

  cross-shard transactions  ACID across machines needs two-phase commit or
                          sagas. both are hard and both are slow.

  resharding              going from 4 shards to 8 means moving billions of
                          rows while serving traffic. plan it before you need
                          it, or use consistent hashing so the move is partial.
```

:::key
==Shard last.== It is the least reversible decision in this book. Before it:
index properly, cache, add replicas, archive old rows, upgrade the instance, and
consider whether one table needs to be one table. Teams that shard early spend
years working around a key they picked in a hurry.
:::

## 30. Distributed databases: rent, do not build

Every problem in the last two sections has been solved, repeatedly, by people
who do nothing else. You can now buy the solution.

:::term Distributed database
A database that handles replication, sharding and failover internally, so the
application sees one logical database while the data lives across many machines.
Examples: CockroachDB, Vitess and PlanetScale for MySQL, Neon and Aurora and
Yugabyte for Postgres, Spanner on Google Cloud.
:::

The pitch is that sharding, replication, rebalancing and failover become
configuration rather than architecture. You get a connection string. Behind it
the system splits ranges, moves them between nodes, keeps replicas current and
promotes one when a node dies.

:::do The realistic position for a backend engineer
++Do not build your own database infrastructure.++ Not the replication, not the
sharding logic, not the failover, not the backups. Use a managed provider and
spend the saved time on your own product. ==But know every term in this part
anyway==, because you still have to decide how many replicas, in which regions,
with what backup schedule, sharded on which key. The concepts are not optional;
the implementation is.
:::

:::signal
"I would not run my own Postgres." said plainly, without embarrassment, is a
sign of experience rather than a gap in it. Follow it with what you _would_
still own: the schema, the shard key, the index strategy, the region layout, and
a tested restore. ==Managed does not mean unowned==, and the fastest way to
prove that is to ask when the team last practised a restore.
:::

:::recall What does a read replica scale, what does it not scale, and what is the bug it introduces? | 6
:::

:::recall Why is order_date a poor shard key for an orders table, and what would you use instead? | 5
:::

:::part VII | Moving work in space and time
Five sections. There are two kinds of latency you cannot optimise away: the
distance between the user and your server, and the work that genuinely has to
happen. This part moves the first closer and the second later.
:::

## 31. The speed of light, and the latency budget

Everything else in this book is an engineering problem with an engineering
answer. This one is not.

Light in fibre travels at roughly 200,000 km/s, about two thirds of its speed in
vacuum, because the glass slows it. That number is a hard floor under every
request that crosses a distance.

```text
  Tokyo  ←──────────────────────────────→  Virginia (us-east-1)
                  ~10,000 km each way

  round trip  =  20,000 km ÷ 200,000 km/s  =  100 ms

  no cache, no index, no upgrade, no CDN provider, and no amount of money
  makes this number smaller. it is the distance divided by the speed of light.
```

That 100ms is spent before your server has read a single byte. Now add
everything else:

:::figure budget
The latency budget for one request from Tokyo, drawn to scale. The ringed sliver
is the only part that is code you wrote. The block on the left is physics and
the wide one on the right belongs to somebody else.
:::

```text
  network round trip, Tokyo → Virginia         100 ms   ← cannot be changed
  TLS handshake (new connection)                50 ms   ← reusable
  routing and deserialization                    5 ms
  business logic                                10 ms   ← the part you tune
  database query                                50 ms
  external API call                            200 ms   ← someone else's P99
  serialization                                 20 ms
  ──────────────────────────────────────────────────
  total                                        435 ms
```

Two lessons fall out of that table.

==The segment engineers spend the most time optimising is 10ms of 435.== The
business logic, the thing you actually wrote, is 2% of the request.

And ==the largest single item is geography, which no code change touches==. That
is the entire justification for the next two sections.

:::signal
Being able to say "a round trip from Singapore to Virginia is roughly 200
milliseconds before we do anything, so this endpoint cannot be under 250 for
those users no matter what we optimise" is a physics argument in an engineering
conversation. It reframes the problem from "make it faster" to "move it closer",
which is the correct reframe and the one most candidates never reach.
:::

## 32. CDNs: what goes on one

If the distance is the problem, put a copy of the answer near the user.

:::term CDN
Content delivery network. A large fleet of servers spread across the world, each
holding cached copies of your content, so a request is served from a machine
near the user instead of from your origin server. The individual locations are
called edge nodes or points of presence, PoPs.
:::

```text
  without a CDN                    with a CDN
  ─────────────                    ──────────
  Tokyo user → Virginia            Tokyo user → Tokyo PoP
  20,000 km, 100 ms                ~100 km, 2-3 ms
```

From 100ms to 3ms. In human terms both are instant; in scaling terms it is a
thirtyfold reduction on the largest line item in the budget above.

Latency is the obvious win. Two more come with it:

**Load.** Every request the CDN serves is a request your origin never sees. For
a content-heavy site that can be most of the traffic, and it is why a CDN often
delays the need for horizontal scaling entirely.

**Absorption.** A large CDN has vastly more capacity than you do, so it absorbs
traffic floods, whether those are a launch or an attack. Notebook 05 covers the
security side.

#### What is worth putting on one

```text
  always            JS bundles, CSS, images, video, fonts, anything with a
                    content hash in its filename. these never change, so they
                    can be cached effectively forever.

  often             HTML for static or rarely-changing pages, product catalogue
                    pages, public API responses that are the same for everyone.

  carefully         personalised or authenticated responses. cache these only
                    with a cache key that includes the user, or not at all.

  never             anything where serving a stale answer is a correctness
                    problem: balances, inventory counts at checkout, auth
                    decisions.
```

:::term Purging
Explicitly removing content from a CDN's caches before its TTL expires, so the
next request fetches a fresh copy from your origin. Also called invalidation.
Most providers support purging by URL or by a tag you attached when the content
was cached.
:::

:::do The two patterns that make CDN caching safe

- ++Immutable filenames for assets.++ `app.4f2a9c.js`. The content hash is in the
  name, so a new deploy is a new URL and there is nothing to invalidate. Cache
  it for a year. ==This eliminates CDN invalidation for static assets
  completely==, and it is why every modern bundler does it.
- ++Tag-based purging for dynamic content.++ Tag a cached page with the IDs it
  depends on (`user:42`, `post:918`). When that data changes, purge the tag and
  every page built from it goes at once, with no list to maintain.
  :::

:::trap
!!Caching a response that varies by user without varying the cache key.!! The
classic and genuinely dangerous CDN bug: one user's authenticated page gets
cached and served to everyone who asks for that URL. ++If a response depends on
a cookie or an `Authorization` header, either include it in the cache key or set
`Cache-Control: private, no-store` and mean it.++
:::

## 33. The edge, and what it cannot do

A CDN traditionally returns files. Edge computing runs code in those same
locations.

:::term Edge computing
Running your own code on the CDN's nodes rather than at your origin, so a
response can be computed close to the user instead of merely served from cache.
Cloudflare Workers, Lambda@Edge, Deno Deploy and Vercel Edge Functions are the
common platforms.
:::

The reason it is fast is not that the computation is faster. It is the same
computation. ==What changes is that the 100ms round trip is replaced by a 3ms
one==, so a cheap computation that used to cost 105ms now costs 8ms.

#### The example that pays for itself

Rejecting unauthenticated requests.

```text
  at the origin                     at the edge
  ─────────────                     ───────────
  request → 100 ms → origin         request → 3 ms → edge node
  check session                     check session
  401 → 100 ms → user               401 → 3 ms → user

  200 ms to say no                  6 ms to say no
  and your origin was disturbed     and your origin never heard about it
```

The user gets their answer thirty times faster and your origin only ever sees
requests that are already valid. Personalisation by geography or language, A/B
bucketing, redirects and bot filtering all have the same shape: a cheap decision
that determines whether the expensive path runs at all.

#### Why not run everything there

Edge runtimes are constrained by design, and the constraints are the answer to
"why not just deploy the whole app to the edge?"

```text
  small machines      CDN nodes are ISP-adjacent infrastructure sized for
                      routing, not for compute. tight memory and CPU limits.

  restricted runtime  Cloudflare Workers run V8 isolates: no filesystem, no
                      arbitrary TCP, limited native modules, short CPU budgets.

  far from your data  the edge is 3 ms from the user and often 100 ms from your
                      database. a request that queries Postgres has moved the
                      round trip, not removed it.
```

:::key
That last one is the trap. ==Moving compute to the edge only helps if the data
it needs is also at the edge.== An edge function that makes three sequential
calls to a database in Virginia is slower than an origin server sitting next to
that database. The edge is for decisions you can make from the request itself,
plus something small and globally replicated.
:::

## 34. Asynchronous processing: the queue as a latency tool

The other way to move work is through time. If something does not have to
finish before the user hears back, it should not.

Take inviting a teammate:

```text
  synchronous                                        total 400 ms
  ───────────                                        ───────────
  validate the request                       20 ms
  check the user is not already a member     30 ms
  insert the invite row                      50 ms
  call SendGrid to send the email           300 ms   ← the user is waiting
  respond 201                                        ← for this
```

Now ask a question about that fourth line. Does the user need the email to have
been sent before they see a confirmation? No. They need the invite to exist. The
email is a consequence, and it will arrive when it arrives.

```text
  asynchronous                                       total 100 ms
  ────────────
  validate                                   20 ms
  check membership                           30 ms
  insert the invite row                      50 ms
  push {send_invite_email, id} to a queue      2 ms
  respond 201                                        ← user is done here

  ... a worker picks it up and calls SendGrid, whenever
```

:::figure async
The same work, arranged two ways. Nothing was made faster and nothing was
removed. The boundary of the request moved, so the user stops waiting at the
point where they have what they asked for.
:::

:::key
==Async does not reduce work. It moves work off the path the user is waiting
on.== The email still takes 300ms and still costs the same. What changed is who
is blocked while it happens, and that is the only thing perceived latency is
made of.
:::

The bigger the operation, the more dramatic this gets. Deleting an account might
mean cascading deletes across eight tables holding millions of rows:

```text
  synchronous:   8 seconds of spinner, and the browser may time out first
  asynchronous:  validate, respond, log the user out, delete in the background
                 100 ms of spinner. the deletion takes as long as it takes.
```

:::term Producer and consumer
The two halves of a queue. The producer is the code that pushes a job onto the
queue, usually your request handler. The consumer, also called a worker, is a
separate process that pulls jobs off and does the actual work. They scale
independently, which is much of the point.
:::

Notebook 01, Parts IV and V, covers the machinery in depth: leases, heartbeats,
idempotency, retries, dead letter queues, and the failure modes of each. This
section is only about the latency argument for reaching for it.

:::do What this costs you, stated honestly

- ++The client needs to handle "in progress".++ You returned 201 for something
  that has not happened. The UI must show pending state, and there must be a way
  to find out if it later failed.
- ++The job must be idempotent.++ Workers retry. Sending the invite email twice
  is survivable; charging a card twice is not.
- ++You now have a queue to operate.++ Depth, age of the oldest job, failure
  rate, a dead letter queue, and somebody looking at all four.
  :::

## 35. What can be made async, and what cannot

The judgement, since the mechanism is the easy part.

The test is one question: ==does the user need the result of this operation to
be true before they can sensibly continue?==

```text
  safe to defer                        must stay synchronous
  ─────────────                        ─────────────────────
  sending email and notifications      the write the user just made
  image and video processing           anything they will see on the next screen
  generating reports and exports       payment authorisation
  search index updates                 permission and quota checks
  cascading deletes                    uniqueness checks (a taken username)
  webhooks to third parties            anything they must be told failed, now
  analytics and audit events           the response body they are waiting for
```

The right column shares a property: the user is about to act on the result. The
left column shares the opposite one: the user has no way to tell whether it
finished, and would not behave differently if they did.

:::trap
!!Deferring a validation.!! Accepting a signup, returning 201, and discovering
asynchronously that the username was already taken leaves you with a user who
was told they had an account and does not. ++Anything that can reject the
request must happen before you respond.++ Defer the consequences of success,
never the decision about whether it succeeded.
:::

:::ask The queue is backed up and jobs are two hours old. What now?
Answer in the order you would act, because the order is the answer. ==First,
stop the bleeding==: is the arrival rate above the drain rate, or did workers
die? Little's Law tells you which, since queue depth divided by drain rate is
your current wait. Then decide whether to scale workers, which only helps if the
downstream can take it, or shed work by dropping low-value job types. Then look
for the poison message that is failing and retrying forever, because one of
those can consume a whole worker pool. And afterwards, ++alert on queue age
rather than queue depth++, since depth without a drain rate tells you nothing.
:::

:::recall Why does a CDN help when the origin is already fast? Give the number. | 5
:::

:::recall Give three operations that must stay synchronous and say what they have in common. | 5
:::

:::redraw The latency budget for a user in Tokyo, one bar per segment, roughly to scale. | Mark which segments a CDN removes, which an index improves, and which nothing you own can change.
:::

:::part VIII | Architecture decisions
Five sections on the two choices people reach for when they say "scaling" and
mean "rearchitecting". Both are real tools. Both are chosen for the wrong reason
more often than any other decision in this book.
:::

## 36. Microservices scale teams, not machines

:::term Monolith
One application, one codebase, one deployable unit. Authentication, orders,
payments and notifications are modules inside it that call each other as
ordinary functions. It can still be horizontally scaled: you run many identical
copies of the whole thing.
:::

:::term Microservices
An architecture where those modules are separate applications, deployed
independently, communicating over the network rather than by function call. Each
typically owns its own data.
:::

Start with the question nobody asks: what is wrong with a monolith?

Nothing, for most systems. ==A monolith horizontally scales perfectly well.== Ten
copies behind a load balancer is ten times the capacity, and the whole of Part V
applies unchanged. Monoliths are simpler to develop, simpler to test, simpler to
deploy, and simpler to debug, because one request is one process and one stack
trace.

So the reason to split is not throughput. Here is the actual reason:

:::key
==Microservices are a solution to an organisational problem, not a performance
one.== They exist so that a hundred engineers can ship without coordinating on
one deploy. If you have twelve engineers, you do not have that problem, and you
will pay the full price of the solution anyway.
:::

Three real motivations, in the order they usually apply:

**Deployment independence.** With 300 engineers on one repository, the payments
team's urgent fix is blocked because the notifications team has unfinished work
on main. Feature flags and release trains help. At sufficient scale they stop
helping.

**Independent scaling.** Notifications are cheap; payments are expensive. In a
monolith you scale the whole thing, so you buy CPU for notifications you do not
need in order to get CPU for payments. Split them and you scale each to its own
demand.

**Technology fit.** One module needs a Node library that has no equivalent
elsewhere. Another does image processing and would be ten times faster in Go or
Rust. A single deployable unit is a single runtime, so you cannot have both.

:::signal
When asked "would you use microservices?", the strongest answer starts with a
question back: ==how many engineers, and are they blocking each other?== If the
answer is under fifty and no, the answer is a modular monolith with clean
internal boundaries. That is not a cop-out; it is the answer most experienced
engineers give, and it also happens to be the architecture you can split later
if the boundaries are already clean.
:::

## 37. What a network boundary costs

Every function call you convert into a network call buys you independence and
sells you four things.

```text
  before                          after
  ──────                          ─────
  orders.getPayment(id)           POST http://payments/status
  ~0.001 ms                       ~5 ms, and it can fail
  cannot fail independently       can time out, refuse, or return garbage
  one stack trace                 four services' logs
  one transaction                 no transaction
```

#### Latency

Sub-microsecond becomes single-digit milliseconds, at best. That is fine once and
ruinous in a loop, and it is where the tail amplification from section 3 arrives
in force: five hops, each with a P99 of 50ms, and your request's own P99 is
worse than any of them.

#### Failure

A function call does not time out. A network call does, and now every call site
needs a decision about timeouts, retries and what to do when the answer never
comes.

:::do The three settings every remote call needs

- ++A timeout, always, and shorter than you think.++ An unbounded call holds a
  thread, a connection and a request slot until something else breaks. Default
  timeouts of 30 or 60 seconds are effectively unbounded under load.
- ++Retries with exponential backoff and jitter, on idempotent calls only.++
  Retrying a payment is not the same as retrying a read.
- ++A circuit breaker.++ After N consecutive failures, stop calling for a while
  and fail immediately. It gives the struggling service room to recover and stops
  you burning capacity on calls you know will fail.
  :::

:::trap
!!Naive retries during an overload.!! The downstream service is slow because it
is overloaded. Every caller times out and retries, tripling the traffic arriving
at the thing that could not keep up with the original amount. This is a %%retry
storm%%, and it turns a brownout into an outage in about ninety seconds. ==Retry
budgets, backoff, jitter, and a circuit breaker are not optional decorations;
they are what stops your own clients from finishing off your service.==
:::

#### Debugging

One request now spans four services and four log streams. Reconstructing it by
hand across four dashboards is not viable, which is why distributed tracing
stops being a nice-to-have and becomes a prerequisite. ==If you cannot trace a
request end to end, you are not ready to split the service.==

#### Data consistency

Each service owning its own database means no cross-service transaction. An
order that must create a payment record and decrement inventory is now two
writes on two machines with no way to make them atomic. The answers are sagas
with compensating actions, or the outbox pattern, and both are considerably more
work than `BEGIN` and `COMMIT`.

:::signal
"The moment you split a service you have converted a function call into a network
call, and you now owe it a timeout, a retry policy, a circuit breaker, a trace
and a consistency story." Listing the bill precisely is what separates someone
who has run microservices from someone who has read about them.
:::

## 38. Serverless: the pricing model is the point

Before serverless, one problem sat underneath every deployment: you had to guess.

:::term Capacity planning
Deciding in advance how many servers you need and how big each one should be.
Because provisioning takes time, the decision has to be made before the traffic
arrives, which means predicting traffic you have not received yet.
:::

Guess low and a traffic spike crashes you or makes you unusably slow. Guess high
and you pay for capacity you never used, twenty-four hours a day.

:::term Autoscaling
Automatically adding and removing server instances based on a measured signal,
usually CPU or memory. You set a minimum and a maximum, and the infrastructure
moves between them.
:::

Autoscaling is the standard answer and it has three real limits worth being able
to name:

```text
  1  it is slow        booting an OS, pulling an image, starting a runtime,
                       warming a pool: seconds to minutes. a spike that arrives
                       in four seconds outruns it.

  2  it is bounded     the maximum is either too low (you are back to
                       under-provisioning) or too high (a traffic event, or an
                       attack, produces a five-figure bill).

  3  it is reactive    it scales when the metric crosses a threshold, which is
                       to say after you are already overloaded. it cannot
                       anticipate.
```

And underneath all of it, the floor: even at zero traffic you are paying for your
minimum instances, all day, every day.

:::term Serverless
A model where you deploy functions rather than servers. The provider runs your
code only when an event triggers it, allocates the machine, and bills you for the
milliseconds it actually executed. There are still servers; you just do not
choose, size, patch or pay for them when idle.
:::

```text
  traditional                        serverless
  ───────────                        ──────────
  provision a machine                push code
  it runs 24/7                       nothing runs until a request arrives
  pay for uptime                     pay for execution time
  you choose the size                you choose a memory limit, and that is all
  scaling is your problem            concurrency scales per request
```

:::key
==The pricing model is the actual product.== Idle costs nothing. For workloads
that are spiky, unpredictable, or mostly idle, that is transformative: a service
handling four hundred requests a day costs cents instead of the price of an
always-on instance. For a service under constant load, the same billing model is
usually more expensive than a machine you rent by the month.
:::

## 39. Cold starts, limits, and statelessness

Three constraints. All three follow from the same fact: there is no machine
sitting there waiting for you.

#### Cold starts

:::term Cold start
The delay when a request arrives and no warm instance exists, so the platform
must allocate one, start the runtime, and load your code before it can run. A
warm start reuses an instance from a recent request and skips all of it.
:::

Two things dominate the delay, and the industry has attacked both:

```text
  the machine     a traditional VM boots an OS: hundreds of ms to seconds.
                  → Firecracker microVMs (AWS Lambda): ~125 ms
                  → V8 isolates (Cloudflare Workers): under 5 ms

  the runtime     interpreted languages start fast; JVM and .NET pay for
                  class loading and JIT warm-up.
                  → JS and Python: tens of ms
                  → JVM: hundreds of ms to seconds
```

Cloudflare Workers are fast at this precisely because they attacked both at once:
V8 isolates instead of VMs, and JavaScript instead of a compiled runtime.

:::do Living with cold starts

- ++Provisioned concurrency, if the platform offers it.++ Keep N instances warm.
  Honest, supported, and it reintroduces an idle cost, which is the trade.
- ++Keep the deployment package small.++ Load time is part of the cold start, and
  a 200MB bundle of dependencies is a self-inflicted wound.
- !!Do not use scheduled pings to keep things warm.!! It is the folk remedy and it
  is bad: it does not scale to real concurrency, and if it worked you would be
  paying for an always-on instance with extra steps.
  :::

#### Limits

Every platform caps execution time. Lambda's ceiling is 15 minutes; edge runtimes
are far tighter, often measured in CPU milliseconds. ==A long-running job is not
a serverless workload==, or rather it is one only if you split it into steps that
each finish comfortably inside the limit.

#### Statelessness, enforced

Section 24 recommended statelessness. Serverless makes it mandatory, and this is
where the model bites hardest.

```text
  no local disk that survives           write to object storage
  no in-memory cache between calls      use a shared cache
  no long-lived TCP connections         and this one is the real problem
  no WebSocket you can hold             use a managed realtime service
```

The database connection is the classic collision. A traditional server opens a
pool once and reuses it for its lifetime. A serverless function may be a thousand
concurrent instances, each wanting a connection, against a database that permits
three hundred. ==The connection ceiling from section 15 arrives all at once==,
which is precisely why serverless-first databases with HTTP-based drivers and
external pooling exist.

## 40. When serverless fits, and when it does not

```text
  good fit                              bad fit
  ────────                              ───────
  spiky or unpredictable traffic        steady high traffic (cheaper on a VM)
  event-driven work: a file lands,      latency-critical paths where a cold
    a queue message, a webhook            start is unacceptable
  scheduled and batch jobs              long-running work over the time limit
  media processing on demand            WebSockets and streaming connections
  glue between managed services         anything needing many DB connections
  low-volume internal tools             workloads with heavy local state
```

:::signal
"Serverless is excellent for event-driven and spiky work and a poor fit for a
steady-state API, mostly for cold starts and connection limits" is a balanced
answer. The industry position is currently over-enthusiastic, so ==stating where
it does not fit reads as judgement rather than as scepticism==. The strongest
version names a hybrid: an always-on API, with image processing and scheduled
work on Lambda.
:::

:::recall What problem do microservices actually solve, and what are the four costs of a network boundary? | 7
:::

:::recall Three limits of autoscaling, and the two causes of a cold start. | 6
:::

:::part IX | The interview
Three sections. Everything so far is material. This part is about producing it
under time pressure, in a conversation, without a whiteboard full of boxes you
cannot justify.
:::

## 41. How to answer "how would you scale this?"

The question is not a request for a list of techniques. It is a test of whether
you reach for measurement before you reach for architecture. Candidates who fail
it fail in the same way every time: they start naming components.

:::trap
!!"I'd add caching, then a load balancer, then read replicas, then shard."!! Every
item is correct and the answer is bad, because none of them is attached to a
problem. You have described a shopping list for a system you have not measured.
The interviewer's next question will be "why?" and you will have nothing.
:::

:::do The five beats, in order

1. ++Ask what "scale" means here.++ How many users now, how many expected, what
   is the read-write ratio, what is slow today. ==Numbers, before anything else.==
   If they will not give you numbers, invent explicit ones and say you are
   inventing them.
2. ++Say how you would find the bottleneck.++ Traces and percentiles, the
   segment table from section 7. Name the tool. Say you would not act until it
   points somewhere.
3. ++Start with the cheapest fix that the measurement would justify.++ An index,
   an N+1, a synchronous call moved off the request path. These are hours of work
   and they are frequently the whole answer.
4. ++Escalate only with a reason.++ "If the database is still the bottleneck and
   we are read-heavy, read replicas, and here is the consistency bug they
   introduce." Each step names its own cost.
5. ++Say where you would stop.++ "I would not shard. At this volume the operating
   cost is larger than the benefit." Knowing when not to is the answer to the
   real question.
   :::

Worked, in about ninety seconds:

> _"First I'd want the numbers: current RPS, P99, and where the time actually
> goes. Say it comes back that checkout has a P99 of 4 seconds and a trace shows
> 3.2 of that in one query. Then I'd `EXPLAIN ANALYZE` it, and if it is a
> sequential scan I add an index and we are done for a few months. If the query
> is already optimal and the database is simply saturated, I'd check the
> read-write ratio. Read-heavy means read replicas, and then I need to handle
> read-after-write, probably by returning the object from the write. If writes
> are the problem, that is a harder conversation, and I would look at whether the
> writes can be batched or made async before I would consider sharding, because
> sharding is the least reversible thing on the table."_

That answer names five techniques. Every one is attached to a measurement, a
condition and a cost. ==That is the entire difference.==

## 42. Five traps

**Optimising without measuring.** Covered at length, and still the most common.
The tell is a candidate who names a fix before asking a question.

**Quoting averages.** "Our average response time is 200ms." The follow-up is
"and your P99?" If there is no answer, the first number was decoration.

**Reaching for the most complex tool.** Microservices, Kubernetes and sharding
mentioned in the first thirty seconds signal that you have read about scaling
rather than done it. ==Complexity is a cost you are asking somebody to pay.==

**Ignoring the write path.** Nearly every technique in this book helps reads.
Caches, replicas, CDNs, indexes: reads, reads, reads, and indexes actively make
writes slower. If the interviewer says the workload is write-heavy, half your
material is inapplicable and noticing that out loud is worth a lot.

**Forgetting that scaling is a cost.** Every instance is money, monitoring, a
patch surface and a thing that can fail. "We could halve the traffic by fixing
this N+1" is a better answer than "we could double the servers", and it is
cheaper in every dimension.

:::ask The interviewer says "assume infinite budget". Does that change your answer?
Barely, and saying so is the point. ==Money buys bigger machines and more of
them; it does not buy consistency, it does not buy round trips back from the
speed of light, and it does not buy away the coordination cost of a distributed
system.== Infinite budget removes vertical scaling's ceiling and the cost
argument against replicas. It leaves every hard problem in this book exactly
where it was.
:::

## 43. The five rules

The lecture ends with these. They are worth memorising close to verbatim,
because each one is a complete answer to a question you will be asked.

:::key
**1. Start with a problem, not a solution.** Every technique in this book is an
answer. Before you pick one, know the question: which endpoint, which
percentile, which segment of the request. ==Measure, then act.==
:::

:::key
**2. Prefer the simple solution.** A monolith is simpler than microservices. A
bigger machine is simpler than a cluster. An index is simpler than a cache.
Complexity has an ongoing cost: another thing to monitor, understand, and be
woken up by. ==Accept it only when simplicity is genuinely insufficient.==
:::

:::key
**3. Scale for the problems you have.** You do not need to handle a million users
on day one, and you probably never will have a million users. Build for your
current scale with reasonable headroom. ==Your system's characteristics are your
own==, and an engineering blog from a company a thousand times your size is
describing a different problem.
:::

:::key
**4. Observability from day one.** This is the deliberate exception to rule 2.
Logs, metrics and traces are the one piece of complexity worth having before you
need it, because ==every other rule here depends on being able to measure==, and
retrofitting observability during an incident is the worst possible time.
:::

:::key
**5. It is a mindset, not a checklist.** Nobody predicts every failure. What you
can build is the ability to see what is happening, diagnose it quickly, and
recover gracefully. ==The job is not to prevent all problems. It is to build
systems that handle problems when they arrive, and to be able to find out what
happened.==
:::

:::signal
If you remember nothing else from this book, remember rule 1 and rule 4, because
together they are one idea: ==you cannot fix what you cannot see, so make it
visible first.== Every specific technique here is downstream of that.
:::

:::part X | Appendices
Reference material and the final self-test. The numbers table is the one page
worth photographing before an interview.
:::

## Appendix A. Numbers worth memorising

Orders of magnitude, not precise values. The point is to know instantly whether
something is plausible.

#### The latency ladder

```text
  L1 cache reference                          0.5 ns
  branch mispredict                             5 ns
  L2 cache reference                            7 ns
  mutex lock / unlock                          25 ns
  main memory reference                       100 ns
  compress 1 KB                             3,000 ns   = 3 µs
  send 1 KB over 1 Gbps network            10,000 ns   = 10 µs
  read 1 MB sequentially from memory      250,000 ns   = 250 µs
  round trip within the same datacenter   500,000 ns   = 0.5 ms
  read 1 MB sequentially from SSD       1,000,000 ns   = 1 ms
  disk seek (spinning)                 10,000,000 ns   = 10 ms
  read 1 MB sequentially from disk     20,000,000 ns   = 20 ms
  round trip, US west to US east       60,000,000 ns   = 60 ms
  round trip, US to Europe             80,000,000 ns   = 80 ms
  round trip, US to Asia              150,000,000 ns   = 150 ms
```

The gap to internalise is the one between memory and network: ==a network round
trip inside one datacenter costs five thousand times a memory reference==. That
ratio is why N+1 is fatal and why chatty microservices are expensive.

#### Rough capacities

```text
  Postgres, simple indexed query           0.1 - 2 ms
  Postgres, default max_connections        100 - 500
  Redis, single GET                        under 1 ms, ~100k ops/sec/core
  a modest API instance                    500 - 2,000 rps for simple work
  nginx as a reverse proxy                 tens of thousands of rps
  Kafka, single partition                  tens of MB/sec
```

#### Utilization and latency

```text
  utilization    wait multiplier
      50%              2x
      70%            3.3x
      80%              5x
      90%             10x
      95%             20x
      99%            100x
```

#### Percentiles, said out loud

```text
  P50    half of requests
  P90    one request in ten is worse
  P95    one request in twenty is worse
  P99    one request in a hundred is worse
  P99.9  one in a thousand. matters at high volume: at 10,000 rps,
         that is ten unhappy requests every second.
```

## Appendix B. Glossary

Every term glossed in this book, in one place. Each entry links back to the page
where it first appeared.

:::glossary
:::

## Appendix C. Final review

Close the book. Work down the list. Anything you cannot answer in two sentences
goes back to the section named beside it.

:::recall Latency, throughput, utilization, headroom: define each, and give the wait multiplier at 80% and 95%. | 7
:::

:::recall Write Little's Law and use it to size a connection pool for 600 rps at 30ms of database time. | 5
:::

:::recall Why is an average latency misleading, and what do you quote instead? | 4
:::

:::recall Explain tail latency amplification with the ten-service fan-out arithmetic. | 5
:::

:::recall Name the four measurement tools and the one question each answers. | 5
:::

:::recall Give Amdahl's bound: a fix on a segment worth 10% of the request buys you what, at most? | 3
:::

:::recall The three database failures in Part III, and the measurement that identifies each. | 6
:::

:::recall Why does an index on (a, b) not serve a query filtering only on b? | 4
:::

:::recall Two cache invalidation strategies, one failure of each, and three fixes for stampede. | 7
:::

:::recall Cache-aside, write-through, write-behind: which one can lose a write, and why would you ever accept that? | 5
:::

:::recall Three ceilings of vertical scaling, and the one property horizontal scaling requires of your code. | 6
:::

:::recall Round robin versus least connections: which handles mixed request cost, and by what mechanism? | 5
:::

:::recall Liveness versus readiness, and what breaks if you wire them together. | 5
:::

:::recall Trace the read-after-write bug through a write to Virginia and a read from Mumbai, then give two fixes. | 7
:::

:::recall Why is order_date a bad shard key, and what are the three costs of sharding nobody mentions? | 7
:::

:::recall A user in Tokyo, a server in Virginia: what is the floor on their latency, and why can no optimisation beat it? | 5
:::

:::recall Give three things safe to make asynchronous and three that must stay synchronous, and the rule that separates them. | 6
:::

:::recall What problem do microservices actually solve, and what are the four costs of a network boundary? | 7
:::

:::recall What is a retry storm, and what four settings prevent one? | 5
:::

:::recall Three limits of autoscaling, two causes of a cold start, and one workload serverless is wrong for. | 7
:::

:::recall The five rules from section 43, from memory. | 8
:::

:::redraw The whole system, from the browser to the disk, with every scaling component in this book placed on it. | Load balancer, instances, cache tiers, primary and replicas, queue and workers, CDN and edge. Then annotate each with the one problem it solves and the one problem it creates.
:::
