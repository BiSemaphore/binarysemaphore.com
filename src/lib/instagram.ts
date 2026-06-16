/**
 * Instagram feed via the Instagram Graph API ("Instagram API with Instagram
 * Login"). Requires a Business/Creator account, a Meta app, and a long-lived
 * access token stored as the INSTAGRAM_TOKEN env var.
 *
 * Note: the older Instagram Basic Display API was shut down on 2024-12-04, so
 * the Graph API is the only first-party way to read your own media now.
 *
 * When INSTAGRAM_TOKEN is unset, this returns an empty list so the site still
 * builds and renders a "follow" fallback instead of failing.
 */

export type IgMediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";

export type IgPost = {
  id: string;
  caption?: string;
  mediaType: IgMediaType;
  /** Best display image: thumbnail for video, media_url otherwise. */
  image: string;
  permalink: string;
  timestamp: string;
};

type RawMedia = {
  id: string;
  caption?: string;
  media_type: IgMediaType;
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
};

const ENDPOINT = "https://graph.instagram.com/me/media";
const FIELDS =
  "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";

/** Fetch the most recent posts. Cached/revalidated hourly (ISR). */
export async function getInstagramPosts(limit = 6): Promise<IgPost[]> {
  const token = process.env.INSTAGRAM_TOKEN;
  if (!token) return [];

  const url = `${ENDPOINT}?fields=${FIELDS}&limit=${limit}&access_token=${token}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      console.error(`[instagram] ${res.status} ${await res.text()}`);
      return [];
    }
    const json = (await res.json()) as { data?: RawMedia[] };
    return (json.data ?? [])
      .map((m): IgPost | null => {
        const image = m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url;
        if (!image) return null;
        return {
          id: m.id,
          caption: m.caption,
          mediaType: m.media_type,
          image,
          permalink: m.permalink,
          timestamp: m.timestamp,
        };
      })
      .filter((m): m is IgPost => m !== null);
  } catch (err) {
    console.error("[instagram] fetch error", err);
    return [];
  }
}
