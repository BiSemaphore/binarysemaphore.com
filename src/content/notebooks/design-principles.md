:::title Write down the last change that took three days and should have taken one hour. Name every file you had to touch. Keep the list.
System Design Notebook / 09
Design Principles
SOLID, and the question underneath it
Senior backend and full-stack interview preparation. Read with a pen.
:::

## How to use this book

This is the shortest book in the series, and the only one not built from a
lecture. It needs to say why up front.

The *Backend from First Principles* playlist names these principles exactly once.
In video 1, the roadmap, at 18:23:

> "...we'll look at different design principles like separation of concerns,
> single responsibility, open close, dependency inversion, what are the
> components of a business logic layer..."

Four seconds, inside a thirty-one minute video that reads the whole curriculum
aloud. No later video returns to them. ==The playlist promises these principles
and never delivers them==, which is exactly why this book exists.

So the material here comes from the primary sources: Meyer in 1988, Liskov in
1987, Martin through the 1990s, Dijkstra in 1974. Every one of them is named
where it is used, because ++the second-hand version of these principles is where
almost all the confusion in this field comes from.++ What the video does give us
is the right context, and this book keeps it: these are principles about the
%%business logic layer%%, the middle of the three layers, and they are aimed at
the code that holds your actual rules.

#### The one question

==What has to change together?==

That is what all five of SOLID are about, and none of the usual summaries say so.
Each principle is a different answer to the same question, and the question is
never "is this code beautiful". It is: when a requirement changes next quarter,
__how far does the edit spread?__

| Letter | The change it is trying to contain |
|---|---|
| S | Two people asking for different things, editing one file |
| O | Adding a case means editing the code that already worked |
| L | A subtype that makes callers check which subtype it is |
| I | A method you do not use, changing, and breaking you |
| D | The stable rules depending on the volatile detail |

If a principle does not reduce how far a change spreads, ==you are applying it as
decoration==, and this book will keep saying so.

#### What is in here that is not in the usual summary

Five things, and they are the reason this is a book and not a blog post.

- ++Martin changed the definition of SRP in 2017.++ The version everybody quotes
  is the 1990s one. The refinement is better and almost nobody knows it.
- ++There are two Open-Closed Principles.++ Meyer's and Martin's are different
  mechanisms, and people argue past each other because of it.
- ++Liskov's actual rule is four conditions, not a vibe about inheritance.++
  Preconditions, postconditions, invariants, history.
- ++Coupling and cohesion came first and explain more.++ Constantine had the
  useful vocabulary twenty years before the acronym existed.
- ++SOLID has serious critics.++ Knowing the strongest argument against it is
  what separates someone who read the source from someone who read a slide.

#### The five block types

| Block | What it means |
|---|---|
| Interviewer asks | A real follow-up you should expect. Answer it out loud before reading on. |
| Senior signal | The specific sentence that separates a senior answer from a mid-level one. |
| Trap | A common answer that sounds right and is wrong. |
| Do this | The concrete practice, with the parameter or the number. |
| Key idea | The one thing to carry out of that section. |

#### The four highlighters

| Mark | Means |
|---|---|
| ==peach== | The sentence to carry away |
| !!rose!! | The wrong answer, the thing that bites |
| ++mint++ | The correct practice |
| %%pink%% | A definition, at the point it is first defined |

#### A suggested route

1. Read Part I first and do not skip it. The five letters make far more sense
   after coupling and cohesion than before.
2. Part II is reference. One section per idea. Read it with your own code open.
3. Part III is the part that stops you doing damage with Part II. It is the half
   of this subject that interviews actually probe.

:::key
These are not rules about how code should look. ==They are five bets about which
things will change and which will not==, and a bet you get wrong costs more than
making no bet at all. That is why Part III exists.
:::

:::toc
:::

## The whole picture on one page

```text
                    ONE REQUIREMENT CHANGES
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │   how many files must you edit?        │
        └────────────────────────────────────────┘
                    │                   │
              ONE FILE              ELEVEN FILES
                    │                   │
                    ▼                   ▼
             the design            the design
             held                  leaked
                                        │
        ┌───────────────────────────────┴─────────────┐
        │                                             │
   WHY DID IT SPREAD?                          WHICH PRINCIPLE
        │                                       WAS BROKEN?
        │
   ┌────┴─────────────────────────────────┐
   │                                      │
   │  one file served two audiences  ─────┼──▶  S
   │                                      │
   │  adding a case meant editing    ─────┼──▶  O
   │  the switch that already worked      │
   │                                      │
   │  a subclass surprised its caller ────┼──▶  L
   │                                      │
   │  an interface carried methods   ─────┼──▶  I
   │  this client never called            │
   │                                      │
   │  the rule imported the detail   ─────┼──▶  D
   │                                      │
   └──────────────────────────────────────┘
```

Read it in that direction, ==from the painful change backwards to the principle
that would have prevented it.== Read in the other direction, from principle to
code, it produces speculative abstraction and the pain arrives anyway, wearing a
factory.

Three rules govern the whole book.

- ==A principle is a prediction about change.== "This will vary, that will not."
  Applying a principle where nothing varies costs you a layer and buys nothing.
- ==Coupling is the disease, and the five letters are treatments.== If you cannot
  say which coupling a refactor removed, it was not a refactor.
- ==You are allowed to break any of them, once you can say what it will cost.==
  That sentence is the entire difference between a mid-level and a senior answer.

:::redraw The diagnosis tree: from a change that spread, back to the principle that was broken. | Five leaves. Write the smell, not the letter.
:::

:::part I | The words that came before the acronym

SOLID is five ideas from the 1980s and 1990s, collected under an acronym coined
in about 2004 by Michael Feathers, who arranged existing principles into a word
that could be remembered. ==The acronym is a mnemonic, not a theory.== The theory
underneath it is older and is worth having first, because it explains why the
five are five and not seven, and because a fluent answer about coupling beats a
recited list of letters in every interview.
:::

## 1. The requirement: a change that should have been small

A product manager asks for something small. "Finance wants the invoice total to
exclude cancelled line items."

You start work. The calculation lives in `InvoiceService`. You change it. Tests
fail in the PDF renderer, because it recomputed the same total itself. You fix
that. The nightly export job now disagrees with the UI, because it had its own
copy. The mobile client had cached a total computed a fourth way. Three days
later you have touched eleven files, and you are no longer confident the number
is right anywhere.

Nothing about that story involves bad code. Every one of those four calculations
was ((correct when it was written)). The design failed at a different level: it
never decided ==where the definition of "invoice total" lived==, so it lived
everywhere, and a change to it had to be made everywhere.

Now the second version of the same story. The total is computed in one place.
Finance's change is a four-line edit and a test. The renderer, the export and the
mobile client all read the number they are given.

The difference between the two is not skill, effort, or test coverage. It is a
single decision made much earlier about what belongs together.

:::term Design
The set of decisions about where things live and what depends on what. It is
distinct from implementation, which is how any one of those things works
internally. Implementation mistakes are found by tests. ==Design mistakes are
found by the next requirement.==
:::

:::signal
"The cost of a change is not the size of the edit, it is the number of places the
edit has to be repeated and kept consistent. I design for that number, not for
line count."
:::

:::key
Every principle in this book exists to answer one question asked in advance:
==when this changes, how far does the edit spread?== A design is good exactly to
the extent that the answer is "not far", for the changes that actually arrive.
:::

## 2. Cohesion and coupling: the older, better words

Larry Constantine introduced these in the structured design work of the late
1960s and 1970s, two decades before any of SOLID. They remain the most useful
vocabulary in the subject, and they are what the five letters are made of.

%%Cohesion%% is how strongly the things inside one module belong together.
%%Coupling%% is how much one module must know about another.

```text
   HIGH COHESION            LOW COUPLING
   things that change       modules that can change
   together live together   without telling each other
            │                        │
            └────────┬───────────────┘
                     ▼
        the two halves of every principle
        in this book, without exception
```

The reason both matter, and neither alone, is that ==either one is trivial to
achieve by destroying the other.== Put the entire application in one file and
coupling between modules is zero, because there are no modules. Split every
method into its own class and each class is perfectly cohesive and nothing can be
understood. The craft is entirely in the trade.

**Coupling comes in kinds, and they are not equally bad.** Roughly, worst first:

| Kind | What it means | Example |
|---|---|---|
| Content | One module reaches into another's internals | Mutating another object's private list |
| Common | Both share mutable global state | Two services writing one global config |
| Control | One passes a flag that steers the other's logic | `save(user, sendEmail: true)` |
| Stamp | Passing a whole record when one field is needed | Passing `User` to get `user.id` |
| Data | Passing exactly the values needed | `chargeCard(amount, token)` |

++Data coupling is the goal, not zero coupling.++ Zero coupling means the two
modules never interact, which for most pairs is not an option.

:::trap
!!"Loose coupling means everything should go through an interface."!!

An interface with one implementation, injected into one consumer, adds a file and
a layer of indirection and removes no coupling at all: the consumer still depends
on exactly one behaviour, now with an extra hop to read. ++Coupling is about what
must change together, not about how many types stand between two things.++ You
have loosened coupling when a change on one side stops forcing a change on the
other, and never merely by adding a type.
:::

:::key
==High cohesion, low coupling== is the whole subject in three words, and SOLID is
five specific tactics for getting there. If you can talk fluently about coupling,
you can derive the five letters live. The reverse is not true.
:::

## 3. Separation of concerns, and where these principles live

Dijkstra named %%separation of concerns%% in a 1974 essay, *On the role of
scientific thought*. His point was narrower and sharper than the phrase became:
studying one aspect of a subject in isolation is legitimate ++not because the
other aspects are unimportant, but because a mind can only hold one at a time.++
It is a claim about human limits, not about architecture.

The video puts the principles in a specific place, and it is the right place.
Three layers:

```text
   PRESENTATION      routing, middleware, controllers, serialization
        │            deals with the user's data on the way in and out
        ▼
   BUSINESS LOGIC    services, domain models, business rules and validation
        │            ← every principle in this book is aimed here
        ▼
   DATA ACCESS       repositories, queries, the database
```

==The middle layer is where these principles pay.== The outer layers are mostly
shaped by your framework and your database, and there is little design freedom in
them. The middle is the part that is yours, the part that encodes rules nobody
else's software has, and the part that changes when the business changes.

This is also the practical reading of the dependency rule you will meet in
section 12: ++the arrows should point inward.++ Business logic must not import
the web framework or the ORM. If your domain model has a decorator from your HTTP
library on it, the middle layer has been annexed by the outer one, and it will
now change whenever that library does.

Notebook 12 covers the layers themselves properly, including what belongs in a
controller and what does not. This book only borrows the map.

:::ask
"Is separation of concerns the same as single responsibility?"

No, and the distinction is worth having. Separation of concerns is about
__categories of work__: HTTP handling is one concern, persistence another,
business rules a third, and they should not be interleaved in one function.
Single responsibility, in Martin's refined form, is about __who asks for
changes__: two different stakeholders should not be able to force edits to the
same module. You can obey the first and break the second easily, by putting two
different departments' rules in one perfectly layered service.
:::

:::key
These are principles for the ==middle layer==, the code that holds your rules. In
the outer layers your framework has already made most of these decisions, and
fighting it there costs more than it returns.
:::

:::recall Define cohesion and coupling, and explain why optimising either alone is trivial and useless. | 6
:::

:::recall Name the five kinds of coupling worst-first, and say which one is the realistic target. | 6
:::

:::part II | The five

One section per idea, plus the misreadings, because for three of the five the
common misreading is more widespread than the principle. Each section is built
the same way: what the source actually said, what it costs you to break it, and
what a violation looks like in a diff.
:::

## 4. S: one reason to change

Robert Martin's original formulation, from the 1990s and set down in *Agile
Software Development* (2002):

> A class should have only one reason to change.

The word doing the work is __reason__, and it is not "responsibility" in the
loose English sense. A class that validates an order, prices it, and emails a
receipt has three reasons to change, because ==three different forces in the
world can independently require it to be edited.==

```text
   class OrderService
     ├── validate()      changes when the rules team changes rules
     ├── price()         changes when finance changes tax handling
     └── sendReceipt()   changes when marketing changes the email

   three forces, one file, one merge conflict every quarter
```

**The test is a question about the future, not about the code.** Ask: can I think
of two changes that would arrive at different times, from different people, and
both land in this file? If yes, it has more than one reason to change.

:::trap
!!"Single responsibility means a class should do one thing."!!

This is the most common and most damaging misreading, and it produces codebases
with three hundred one-method classes, each perfectly focused and collectively
incomprehensible. ++"One thing" is not defined at any particular size, so the
rule gives no guidance and people apply it until everything is atomised.++
"One reason to change" is a real test with a real answer, because reasons for
change are countable and they come from identifiable people.
:::

:::key
==A reason to change is a person who can ask for it.== Count those, not methods,
not lines, not concepts.
:::

## 5. S, refined: responsibility means an actor

In *Clean Architecture* (2017) Martin restated the principle, and the restatement
is much better than the original:

> A module should be responsible to one, and only one, actor.

%%Actor%% here means a group of people who ask for the same kind of change:
finance, the compliance team, the operations team. Not a user of the software, a
__source of requirements__.

The reason this matters is that it makes the principle falsifiable in a
conversation. His own example is an `Employee` class with three methods,
`calculatePay`, `reportHours`, and `save`. Each is requested by a different part
of the company:

| Method | Actor | What goes wrong |
|---|---|---|
| `calculatePay` | Finance | |
| `reportHours` | Human resources | |
| `save` | The DBA / operations | |

They share a class, so they share code. One day someone changes a shared helper
used by `calculatePay` on finance's instruction, and ==HR's hours report silently
changes too, because it called the same helper.== Nobody asked for that. Nobody
reviewed it as a change to HR's reporting. The failure is not a bug in either
feature; it is that two departments were coupled together by an accident of file
layout.

++The fix is to split by actor, and to let the shared code be duplicated or
extracted deliberately, with a name, and an owner.++

:::signal
"SRP is about actors, not about size. If two teams can send me contradictory
change requests that both land in the same file, that file has more than one
responsibility, however small it is."

This answer is unusual enough that it reliably reads as first-hand knowledge,
because the popular version of SRP does not mention actors at all.
:::

:::ask
"Does SRP conflict with DRY?"

Constantly, and section 15 is about it. The short version: two pieces of code
that look identical but serve different actors are ==not duplication, they are
coincidence.== Merging them couples two departments together, and you will find
out when one of them asks for a change the other one does not want.
:::

:::key
==Responsible to one actor.== The 2017 formulation is the one to quote, because
it turns a vague aesthetic into a question about your organisation chart.
:::

## 6. O: change by adding, not by editing

Bertrand Meyer, *Object-Oriented Software Construction* (1988):

> Software entities should be open for extension, but closed for modification.

The plain reading: ==you should be able to add behaviour without editing code
that already works.== The reason is risk. Code that has been in production for a
year and has never been touched is code that does not need to be retested. Every
edit to it puts that back on the table.

The classic shape of a violation is a conditional that grows:

```text
   function fee(payment) {
     if (payment.type === "card")   return  amount * 0.029 + 30
     if (payment.type === "bank")   return  50
     if (payment.type === "wallet") return  amount * 0.015
     ...                            ← every new method edits this function
   }
```

Every new payment method reopens a function that already worked for the previous
three. The closed version moves the varying part behind a shared shape, so that a
new one is a new file:

```text
   interface PaymentMethod  { fee(amount) }

   CardPayment    fee()  →  amount * 0.029 + 30
   BankPayment    fee()  →  50
   WalletPayment  fee()  →  amount * 0.015

   adding a fourth touches nothing that already works
```

:::trap
!!"Open-closed means you must never edit existing code."!!

Taken literally this is absurd, and it is how OCP earns its reputation for
producing unreadable abstraction. ++OCP is a statement about which axis you
expect variation on.++ You choose one axis, you make that one open, and you
accept that variation on any other axis will mean editing. Adding a new payment
method is cheap in the design above; ==adding a second parameter to every
`fee()` is now expensive==, and that is a trade you made deliberately, not a
failure.
:::

:::do
Apply OCP on the third case, not the first. One conditional is not a design
problem. Two might be a coincidence. ++By the third you have evidence about
which axis actually varies++, and evidence is the only thing that makes this
prediction better than a guess.
:::

:::key
==Open on the axis you have evidence varies, closed on everything else.== OCP
applied without that evidence is section 16, and it is one of the most expensive
mistakes in this book.
:::

## 7. O: Meyer's version and Martin's are not the same

This is worth one page because it resolves an argument you will hear.

**Meyer's OCP (1988) is about inheritance.** A class, once published and in use,
is closed: you do not modify it. You extend it by ++subclassing++, and the
subclass adds what you need. This makes sense in Eiffel, the language Meyer
designed, where a published class is a contract and inheritance is the extension
mechanism.

**Martin's OCP (1996 onward) is about polymorphic interfaces.** Callers depend on
an abstraction. New behaviour arrives as a new implementation of that
abstraction. Nothing is subclassed; nothing concrete is extended.

```text
   MEYER                          MARTIN
   Base           (closed)        <<interface>> Shape
     └── Derived  (extension)        ├── Circle
                                     └── Square      (new file, no subclassing)
```

The difference is not academic. ==Meyer's version requires inheritance, and
inheritance is the mechanism that section 8 is about to warn you off.== Martin's
version does not. Modern practice, and every language designed since 1995,
follows Martin: ++prefer composition and interfaces to inheritance++, and when
someone says "open-closed" in an interview, they mean Martin's.

:::signal
"OCP in Meyer's original sense was an inheritance rule; Martin's polymorphic
restatement is the one we actually use, and it avoids the substitutability
problems that inheritance introduces."
:::

:::key
Two principles, one name. ==Quote Martin's, and know that Meyer's came first and
meant inheritance.==
:::

## 8. L: what Liskov actually said

Barbara Liskov stated it in a 1987 conference keynote, and formalised it with
Jeannette Wing in 1994 as *A Behavioral Notion of Subtyping*. The often-quoted
form:

> If S is a subtype of T, then objects of type T may be replaced with objects of
> type S without altering any of the desirable properties of the program.

The plain reading: ==code that works with the parent must keep working, unchanged
and unaware, when handed the child.== A subtype is a promise that substitution is
safe.

The reason this is a design principle and not a type-system technicality is that
the compiler cannot check it. ++Your subclass satisfies the compiler by having
the right method signatures. LSP is about behaviour behind those signatures++,
and nothing enforces it but review.

**The tell is a caller that has to ask what it is holding.**

```text
   for (shape of shapes) {
     if (shape instanceof Square) { ... }   ← the polymorphism has failed
     else                         { ... }      and you are paying for it twice
   }
```

Once a caller checks the concrete type, you have all the cost of the abstraction
and none of the benefit: you still have the interface, and you still edit the
caller every time a new subtype appears, which also breaks section 6.

:::term Substitutability
The property that a caller written against a type continues to be correct when
given any subtype of it, without knowing which. It is the entire point of having
subtypes, and it is a claim about behaviour, not about method signatures.
:::

:::key
==A subtype must not surprise a caller written against the supertype.== If your
callers contain type checks, you do not have subtypes, you have a tagged union
with extra steps.
:::

## 9. L: the four rules, and the square

Liskov and Wing's formalisation gives four conditions. They are precise, and they
are what to say when asked how to actually check for a violation.

| Rule | In the subtype |
|---|---|
| Preconditions | May not be strengthened. It cannot demand more than the parent |
| Postconditions | May not be weakened. It must deliver at least as much |
| Invariants | Must be preserved. What was always true stays always true |
| History | It must not permit state changes the parent forbade |

**Preconditions may not be strengthened** is the one that catches most real bugs.
If `Parent.save(user)` accepts any user, and `Child.save(user)` throws unless the
user has an email, ==every existing caller of `save` is now conditionally
broken==, and no compiler will tell you.

**The square and the rectangle** is the canonical example, and it is worth
knowing precisely because it is asked so often.

```text
   class Rectangle { setWidth(w); setHeight(h); area() }
   class Square extends Rectangle { ... }        ← a square IS a rectangle,
                                                   mathematically

   r.setWidth(5)
   r.setHeight(4)
   assert r.area() === 20      ← true for Rectangle
                               ← false for Square, which got 16
```

`Square` must keep width and height equal, so setting one changes the other. That
breaks the invariant every caller of `Rectangle` relies on. ==The mathematical "is
a" relationship is true and the subtyping relationship is still wrong==, because
subtyping is about substitutable behaviour, and a mutable square does not behave
like a mutable rectangle.

**This happens in real libraries.** `Arrays.asList()` in Java returns a `List`
whose `add` throws `UnsupportedOperationException`. It satisfies the interface
and violates it behaviourally: any code written against `List` can be broken by
being handed one. !!An `UnsupportedOperationException` is almost always an
admission of an LSP violation.!!

:::ask
"How would you fix the square and rectangle?"

The good answer refuses the premise. Do not make `Square` a subtype of a
__mutable__ `Rectangle`; the mutability is what breaks it. Options, in order:
make both immutable, so `withWidth()` returns a new object and no invariant can
be violated; or drop the inheritance and let both implement a `Shape` interface
that only exposes `area()`. ++The general lesson is that inheritance hierarchies
that are safe for immutable types are frequently unsafe for mutable ones.++
:::

:::key
==Preconditions may not be strengthened, postconditions may not be weakened,
invariants and history must hold.== Four checkable rules, and a thrown
`UnsupportedOperationException` is the smell that one of them is being broken.
:::

## 10. I: the interface that carries what you do not use

Martin's formulation, from work at Xerox:

> Clients should not be forced to depend upon interfaces that they do not use.

A single fat interface forces every implementer to supply everything and every
caller to depend on everything. ==The cost is not the unused methods; it is that a
change to one of them recompiles, redeploys and potentially breaks a client that
never called it.==

```text
   FAT                                SEGREGATED

   interface Machine {                interface Printer  { print() }
     print()                          interface Scanner  { scan()  }
     scan()                           interface Fax      { fax()   }
     fax()
   }                                  OldPrinter implements Printer
                                      AllInOne   implements Printer,
   OldPrinter implements Machine {                          Scanner, Fax
     print() { ... }
     scan()  { throw ... }   ← and now you are also breaking section 9
     fax()   { throw ... }
   }
```

Notice that the fat version forces an LSP violation as a side effect. ++The two
principles are closely related: ISP is largely how you avoid being cornered into
breaking LSP.++

**The practical form of ISP is about the consumer, not the implementer.** The
better version of this rule, and the one that is genuinely useful in a codebase
with services rather than devices: ==define the interface where it is used, and
make it as narrow as that use.== If a report generator needs only
`findById`, it should depend on a one-method interface it declares, not on your
forty-method `UserRepository`.

:::do
When you write a dependency for a class, write down only the methods that class
actually calls. If the resulting interface has one or two methods, that is
correct, not too small. ++Wide dependencies are what make a codebase impossible
to test in isolation, and narrow ones make the test setup obvious.++
:::

:::key
==Depend on the narrowest thing that does the job.== The interface belongs to the
consumer that needs it, not to the class that happens to implement it.
:::

## 11. D: point the dependency at what changes least

Martin, *The Dependency Inversion Principle* (1996), two clauses:

> High-level modules should not depend on low-level modules. Both should depend
> on abstractions.
>
> Abstractions should not depend on details. Details should depend on
> abstractions.

The word %%inversion%% refers to what happens to the arrow. In the obvious
design, the thing with the rules imports the thing with the mechanics:

```text
   NAIVE                             INVERTED

   OrderService                      OrderService
        │  imports                        │  imports
        ▼                                 ▼
   PostgresOrderRepo               <<interface>> OrderRepository
   (a detail: SQL, a driver,                     ▲
    a connection string)                         │  implements
                                       PostgresOrderRepo
```

The arrow from the detail now points ==up, at the abstraction owned by the
business layer.== That ownership is the part people miss: ++the interface belongs
to the high-level module, not to the database package.++ If `OrderRepository`
lives next to the Postgres code and is shaped by it, you have written an
abstraction that depends on a detail, and clause two is broken even though clause
one looks satisfied.

**The reason to do this is rate of change, not testability.** Testability is a
happy consequence that gets quoted first because it is easy to demonstrate. The
real argument is that ==your business rules should outlive your database==, and
they will only do that if the dependency points the right way. Rules about how an
order is priced were true before you chose Postgres and will be true after you
leave it.

:::trap
!!"Dependency inversion means using a dependency injection framework."!!

They are unrelated. Dependency inversion is a statement about which module owns
the abstraction and which way the import arrow points. %%Dependency injection%%
is the mechanical act of passing a dependency in rather than constructing it
inside, and a constructor parameter achieves it completely, with no framework at
all. ++You can use a DI container and still have every arrow pointing the wrong
way++, which is extremely common: the container wires concrete classes to
concrete classes and nothing has been inverted.
:::

:::signal
"Dependency inversion is about which side owns the interface. If my repository
interface lives in the domain package and the Postgres implementation depends on
it, the arrow is inverted. If the interface ships with the database code, I have
dependency injection but not dependency inversion."
:::

:::key
==Point every dependency arrow at the thing that changes least.== Your business
rules change slowest, so arrows point at them, and the interface lives with them.
:::

:::recall Write Martin's 2017 formulation of SRP, and say why it beats "one reason to change". | 5
:::

:::recall Give the four Liskov conditions, and the square-rectangle failure in one sentence. | 7
:::

:::recall What is inverted in dependency inversion, and why is a DI framework irrelevant to it? | 6
:::

:::part III | Using them without being used by them

Everything to this point is the standard material, told accurately. This part is
the half that is usually missing, and it is where interviews go once they have
established that you can recite the five. ==Every principle in Part II can be
applied at the wrong time, and doing so is more expensive than not knowing it.==
:::

## 12. When two principles disagree

They are not a consistent system. They were written by different people, decades
apart, to solve different problems, and collected under one acronym afterwards.
Conflicts are normal, and knowing the common ones is what makes the set usable.

| Conflict | The tension |
|---|---|
| SRP vs DRY | Splitting by actor duplicates code that looks identical |
| OCP vs YAGNI | Openness costs an abstraction you may never need |
| ISP vs simplicity | Narrow interfaces multiply the number of types |
| DIP vs directness | An interface with one implementation is a hop with no branch |
| LSP vs reuse | The convenient superclass is often not a true supertype |

The resolution is always the same shape, and it is worth being able to state:
==ask which change is more likely.== If a new payment method is likely and a new
parameter is not, be open on payment methods. If the identical code in two
services is likely to diverge because two teams own it, keep it duplicated. The
principles do not rank themselves; ++your prediction about the next twelve months
ranks them++, and being explicit about that prediction in code review is the
whole skill.

:::signal
"These conflict routinely, so I treat them as arguments rather than rules. The
question I ask is which change is more likely to arrive first, and I make that
one cheap. I try to write the prediction in the pull request, so that when it is
wrong we can find out why."
:::

:::key
==They are not axioms and they do not compose.== A senior engineer is someone who
can name the conflict, state the bet, and say what it would take to change their
mind.
:::

## 13. OCP against YAGNI: the abstraction you did not need

This is the most expensive mistake in the book, and it is made by people who have
just learned the principles.

You anticipate variation. You build the interface, the factory, the registry and
the configuration for it. Then the variation never arrives, or arrives on a
different axis entirely, and now every reader of the code pays a permanent tax to
follow an indirection that never branches.

```text
   NotificationStrategy  ← interface
     └── EmailNotification   ← the only implementation, for four years
   NotificationStrategyFactory
   notification.strategy=email   ← in three config files

   cost: every reader traverses four files to find sendEmail()
   benefit: none, so far
```

==A wrong abstraction is more expensive than duplication==, and it is worse than
no abstraction, because the next person treats it as evidence that the axis
matters and adds their variation to it, deepening the wrong shape.

:::do
Use the rule of three. First case: write it directly. Second: write it directly
again and note the similarity. ++Third: now you can see the axis of variation
with evidence, and the abstraction you build will be the right shape.++ Two
points define a line through anything; three points tell you whether it is
straight.
:::

:::trap
!!"It is easier to build the abstraction now than to refactor later."!!

The reverse is true, and modern tooling is the reason. Extracting an interface
from three concrete implementations is a mechanical refactor your IDE can mostly
do. ++Removing a wrong abstraction that three teams have built on is a
negotiation.++ The asymmetry says: default to concrete, and let evidence pull you
toward abstraction.
:::

:::key
==Duplication is cheaper than the wrong abstraction.== Wait for the third case.
The principles tell you what to do when you know the axis of change; they do not
license you to guess it.
:::

## 14. SRP against DRY: the duplication you should keep

Two services compute a discount. The code is identical, twelve lines each. Every
instinct says extract it.

Ask who owns each one. If the first is the marketing team's promotional discount
and the second is the finance team's contractual discount, ==the identical code is
a coincidence, not a duplication.== They are the same today because both happen
to be ten percent. They will diverge the first time marketing runs a campaign,
and at that point the shared function grows a boolean parameter, then a second,
and you have built control coupling between two departments.

```text
   shared:   discount(amount, isPromo, isContract, region, tier)
                       ← every flag is one department's edit
                         landing in the other's code path
```

++The test is not "is this code the same". It is "will these change together".++
Same code, different actors, is duplication you keep. Different code, same actor,
is often a missing abstraction.

:::term Coincidental duplication
Two pieces of code that are currently identical but are governed by different
requirements. Merging them creates coupling between the requirements, which
surfaces later as boolean parameters and branching inside the shared function.
:::

:::key
==DRY is about knowledge, not text.== Martin Fowler's phrasing of the same idea:
every piece of knowledge should have a single authoritative representation. Two
copies of the same knowledge is duplication. Two identical strings governed by
different people is not.
:::

## 15. The smell catalogue: what a violation looks like in a diff

Principles are hard to apply while reading code. Smells are not. This is the
lookup table to use in review, and it is the practical output of the whole book.

| What you see in the diff | Likely principle | Why |
|---|---|---|
| A new `else if` in a long chain | O | The axis of variation is known; adding still edits |
| `instanceof` or a type switch on a subtype | L | Callers must know the concrete type |
| `throw new UnsupportedOperationException` | L, I | The type cannot honour the contract it claims |
| A boolean parameter that selects behaviour | S | Two behaviours, two actors, one function |
| A method with an unrelated third argument | S, I | The function serves more than one purpose |
| A domain class importing the ORM or HTTP layer | D | The arrow points at the volatile detail |
| An interface with one implementation, forever | (none) | Section 13, not a violation but a cost |
| A test that needs six mocks to run | I, D | The dependency surface is too wide |

The last row is the most useful in practice. ==Test setup pain is the most
reliable design smell there is==, because it measures exactly the thing the
principles are about: how much a piece of code must know about the rest of the
world in order to work. Notebook 03 covers reading a diff for these properly.

:::do
In review, do not write "this violates SRP". Write the change that will hurt:
"if finance changes the tax rule, this same function is where HR's report is
calculated, so we would be editing their behaviour too." ++A named future change
is arguable; a named principle is just an assertion of authority.++
:::

:::key
==Review for smells, not for letters.== The letters are for explaining a smell
once you have found it, and for talking to people who already know them.
:::

## 16. SOLID outside objects

Every one of these principles was written about class-based object-oriented code
in the 1980s and 1990s. Most backend code written now is services, functions and
data. Three of the five transfer cleanly; two need translation.

| Letter | Outside objects |
|---|---|
| S | Transfers exactly. A module, a service, a function: one actor |
| O | Transfers. Extension by adding a case to a dispatch table or a new handler |
| L | Becomes contract compatibility. The API version, the message schema |
| I | Becomes the narrow dependency. Ask for the two fields, not the whole record |
| D | Transfers exactly, and matters more across service boundaries than inside them |

==L is the one that changes character most.== Between services there is no
inheritance, so Liskov becomes a rule about schema evolution: a new version of a
producer must not strengthen what it demands of consumers, nor weaken what it
promises them. That is exactly the precondition and postcondition rule, moved
onto the wire, and it is why adding a required field to a request payload is a
breaking change while adding an optional one is not. Notebook 08 section 12 is
the same argument in the vocabulary of API versioning.

:::signal
"Liskov generalises past inheritance. Between services it is the compatibility
rule: do not strengthen what you require, do not weaken what you promise. A new
required request field is a strengthened precondition, which is why it breaks
every existing caller."
:::

:::key
==The five are about modules, not about classes.== The class-based phrasing is an
accident of when they were written.
:::

## 17. The critique: is SOLID still right?

You should know the strongest argument against the thing you are advocating. This
section is not a hedge; it is the most likely place for a senior interview to
find out whether you have thought about the subject or memorised it.

**The substantive criticisms, fairly stated:**

- ==They are vague enough to justify almost anything.== "Responsibility",
  "reason", and "one thing" have no measure. Two engineers can reach opposite
  conclusions from SRP on the same class, and both cite it.
- ==They were written for a world of expensive recompilation and inheritance
  hierarchies.== The costs that motivated some of them have fallen sharply.
- ==Four of the five push toward more indirection.== Applied without judgement
  they produce the abstraction problem in section 13, at scale.
- ==They say nothing about the things that dominate modern failure.== Concurrency,
  data modelling, failure handling, and operability are absent, and those are
  where systems actually break.

Dan North's 2021 talk *CUPID* argues the acronym should be retired and proposes
properties rather than principles: composable, Unix philosophy, predictable,
idiomatic, domain-based. Whether or not you find that convincing, ==the criticism
that SOLID describes code structure and not code experience is a real one.==

**The defence, which is also fair.** They are a shared vocabulary, and that alone
has enormous value: "this interface is too fat" lands in a code review because
both people have the same reference. They point in a direction that is right more
often than wrong for the middle layer of a business application. And most people
who dismiss them are reacting to the caricature in section 4's trap, not to the
sources.

:::signal
"I use them as a diagnostic vocabulary, not as a checklist. Their weakness is
that they are unfalsifiable enough to justify almost any refactor, so I try to
argue from the specific change I expect rather than from the letter."
:::

:::key
==Hold them as arguments, not as rules.== Being able to state the strongest
criticism of your own position is, reliably, the thing that reads as senior.
:::

:::recall When would you deliberately keep duplicated code, and what is the test? | 6
:::

:::recall Name four smells from section 15 and the principle each one points at. | 7
:::

:::recall Give the strongest criticism of SOLID, and your answer to it. | 6
:::

:::part IV | The interview itself

These principles are asked about at every level, and badly answered at most of
them, because almost everyone recites five expansions of five letters. The
material in Part III is what distinguishes an answer. This part is how to deliver
it.
:::

## 18. The delivery script

**When asked "what is SOLID", do not list the five.** Everyone lists the five.
Answer the question underneath first, then list them, in about forty seconds:

> "They are five heuristics about containing change. Each one is a different
> answer to the question of what has to change together. Single responsibility is
> about actors: one module should answer to one source of requirements.
> Open-closed is about adding rather than editing on the axis you expect to vary.
> Liskov is substitutability, and it generalises to schema compatibility between
> services. Interface segregation is depending on the narrowest thing that does
> the job. Dependency inversion is pointing the import arrow at whatever changes
> least, usually the business rules. In practice they conflict with each other
> and with YAGNI, so I treat them as arguments rather than rules."

That answer does five things at once: it names the unifying idea, it uses the
refined SRP, it generalises L past inheritance, it states D correctly as being
about direction, and it pre-empts the follow-up about over-abstraction.

**Then expect one of three follow-ups**, and have the concrete example ready:

| Follow-up | Go to |
|---|---|
| "Give me an example of a violation you fixed" | A real one. Section 15's smells |
| "Aren't these just excuses for over-engineering?" | Section 13, rule of three |
| "Which one is most important?" | D, and say why: it is the one that survives |

For the last one, a defensible answer: ==dependency inversion, because it is the
only one that determines what your code can outlive.== The others improve a
codebase; that one decides whether the business rules survive replacing the
database.

:::key
==Lead with the unifying question, not the list.== The list is table stakes and
signals nothing.
:::

## 19. Whiteboard: refactoring live

You will sometimes be handed a class and asked to improve it. The failure mode is
to start renaming things. Work in this order, out loud.

```text
   1. ASK WHO CHANGES IT      "who asks for changes to this? one team or three?"
            │                  establishes SRP by actor, and buys thinking time
            ▼
   2. FIND THE AXIS           "what has been added to this three times already?"
            │                  the conditional that grows is the axis for OCP
            ▼
   3. FOLLOW THE ARROWS       "what does this import? framework? driver?"
            │                  DIP violations are visible in the import block
            ▼
   4. NARROW THE DEPENDENCIES "of this repository, which methods are called?"
            │                  ISP, and it makes the tests obvious
            ▼
   5. STATE THE BET           "I am making X cheap and Y expensive, because..."
```

Step 5 is the one candidates skip and the one interviewers are waiting for.
==Every refactor makes something cheaper and something else more expensive==, and
saying which is what demonstrates that you are designing rather than tidying.

:::do
Ask about actors before you touch anything. It is the highest-information
question in the exercise, it is the one the refined SRP gives you, and it makes
the rest of the session a conversation about the business rather than a
performance of syntax.
:::

:::key
==Order: actors, axis, arrows, narrowness, the bet.== Never start with names.
:::

## 20. Follow-up question bank

Twenty questions, in rough order of how often they are asked. Answer each aloud
before checking the section.

| # | Question | Section |
|---|---|---|
| 1 | What does SRP actually mean by "responsibility"? | 5 |
| 2 | Give a violation of LSP from a standard library | 9 |
| 3 | What is inverted in dependency inversion? | 11 |
| 4 | Is DI the same as DIP? | 11 |
| 5 | Why is the square-rectangle problem a problem? | 9 |
| 6 | When should you not apply open-closed? | 13 |
| 7 | Does SRP conflict with DRY? | 14 |
| 8 | What is coincidental duplication? | 14 |
| 9 | How do you spot an ISP violation in review? | 15 |
| 10 | What does an `UnsupportedOperationException` usually mean? | 9 |
| 11 | Which SOLID principle matters most, and why? | 18 |
| 12 | How do these apply to services rather than classes? | 16 |
| 13 | What are the four Liskov conditions? | 9 |
| 14 | Why is a boolean parameter a smell? | 15 |
| 15 | What is the difference between cohesion and coupling? | 2 |
| 16 | Rank the kinds of coupling | 2 |
| 17 | What is wrong with SOLID? | 17 |
| 18 | Is separation of concerns the same as SRP? | 3 |
| 19 | When is duplication the right answer? | 14 |
| 20 | Whose principles are these, and when were they written? | 4 to 11 |

:::recall Deliver the forty-second answer from section 18 from memory, out loud, without listing the letters first. | 8
:::

:::part V | Appendices
:::

## Appendix A. The sources, and what each one actually says

Everything in this book traces to one of these. They are short, and reading two
of them puts you ahead of almost everyone who discusses this subject.

| Year | Who | What | The idea |
|---|---|---|---|
| 1968 to 1974 | Larry Constantine | Structured design | Cohesion and coupling |
| 1974 | Edsger Dijkstra | *On the role of scientific thought* | Separation of concerns |
| 1987 | Barbara Liskov | OOPSLA keynote | Substitutability |
| 1987 | Ian Holland et al. | Northeastern University | The Law of Demeter |
| 1988 | Bertrand Meyer | *Object-Oriented Software Construction* | Open-closed, by inheritance |
| 1994 | Liskov and Wing | *A Behavioral Notion of Subtyping* | The four conditions |
| 1996 | Robert Martin | *The Dependency Inversion Principle* | Inverting the arrow |
| 1996 onward | Robert Martin | `C++ Report` columns | OCP restated polymorphically; ISP |
| c. 2004 | Michael Feathers | | Coined the acronym SOLID |
| 2017 | Robert Martin | *Clean Architecture* | SRP refined to actors |
| 2021 | Dan North | *CUPID* | The case against the acronym |

==Note the gap between 1996 and 2004.== The principles existed for nearly a decade
before the acronym did, which is the clearest evidence that the acronym is a
teaching device rather than a theory.

**One principle that is not in SOLID and is asked about anyway.** The %%Law of
Demeter%%, or "principle of least knowledge": a method should only call methods
on itself, its own fields, its parameters, and objects it creates. The practical
form is that ++a chain like `order.getCustomer().getAddress().getCity()` couples
you to three classes' internal structure++, and any of the three can break you.

## Appendix B. The one-page summary

```text
   THE QUESTION      what has to change together?

   S   one actor per module          who can ask for a change?
   O   open on the varying axis      what has been added three times?
   L   no surprises for callers      can it stand in for its parent?
   I   narrow dependencies           which methods do you actually call?
   D   arrow points at the stable    does the rule import the detail?

   THE COUNTERWEIGHTS

   YAGNI            wait for the third case before abstracting
   coincidental     same code, different actors, keep both
     duplication
   the bet          say what you made cheap and what you made expensive

   THE SMELLS

   growing else-if chain      →  O
   instanceof in a caller     →  L
   UnsupportedOperation       →  L, I
   boolean parameter          →  S
   domain imports the ORM     →  D
   six mocks in a test        →  I, D
```

## Appendix C. Glossary

:::glossary
:::

## Appendix D. Self-test

:::quiz Q1 | 09 / 01 | 6
State the one question this book hangs on, and say why "one thing per class" is
not a usable test.
:::

:::quiz Q2 | 09 / 02 | 6
Define cohesion and coupling, and explain why optimising one alone is trivial.
:::

:::quiz Q3 | 09 / 05 | 6
Give Martin's 2017 formulation of SRP and the employee example that motivates it.
:::

:::quiz Q4 | 09 / 07 | 5
How do Meyer's and Martin's versions of the open-closed principle differ?
:::

:::quiz Q5 | 09 / 09 | 8
List the four Liskov conditions, then explain the square-rectangle failure using
the one it breaks.
:::

:::quiz Q6 | 09 / 11 | 6
What exactly is inverted, and why does using a DI container not achieve it?
:::

:::quiz Q7 | 09 / 13 | 6
State the rule of three and explain why a wrong abstraction costs more than
duplication.
:::

:::quiz Q8 | 09 / 14 | 6
When is identical code not duplication? Give the test.
:::

:::quiz Q9 | 09 / 16 | 6
How does Liskov's principle apply between two services with no inheritance?
:::

:::quiz Q10 | 09 / 17 | 7
Give the strongest criticism of SOLID and your answer to it.
:::
