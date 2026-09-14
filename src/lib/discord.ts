/**
 * Posting to the Binary Semaphore Discord server from the site.
 *
 * Uses a channel webhook, not the admin bot. A webhook URL can do one thing,
 * post into one channel, so it is the right secret for Vercel to hold. The bot
 * token, which can reshape the server, stays on a laptop in
 * tools/discord-admin-mcp/.env.
 *
 * Every function here returns an outcome instead of throwing: a notification
 * must never turn a successful publish into a failed one.
 */

export type Announcement = "sent" | "skipped" | "failed";

export type ThreadForDiscord = {
  title: string;
  summary: string | null;
  slug: string;
};

const SITE_URL = "https://binarysemaphore.com";

/** What the post in #threads says. Discord unfurls the link into a card. */
export function threadAnnouncement(thread: ThreadForDiscord): string {
  const lines = [`New thread: **${thread.title}**`];
  if (thread.summary) lines.push(thread.summary);
  lines.push(`${SITE_URL}/threads/${thread.slug}`);
  return lines.join("\n");
}

/**
 * Post a message through a Discord webhook.
 *
 * Skips when no URL is configured, so local development and previews stay
 * quiet. Never pings anyone: mentions in a summary are rendered as text.
 */
export async function postWebhook(
  content: string,
  webhookUrl: string | undefined = process.env.DISCORD_WEBHOOK_THREADS,
  fetchImpl: typeof fetch = fetch,
): Promise<Announcement> {
  if (!webhookUrl) return "skipped";
  try {
    const res = await fetchImpl(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        username: "Binary Semaphore",
        allowed_mentions: { parse: [] },
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error(`discord: webhook returned ${res.status}`);
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("discord: webhook failed", error);
    return "failed";
  }
}

/** Announce a thread's first publish in #threads. */
export function announceThread(
  thread: ThreadForDiscord,
  webhookUrl?: string,
  fetchImpl?: typeof fetch,
): Promise<Announcement> {
  return postWebhook(threadAnnouncement(thread), webhookUrl, fetchImpl);
}
