import { describe, expect, it } from "vitest";
import { announceThread, postWebhook, threadAnnouncement } from "@/lib/discord";

const thread = { title: "Why a semaphore", summary: "The simplest primitive.", slug: "why-a-semaphore" };

describe("threadAnnouncement", () => {
  it("names the thread, carries the summary, and links to it", () => {
    expect(threadAnnouncement(thread)).toBe(
      "New thread: **Why a semaphore**\nThe simplest primitive.\nhttps://binarysemaphore.com/threads/why-a-semaphore",
    );
  });

  it("drops the summary line when there is none", () => {
    expect(threadAnnouncement({ ...thread, summary: null })).toBe(
      "New thread: **Why a semaphore**\nhttps://binarysemaphore.com/threads/why-a-semaphore",
    );
  });
});

describe("postWebhook", () => {
  it("skips without a URL and never calls fetch", async () => {
    let called = false;
    const fetchImpl = (async () => {
      called = true;
      return new Response(null, { status: 204 });
    }) as typeof fetch;
    expect(await postWebhook("hi", undefined, fetchImpl)).toBe("skipped");
    expect(called).toBe(false);
  });

  it("posts JSON with mentions disabled", async () => {
    let body: unknown;
    const fetchImpl = (async (_url: unknown, init?: RequestInit) => {
      body = JSON.parse(String(init?.body));
      return new Response(null, { status: 204 });
    }) as typeof fetch;
    expect(await announceThread(thread, "https://discord.com/api/webhooks/1/x", fetchImpl)).toBe("sent");
    expect(body).toEqual({
      content: threadAnnouncement(thread),
      username: "Binary Semaphore",
      allowed_mentions: { parse: [] },
    });
  });

  it("reports failure instead of throwing", async () => {
    const bad = (async () => new Response("nope", { status: 429 })) as typeof fetch;
    expect(await postWebhook("hi", "https://discord.com/api/webhooks/1/x", bad)).toBe("failed");
    const down = (async () => {
      throw new Error("ECONNRESET");
    }) as typeof fetch;
    expect(await postWebhook("hi", "https://discord.com/api/webhooks/1/x", down)).toBe("failed");
  });
});
