import type { Mentorship } from "./types";

/**
 * The one-to-one mentorship offer at learn.binarysemaphore.com.
 *
 * 300 lines of the old site.ts. It is edited far more often than anything
 * around it, so it gets its own file.
 */
export const mentorship: Mentorship = {
  eyebrow: "binary semaphore",
  headline: "Learn",
  headlineHand: "stuck on a paper? sit with someone who has been there",
  lead: "Not a course, and not another playlist you will not finish. One person, one hour, on the exact thing that stopped making sense. You say which paper and where it broke, and we start there.",
  // TODO(shahid): confirm and extend. These are the subjects your own
  // notebooks already cover, plus the two you named.
  stuckOn: [
    "core Java",
    "JavaScript",
    "databases and SQL",
    "operating systems",
    "computer networks",
    "system design",
    "my project viva",
    "I do not know where to start",
  ],
  how: [
    {
      step: "Tell us where it broke",
      body: "Which paper, and the point it stopped making sense. One line is enough. You do not have to explain it well, that is the job.",
    },
    {
      step: "We reply, and we talk",
      body: "A call, one to one. No slides. We work the actual question, on the actual problem in front of you.",
    },
    {
      step: "You keep the notes",
      body: "What we worked through, written down, so when you meet it again you are not starting from nothing.",
    },
  ],
  // TODO(shahid): how long a session runs, and how often one is available.
  // TODO(shahid): the page still offers Cal.com's default "15 Min Meeting"
  // and "30 Min Meeting". Rename one to something a student recognises, and
  // add "which paper" and "where it stopped making sense" as booking
  // questions, so the hour starts with the actual problem rather than
  // spending its first ten minutes finding it.
  bookingUrl: "https://cal.com/shahid-raza-813bdo",
  bring:
    "Bring the assignment, the lab sheet, the past paper, or the error you cannot get past.",
  isThis: [
    "One person, on a call, working your actual question",
    "Your paper, your lab sheet, your error, not a generic example",
    "Notes afterwards, so it survives the call",
    'Saying "I still do not get it" as many times as it takes',
  ],
  isNotThis: [
    "A course with a syllabus and a completion certificate",
    "A recorded playlist you will not finish",
    "Someone reading slides at you",
    "Doing your assignment for you",
  ],
  // Quoted from the Question Bank notebook, not written for this page.
  sampleQuestions: [
    {
      question: "If disk is the bottleneck, why is Postgres fast?",
      from: "Postgres",
    },
    {
      question:
        "We have 20 worker threads and P99 is climbing. Where do I start?",
      from: "Scaling and Performance",
    },
    {
      question: "How much memory does a streaming upload actually use?",
      from: "Object Storage",
    },
    {
      question:
        "Three injection contexts, the character that breaks each, and the one structural fix they share.",
      from: "Backend Security",
    },
  ],
  profiles: [
    {
      tag: "the backlog",
      said: "I never really got it in second year",
      title: "You have papers you did not clear",
      body: "The semester moved on without you and every new topic sits on top of the one you missed. We go back and find the actual floor, then build up from there. It is usually one idea, not twenty.",
    },
    {
      tag: "placement season",
      said: "I can write it, but I freeze when they ask",
      title: "You can do the work, not the interview",
      body: "Writing code and explaining code are different skills, and only one of them gets tested in a room. We practise saying it out loud, on your own projects, until the answer is yours.",
    },
    {
      tag: "the agent wrote it",
      said: "it works, I just cannot explain any of it",
      title: "You shipped it with AI and there is nothing behind it",
      body: "The assignment runs. Then the examiner asks why you used a hash map and the page is blank. We take your own code apart together until you can defend every decision in it, including the ones you did not make.",
    },
  ],
  workedExample: {
    label: "One question, taken apart",
    asked:
      "I built a chatbot over my college notes for my final year project. It answers confidently and it is wrong. Is the model bad?",
    steps: [
      {
        title: "Your question never meets your notes",
        body: "Both get turned into embeddings first: long lists of numbers positioned so that similar meanings sit near each other. What gets compared is the numbers, not the words.",
      },
      {
        title: "Closest is not the same as correct",
        body: "Retrieval hands back the chunk that sits nearest your question in that space. Nearest usually means worded alike. The chunk that actually answers you can be further away, and it loses.",
      },
      {
        title: "The model answers from what it was handed",
        body: "It never sees the rest of your notes. It writes a fluent answer from the wrong three paragraphs, and fluency is not a signal of anything.",
      },
    ],
    verdict:
      "So it is almost never the model. It is your chunking or your retrieval, and you can find out which in ten minutes by printing what got retrieved before you blame anything else. That printout is what we would open first.",
  },
  selfCheck: {
    title: "Ten questions, out loud",
    lead: "Not multiple choice. Say the answer aloud, properly, the way you would to an examiner. Tick it only if you actually could. Nothing here is sent anywhere.",
    questions: [
      {
        question: "What happens between typing a URL and the page appearing?",
        tag: "networks",
      },
      {
        question: "Why does an index make reads fast and writes slower?",
        tag: "databases",
      },
      {
        question:
          "What is the difference between a process and a thread, without saying \u201clightweight\u201d?",
        tag: "operating systems",
      },
      {
        question: "What does static actually mean in Java?",
        tag: "core java",
      },
      {
        question: "Why does the meaning of this change in JavaScript?",
        tag: "javascript",
      },
      {
        question:
          "Your service got slow. Name the first three things you would measure.",
        tag: "systems",
      },
      {
        question:
          "An agent wrote your code. Why did it choose that data structure?",
        tag: "ai",
      },
      {
        question:
          "What is an embedding, in one sentence, without the word vector?",
        tag: "ai",
      },
      {
        question:
          "What does MCP let a model do that handing it an API key does not?",
        tag: "ai",
      },
      {
        question: "Defend one design decision in your project for two minutes.",
        tag: "viva",
      },
    ],
    note: "The ones you left blank are the session.",
  },
  ai: {
    label: "AI, underneath",
    title: "Not prompt tips",
    lead: "Everyone will teach you what to type. Almost nobody will tell you what happens after you press enter, which is the part that decides whether you can debug it, defend it, or trust it.",
    stages: [
      {
        name: "Your question",
        body: "Split into tokens. Pieces of words, not words.",
      },
      {
        name: "Retrieval",
        body: "If there are documents, the nearest few get pulled in. This is where most projects break.",
      },
      {
        name: "Context",
        body: "Everything the model can see at once. It is not memory. Close the chat and it is gone.",
      },
      {
        name: "The answer",
        body: "Predicted a token at a time from what it was given. Confidence is not a signal.",
      },
    ],
    glossary: [
      {
        term: "embedding",
        body: "Text turned into a long list of numbers, arranged so that things meaning similar things end up near each other.",
      },
      {
        term: "context window",
        body: "How much the model can hold in view at once. Not a database, not memory, and it forgets completely.",
      },
      {
        term: "MCP",
        body: "A protocol. Your tool exposes functions the model is allowed to call, and describes them in a way it can read. The rest is plumbing.",
      },
      {
        term: "agent",
        body: "A loop. Pick a tool, look at the result, pick again, stop when done. That is the whole trick.",
      },
    ],
    honest:
      "What it cannot do is know whether it is right. That part is still yours, and it is the part a viva asks about.",
    proof: {
      body: "We are not teaching this from a blog post. We built inode, a knowledge base in Go with a real retrieval pipeline, pgvector, on-device models, and an MCP server that editors query directly. The notebooks come out of building it.",
      href: "https://binarysemaphore.com/projects/inode",
      label: "See inode",
    },
  },
  syllabus: [
    {
      branch: "core java",
      leaves: [
        "objects, properly",
        "collections",
        "memory and the GC",
        "threads",
      ],
    },
    {
      branch: "databases",
      leaves: ["SQL that runs", "indexes", "transactions", "postgres"],
    },
    {
      branch: "systems",
      leaves: ["operating systems", "networks", "caching", "scale"],
    },
    {
      branch: "javascript",
      leaves: ["the language", "async, honestly", "the browser", "node"],
      roadmap: "react",
    },
    {
      branch: "ai",
      leaves: ["what an LLM does", "embeddings and retrieval", "MCP", "agents"],
    },
  ],
  // TODO(shahid): how long a session runs and how often one is available
  // still belongs here, once you decide.
  session: [
    {
      label: "where",
      body: "A call, one to one. Screens shared both ways, so we are looking at the same thing.",
    },
    {
      label: "what we open",
      body: "Your code, your lab sheet, your past paper, and whichever notebook covers it.",
    },
    {
      label: "what you keep",
      body: "The notes from the hour, written up, so it survives the call.",
    },
    {
      label: "what we never do",
      body: "Type the assignment for you. We will sit there while you do, and argue about it.",
    },
  ],
  faq: [
    {
      q: "Do I need to know something first?",
      a: "No. Turning up knowing nothing about the topic is the ordinary case, not the embarrassing one.",
    },
    {
      q: "What if I cannot even explain the problem?",
      a: "Then working out what the question is becomes the first half of the hour. Bring the error message and we start there.",
    },
    {
      q: "Is this only backend?",
      a: "No. Core papers, JavaScript, and the AI topics above. The notebooks lean backend because that is what is written down so far.",
    },
    {
      q: "Will you do my assignment?",
      a: "No. You will do it, with someone next to you who has done it before.",
    },
    {
      q: "One hour was not enough.",
      a: "Then book another. There is no package to finish and nothing expires.",
    },
    {
      q: "Where do the notebooks come from?",
      a: "Most expand a lecture series by Sriniously on YouTube, credited on every notebook, and are free to read. The AI ones are written by us.",
    },
  ],
};

// --- Contact form ------------------------------------------------------
// When empty, the contact section falls back to a mailto button so the
// site works immediately. Paste your Formspree form ID (the part after
// "/f/" in your endpoint) to switch on the real form.;
