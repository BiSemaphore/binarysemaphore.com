/**
 * A small REST client for the Discord API, plus permission bitfield helpers.
 *
 * Deliberately not discord.js: every tool here is one or two REST calls, so a
 * gateway connection, a cache, and a dependency tree would all be accidental
 * complexity. Plain fetch against v10 is enough.
 */

const API = "https://discord.com/api/v10";
const MAX_RATE_LIMIT_RETRIES = 3;

export type Snowflake = string;

export type Overwrite = {
  id: Snowflake;
  /** 0 = role, 1 = member. */
  type: 0 | 1;
  allow: string;
  deny: string;
};

export type Role = {
  id: Snowflake;
  name: string;
  color: number;
  hoist: boolean;
  position: number;
  permissions: string;
  managed: boolean;
  mentionable: boolean;
};

export type Channel = {
  id: Snowflake;
  type: number;
  guild_id?: Snowflake;
  name?: string;
  position?: number;
  parent_id?: Snowflake | null;
  topic?: string | null;
  nsfw?: boolean;
  rate_limit_per_user?: number;
  permission_overwrites?: Overwrite[];
};

export type Guild = {
  id: Snowflake;
  name: string;
  owner_id: Snowflake;
  verification_level: number;
  explicit_content_filter: number;
  default_message_notifications: number;
  system_channel_id: Snowflake | null;
  rules_channel_id: Snowflake | null;
  features: string[];
  approximate_member_count?: number;
  approximate_presence_count?: number;
};

export type User = {
  id: Snowflake;
  username: string;
  global_name?: string | null;
  bot?: boolean;
};

export type Member = {
  user?: User;
  nick?: string | null;
  roles: Snowflake[];
  joined_at: string;
};

export type PartialGuild = { id: Snowflake; name: string };

/** A non-2xx response, carrying Discord's error body for the caller to show. */
export class DiscordError extends Error {
  status: number;
  body: unknown;

  constructor(method: string, path: string, status: number, body: unknown) {
    const detail =
      body && typeof body === "object" && "message" in body ? String(body.message) : "";
    super(`Discord ${method} ${path} failed with ${status}${detail ? `: ${detail}` : ""}`);
    this.name = "DiscordError";
    this.status = status;
    this.body = body;
  }
}

export type RequestOptions = {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Written to the server's audit log alongside the change. */
  reason?: string;
};

export type Fetch = typeof fetch;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function createDiscordClient(token: string, fetchImpl: Fetch = fetch) {
  async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
    const url = new URL(API + path);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    const headers: Record<string, string> = {
      Authorization: `Bot ${token}`,
      "User-Agent": "DiscordBot (https://github.com/BiSemaphore, 0.1.0)",
    };
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    // The header must be URL-encoded, or any non-ASCII reason is rejected.
    if (options.reason) headers["X-Audit-Log-Reason"] = encodeURIComponent(options.reason);
    const body = options.body === undefined ? undefined : JSON.stringify(options.body);

    for (let attempt = 0; ; attempt++) {
      const res = await fetchImpl(url, { method, headers, body });
      const text = await res.text();
      const data: unknown = text ? safeJson(text) : undefined;

      if (res.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
        // retry_after is in seconds and may be fractional.
        const seconds =
          data && typeof data === "object" && "retry_after" in data
            ? Number(data.retry_after)
            : Number(res.headers.get("retry-after") ?? 1);
        await sleep(Math.ceil((Number.isFinite(seconds) ? seconds : 1) * 1000) + 50);
        continue;
      }
      if (!res.ok) throw new DiscordError(method, path, res.status, data);
      return data as T;
    }
  }

  return {
    request,
    get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
    post: <T>(path: string, options?: RequestOptions) => request<T>("POST", path, options),
    put: <T>(path: string, options?: RequestOptions) => request<T>("PUT", path, options),
    patch: <T>(path: string, options?: RequestOptions) => request<T>("PATCH", path, options),
    delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
  };
}

export type DiscordClient = ReturnType<typeof createDiscordClient>;

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// --- Permissions -----------------------------------------------------------

/**
 * Bit positions from the Discord permissions reference. Bit 47 is used by
 * Discord but not documented, so it decodes as BIT_47.
 */
export const PERMISSION_BITS = {
  CREATE_INSTANT_INVITE: 0,
  KICK_MEMBERS: 1,
  BAN_MEMBERS: 2,
  ADMINISTRATOR: 3,
  MANAGE_CHANNELS: 4,
  MANAGE_GUILD: 5,
  ADD_REACTIONS: 6,
  VIEW_AUDIT_LOG: 7,
  PRIORITY_SPEAKER: 8,
  STREAM: 9,
  VIEW_CHANNEL: 10,
  SEND_MESSAGES: 11,
  SEND_TTS_MESSAGES: 12,
  MANAGE_MESSAGES: 13,
  EMBED_LINKS: 14,
  ATTACH_FILES: 15,
  READ_MESSAGE_HISTORY: 16,
  MENTION_EVERYONE: 17,
  USE_EXTERNAL_EMOJIS: 18,
  VIEW_GUILD_INSIGHTS: 19,
  CONNECT: 20,
  SPEAK: 21,
  MUTE_MEMBERS: 22,
  DEAFEN_MEMBERS: 23,
  MOVE_MEMBERS: 24,
  USE_VAD: 25,
  CHANGE_NICKNAME: 26,
  MANAGE_NICKNAMES: 27,
  MANAGE_ROLES: 28,
  MANAGE_WEBHOOKS: 29,
  MANAGE_GUILD_EXPRESSIONS: 30,
  USE_APPLICATION_COMMANDS: 31,
  REQUEST_TO_SPEAK: 32,
  MANAGE_EVENTS: 33,
  MANAGE_THREADS: 34,
  CREATE_PUBLIC_THREADS: 35,
  CREATE_PRIVATE_THREADS: 36,
  USE_EXTERNAL_STICKERS: 37,
  SEND_MESSAGES_IN_THREADS: 38,
  USE_EMBEDDED_ACTIVITIES: 39,
  MODERATE_MEMBERS: 40,
  VIEW_CREATOR_MONETIZATION_ANALYTICS: 41,
  USE_SOUNDBOARD: 42,
  CREATE_GUILD_EXPRESSIONS: 43,
  CREATE_EVENTS: 44,
  USE_EXTERNAL_SOUNDS: 45,
  SEND_VOICE_MESSAGES: 46,
  SET_VOICE_CHANNEL_STATUS: 48,
  SEND_POLLS: 49,
  USE_EXTERNAL_APPS: 50,
  PIN_MESSAGES: 51,
  BYPASS_SLOWMODE: 52,
} as const;

export type PermissionName = keyof typeof PERMISSION_BITS;

export const PERMISSION_NAMES = Object.keys(PERMISSION_BITS) as [PermissionName, ...PermissionName[]];

const bitOf = (name: PermissionName) => 1n << BigInt(PERMISSION_BITS[name]);

/** Names for every set bit, in bit order. Bits Discord has not named yet come back as BIT_n. */
export function decodePermissions(bitfield: string | bigint): string[] {
  let bits = BigInt(bitfield);
  const names: string[] = [];
  const byBit = new Map<number, string>(
    Object.entries(PERMISSION_BITS).map(([name, bit]) => [bit, name]),
  );
  for (let bit = 0; bits > 0n; bit++, bits >>= 1n) {
    if (bits & 1n) names.push(byBit.get(bit) ?? `BIT_${bit}`);
  }
  return names;
}

/** A bitfield string, the form Discord expects, from permission names. */
export function encodePermissions(names: readonly PermissionName[]): string {
  return names.reduce((bits, name) => bits | bitOf(name), 0n).toString();
}

/** Administrator implies every permission. */
export function hasPermission(bitfield: string | bigint, name: PermissionName): boolean {
  const bits = BigInt(bitfield);
  return (bits & bitOf("ADMINISTRATOR")) !== 0n || (bits & bitOf(name)) !== 0n;
}

/** Guild-level permissions of a member: the union of @everyone and each role they hold. */
export function memberPermissions(guildId: Snowflake, roles: readonly Role[], memberRoleIds: readonly Snowflake[]): bigint {
  const held = new Set([guildId, ...memberRoleIds]);
  return roles.filter((r) => held.has(r.id)).reduce((bits, r) => bits | BigInt(r.permissions), 0n);
}

// --- Enumerations ----------------------------------------------------------

export const CHANNEL_TYPES = {
  text: 0,
  voice: 2,
  category: 4,
  announcement: 5,
  stage: 13,
  forum: 15,
  media: 16,
} as const;

export type ChannelTypeName = keyof typeof CHANNEL_TYPES;

export function channelTypeName(type: number): string {
  const entry = Object.entries(CHANNEL_TYPES).find(([, value]) => value === type);
  return entry ? entry[0] : `type_${type}`;
}

export const VERIFICATION_LEVELS = { NONE: 0, LOW: 1, MEDIUM: 2, HIGH: 3, VERY_HIGH: 4 } as const;
export const CONTENT_FILTERS = { DISABLED: 0, MEMBERS_WITHOUT_ROLES: 1, ALL_MEMBERS: 2 } as const;
export const NOTIFICATION_LEVELS = { ALL_MESSAGES: 0, ONLY_MENTIONS: 1 } as const;

export function nameOf(table: Record<string, number>, value: number): string {
  return Object.entries(table).find(([, v]) => v === value)?.[0] ?? String(value);
}
