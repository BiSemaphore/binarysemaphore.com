/**
 * Learning roadmaps for learn.binarysemaphore.com.
 *
 * A roadmap is a map, not a reading list. The notebooks are organised by topic,
 * which is how a writer organises material; a student arrives with a goal
 * instead ("I need to learn React"), and the two do not line up. A roadmap
 * reorders the same territory by goal and says plainly what is covered by
 * something we wrote, what is covered by the canonical reference, and what is
 * only really learned by sitting with someone.
 *
 * Three rules this file holds to:
 *
 * 1. Nothing here claims we have written something we have not. A stop with no
 *    `notebook` says so by omission, and the page renders that honestly.
 * 2. References point at the canonical source (MDN for the platform, react.dev
 *    for React), never at a content farm. If we later write a notebook for a
 *    stop, the notebook link joins the reference rather than replacing it.
 * 3. Every stop can be the start of a session, because "stuck here" is the
 *    thing we are actually offering.
 */

/** Where a stop's material lives, if it lives anywhere yet. */
export type StopSource = {
  /** Canonical documentation. */
  href: string;
  /** e.g. "MDN", "react.dev". */
  label: string;
};

export type Stop = {
  /** The thing to learn, in the words a student would use. */
  title: string;
  /** Why it matters, or the misconception it clears up. One or two sentences. */
  body: string;
  /** The canonical reference, where one exists. */
  source?: StopSource;
  /** Slug of one of our notebooks, when one genuinely covers this. */
  notebook?: string;
  /**
   * Marks the handful of stops that are the usual wall. The page treats these
   * differently, because "everyone gets stuck here" is more useful to read than
   * another identical card.
   */
  wall?: boolean;
};

export type Stage = {
  /** Short label for the stage, lowercase, in the page's voice. */
  name: string;
  /** One line on what changes for you by the end of this stage. */
  goal: string;
  stops: Stop[];
};

export type Roadmap = {
  slug: string;
  title: string;
  /** The one-line pitch, used on the index card and the page header. */
  blurb: string;
  /** Who this is for, said plainly. */
  audience: string;
  /** The honest warning that belongs at the top of this particular map. */
  caution: string;
  stages: Stage[];
};

const REACT: Roadmap = {
  slug: "react",
  title: "React",
  blurb:
    "From the JavaScript you actually need, through React's model, to shipping something you can defend in a viva.",
  audience:
    "You have been told to learn React, or your project needs a front end, and every tutorial assumes JavaScript you were never taught.",
  caution:
    "Most people who say they are stuck on React are stuck on JavaScript. Stage one is not a warm-up, and skipping it is the single most common reason the rest of this stops making sense.",
  stages: [
    {
      name: "the javascript underneath",
      goal: "You can read a React file and know which parts are React and which parts are just the language.",
      stops: [
        {
          title: "Values, and the two equals",
          body: "What is actually in a variable, and why == and === are not the same question. Every confusing bug in your first month lives here.",
          source: {
            href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness",
            label: "MDN",
          },
        },
        {
          title: "Functions that return functions",
          body: "Closures. If this is fuzzy, hooks will never make sense, because a hook is a closure with a rule attached.",
          source: {
            href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures",
            label: "MDN",
          },
          wall: true,
        },
        {
          title: "map, filter, reduce",
          body: "Rendering a list in React is map. Not a nice-to-have: you will write it on your first day and every day after.",
          source: {
            href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array",
            label: "MDN",
          },
        },
        {
          title: "Destructuring and spread",
          body: "Half of React's syntax is this and nothing more. Once you see it, props stop looking like magic.",
          source: {
            href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring",
            label: "MDN",
          },
        },
        {
          title: "Modules: import and export",
          body: "Where code comes from, and why the path matters. This is also the first thing that breaks when you copy code from a tutorial.",
          source: {
            href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules",
            label: "MDN",
          },
        },
        {
          title: "async, await, and the event loop",
          body: "Why your data is undefined on the first render. Not a React problem, a JavaScript one, and the fix is understanding when things happen.",
          source: {
            href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises",
            label: "MDN",
          },
          wall: true,
        },
      ],
    },
    {
      name: "the browser it sits on",
      goal: "You know what React is replacing, so you can tell when you do not need it.",
      stops: [
        {
          title: "The DOM is a tree",
          body: "React's whole job is keeping this tree in step with your data. Knowing what it is doing by hand makes the abstraction honest instead of mysterious.",
          source: {
            href: "https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction",
            label: "MDN",
          },
        },
        {
          title: "Events, and what bubbling means",
          body: "Clicks, typing, submitting. React wraps these but does not change the model underneath.",
          source: {
            href: "https://developer.mozilla.org/en-US/docs/Web/API/Event",
            label: "MDN",
          },
        },
        {
          title: "fetch, JSON, and the network tab",
          body: "How your page talks to a server, and how to see it happening. The network tab answers more questions than any tutorial.",
          source: {
            href: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch",
            label: "MDN",
          },
          notebook: "rest-api-design",
        },
        {
          title: "node, npm, and what a bundler does",
          body: "Why a browser language needs a build step at all. Worth an hour so the tooling stops feeling like weather.",
        },
      ],
    },
    {
      name: "react's actual model",
      goal: "You can build a screen from scratch without copying one.",
      stops: [
        {
          title: "JSX is a function call",
          body: "Look at what JSX compiles to once and the syntax stops being a language you have to trust.",
          source: {
            href: "https://react.dev/learn/writing-markup-with-jsx",
            label: "react.dev",
          },
        },
        {
          title: "Components and props",
          body: "One-way data flow: data goes down, and that constraint is the whole reason React scales.",
          source: {
            href: "https://react.dev/learn/passing-props-to-a-component",
            label: "react.dev",
          },
        },
        {
          title: "State, and why the screen changes",
          body: "The mental model worth carrying: your UI is a function of your state. You do not update the page, you update the state and let React work out the page.",
          source: {
            href: "https://react.dev/learn/state-a-components-memory",
            label: "react.dev",
          },
          wall: true,
        },
        {
          title: "Lists and keys",
          body: "Why React shouts about keys, and what actually goes wrong when you use the array index.",
          source: {
            href: "https://react.dev/learn/rendering-lists",
            label: "react.dev",
          },
        },
        {
          title: "Forms and controlled inputs",
          body: "The point where most people first fight the framework. There is a rule here, and once you have it forms stop being painful.",
          source: {
            href: "https://react.dev/reference/react-dom/components/input",
            label: "react.dev",
          },
        },
      ],
    },
    {
      name: "effects and real data",
      goal: "Your app talks to a server without lying to the user about what is happening.",
      stops: [
        {
          title: "Most useEffect is wrong",
          body: "Including in the tutorial you learned it from. Learn what an effect is for before you learn its syntax, and you will write a tenth as many.",
          source: {
            href: "https://react.dev/learn/you-might-not-need-an-effect",
            label: "react.dev",
          },
          wall: true,
        },
        {
          title: "Loading, error, empty",
          body: "Three states every screen has and most student projects forget. This is the difference between a demo and something someone can use.",
        },
        {
          title: "Cleanup and race conditions",
          body: "Two requests, the slow one lands last, the wrong data wins. Everyone hits this; almost nobody is taught it.",
          source: {
            href: "https://react.dev/learn/synchronizing-with-effects",
            label: "react.dev",
          },
        },
        {
          title: "Where the data actually lives",
          body: "Sooner or later the answer is a database, and the shape you choose there decides how hard your front end has to work.",
          notebook: "postgres",
        },
      ],
    },
    {
      name: "structure, once it grows",
      goal: "You can add a feature to your own app without dreading it.",
      stops: [
        {
          title: "Composition instead of prop drilling",
          body: "The first real design decision you will make. Usually the answer is a better shape, not a bigger library.",
          source: {
            href: "https://react.dev/learn/passing-data-deeply-with-context",
            label: "react.dev",
          },
        },
        {
          title: "Custom hooks",
          body: "Pulling logic out of a component without pulling it into a library. This is where React starts feeling like a language rather than a chore.",
          source: {
            href: "https://react.dev/learn/reusing-logic-with-custom-hooks",
            label: "react.dev",
          },
        },
        {
          title: "Routing",
          body: "More than one page, and the URL as state you do not own.",
        },
        {
          title: "When you do not need a state library",
          body: "Which is more often than the internet suggests. Knowing when you genuinely do is worth more than knowing any particular one.",
        },
        {
          title: "Auth, and who is allowed to do what",
          body: "Logging in is the easy half. Authorisation on every request is the half that gets projects marked down, and it is a backend problem wearing a frontend costume.",
          notebook: "security",
        },
      ],
    },
    {
      name: "shipping it",
      goal: "It is on the internet and it does not fall over in the demo.",
      stops: [
        {
          title: "Build, deploy, and a real URL",
          body: "A project that only runs on your laptop is hard to defend and impossible to show.",
        },
        {
          title: "Accessibility, the basic version",
          body: "Labels, focus, keyboard. Cheap to do from the start, miserable to retrofit the night before submission.",
          source: {
            href: "https://developer.mozilla.org/en-US/docs/Learn/Accessibility",
            label: "MDN",
          },
        },
        {
          title: "What actually re-renders",
          body: "Measure before you memoise. And note that the React Compiler now writes most of that memoisation for you, which changes the advice you will find in older tutorials.",
          source: {
            href: "https://react.dev/learn/react-compiler",
            label: "react.dev",
          },
        },
        {
          title: "Making it fast enough",
          body: "Perceived speed is mostly about what you do before the network answers. The systems side of this is the same everywhere.",
          notebook: "scaling",
        },
      ],
    },
    {
      name: "building with claude, honestly",
      goal: "You can move fast with an agent and still answer for every line of it.",
      stops: [
        {
          title: "Scaffolding with an agent",
          body: "What to hand it, what to keep. It is very good at the parts you already understand and dangerous at the parts you do not.",
          wall: true,
        },
        {
          title: "Reviewing what it wrote",
          body: "Reading unfamiliar code critically is a skill, and it is now the main one. Most of a session on this is spent slowing down and asking why.",
        },
        {
          title: "The viva test",
          body: "Point at any line and say why it is there. If you cannot, you do not own that code yet, whatever the commit history says.",
          wall: true,
        },
        {
          title: "What it cannot do for you",
          body: "It cannot know whether it is right. Judgement about your own domain stays yours, and that is precisely what an examiner is testing.",
        },
      ],
    },
  ],
};

export const roadmaps: Roadmap[] = [REACT];

export function getRoadmap(slug: string): Roadmap | undefined {
  return roadmaps.find((r) => r.slug === slug);
}

/** Total stops, for the index card. */
export function countStops(roadmap: Roadmap): number {
  return roadmap.stages.reduce((sum, stage) => sum + stage.stops.length, 0);
}
