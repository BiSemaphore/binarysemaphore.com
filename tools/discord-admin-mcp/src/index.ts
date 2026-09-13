/**
 * discord-admin-mcp: a local MCP server over stdio that lets Claude Code
 * inspect and restructure the Binary Semaphore Discord server.
 *
 * Three guards sit in front of every call, because the bot token can manage
 * roles and channels:
 *   1. DISCORD_GUILD_IDS is an allowlist. Anything outside it is refused, and
 *      tools that only take a channel id look the channel up to check.
 *   2. DISCORD_READ_ONLY=true refuses every write before it reaches Discord.
 *   3. Deletes require the exact name of the thing being deleted.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  CHANNEL_TYPES,
  CONTENT_FILTERS,
  DiscordError,
  NOTIFICATION_LEVELS,
  PERMISSION_NAMES,
  VERIFICATION_LEVELS,
  channelTypeName,
  createDiscordClient,
  decodePermissions,
  encodePermissions,
  hasPermission,
  memberPermissions,
  nameOf,
  type Channel,
  type Guild,
  type Member,
  type Overwrite,
  type PartialGuild,
  type PermissionName,
  type Role,
  type Snowflake,
  type User,
} from "./discord.ts";

// --- Config ----------------------------------------------------------------

const root = resolve(import.meta.dirname, "..");
try {
  process.loadEnvFile(resolve(root, ".env"));
} catch {
  // No .env is fine when the variables come from the MCP client config instead.
}

const token = process.env.DISCORD_BOT_TOKEN?.trim();
const guildIds = (process.env.DISCORD_GUILD_IDS ?? "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);
const readOnly = process.env.DISCORD_READ_ONLY === "true";

if (!token || guildIds.length === 0) {
  // stdout is the protocol channel, so diagnostics go to stderr.
  console.error(
    "discord-admin-mcp: set DISCORD_BOT_TOKEN and DISCORD_GUILD_IDS in tools/discord-admin-mcp/.env (see .env.example).",
  );
  process.exit(1);
}

const discord = createDiscordClient(token);
const defaultGuildId = guildIds[0]!;

// --- Guards and helpers ----------------------------------------------------

class GuardError extends Error {}

function guild(id: string | undefined): Snowflake {
  const guildId = id ?? defaultGuildId;
  if (!guildIds.includes(guildId)) {
    throw new GuardError(`Guild ${guildId} is not in DISCORD_GUILD_IDS. Allowed: ${guildIds.join(", ")}.`);
  }
  return guildId;
}

function assertWritable() {
  if (readOnly) throw new GuardError("DISCORD_READ_ONLY=true: writes are disabled.");
}

/** Fetch a channel and refuse it unless it belongs to an allowed guild. */
async function allowedChannel(channelId: Snowflake): Promise<Channel & { guild_id: Snowflake }> {
  const channel = await discord.get<Channel>(`/channels/${channelId}`);
  if (!channel.guild_id || !guildIds.includes(channel.guild_id)) {
    throw new GuardError(`Channel ${channelId} is not in an allowed guild.`);
  }
  return channel as Channel & { guild_id: Snowflake };
}

type BotContext = { user: User; permissions: bigint; highestPosition: number; roles: Role[] };

async function botContext(guildId: Snowflake): Promise<BotContext> {
  const [user, roles] = await Promise.all([
    discord.get<User>("/users/@me"),
    discord.get<Role[]>(`/guilds/${guildId}/roles`),
  ]);
  const member = await discord.get<Member>(`/guilds/${guildId}/members/${user.id}`);
  const held = roles.filter((r) => member.roles.includes(r.id));
  return {
    user,
    roles,
    permissions: memberPermissions(guildId, roles, member.roles),
    highestPosition: Math.max(0, ...held.map((r) => r.position)),
  };
}

/** A bot can only edit, assign, or delete roles strictly below its own highest role. */
function canManageRole(bot: BotContext, role: Role): boolean {
  return role.position < bot.highestPosition && !role.managed;
}

async function manageableRole(guildId: Snowflake, roleId: Snowflake): Promise<{ bot: BotContext; role: Role }> {
  const bot = await botContext(guildId);
  const role = bot.roles.find((r) => r.id === roleId);
  if (!role) throw new GuardError(`Role ${roleId} does not exist in guild ${guildId}.`);
  if (!canManageRole(bot, role)) {
    throw new GuardError(
      `The bot cannot manage "${role.name}" (position ${role.position}${role.managed ? ", managed by an integration" : ""}). ` +
        `Its highest role is at position ${bot.highestPosition}; move the bot role above this one first.`,
    );
  }
  return { bot, role };
}

/** Discord refuses to let a bot grant permissions it does not hold itself. */
function assertCanGrant(bot: BotContext, names: readonly PermissionName[]) {
  const missing = names.filter((name) => !hasPermission(bot.permissions, name));
  if (missing.length > 0) {
    throw new GuardError(`The bot cannot grant permissions it does not have: ${missing.join(", ")}.`);
  }
}

const result = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

/** Runs a handler, turning guard and Discord failures into tool errors the model can read. */
async function run(handler: () => Promise<unknown>) {
  try {
    return result(await handler());
  } catch (error) {
    const message =
      error instanceof DiscordError
        ? `${error.message}\n${JSON.stringify(error.body, null, 2)}`
        : error instanceof Error
          ? error.message
          : String(error);
    return { content: [{ type: "text" as const, text: message }], isError: true };
  }
}

function hexColor(color: number): string | null {
  return color === 0 ? null : `#${color.toString(16).padStart(6, "0")}`;
}

function parseColor(hex: string): number {
  return Number.parseInt(hex.replace(/^#/, ""), 16);
}

/**
 * Resolves an overwrite target. "@everyone" is the guild id; a snowflake is
 * used as given; anything else is looked up as an exact role name.
 */
async function resolveTarget(
  guildId: Snowflake,
  target: string,
  type: "role" | "member" | undefined,
): Promise<{ id: Snowflake; type: 0 | 1 }> {
  if (target === "@everyone") return { id: guildId, type: 0 };
  if (/^\d{17,20}$/.test(target)) return { id: target, type: type === "member" ? 1 : 0 };
  const roles = await discord.get<Role[]>(`/guilds/${guildId}/roles`);
  const matches = roles.filter((r) => r.name === target);
  if (matches.length !== 1) {
    throw new GuardError(
      matches.length === 0
        ? `No role named "${target}". Use "@everyone", a role or user id, or an exact role name.`
        : `${matches.length} roles are named "${target}". Use the role id instead.`,
    );
  }
  return { id: matches[0]!.id, type: 0 };
}

function describeOverwrites(overwrites: Overwrite[] | undefined, guildId: Snowflake, roles: Role[]) {
  return (overwrites ?? []).map((o) => ({
    target:
      o.id === guildId ? "@everyone" : o.type === 0 ? (roles.find((r) => r.id === o.id)?.name ?? o.id) : `member:${o.id}`,
    id: o.id,
    type: o.type === 0 ? "role" : "member",
    allow: decodePermissions(o.allow),
    deny: decodePermissions(o.deny),
  }));
}

// --- Schemas ---------------------------------------------------------------

const snowflake = z.string().regex(/^\d{17,20}$/, "a Discord id (17 to 20 digits)");
const guildIdField = snowflake
  .optional()
  .describe("Guild id. Defaults to the first id in DISCORD_GUILD_IDS; must be in that list.");
const reason = z.string().max(512).optional().describe("Recorded in the server audit log.");
const permissionList = z.array(z.enum(PERMISSION_NAMES));
const overwriteInput = z.object({
  target: z.string().describe('"@everyone", a role id, a user id, or an exact role name.'),
  type: z.enum(["role", "member"]).optional().describe("Needed only when target is a user id: use member."),
  allow: permissionList.default([]),
  deny: permissionList.default([]),
});
const colorField = z
  .string()
  .regex(/^#?[0-9a-fA-F]{6}$/, "a hex colour like #00a6fb")
  .optional();

async function buildOverwrites(guildId: Snowflake, inputs: z.infer<typeof overwriteInput>[]) {
  return Promise.all(
    inputs.map(async (o) => ({
      ...(await resolveTarget(guildId, o.target, o.type)),
      allow: encodePermissions(o.allow),
      deny: encodePermissions(o.deny),
    })),
  );
}

// --- Server ----------------------------------------------------------------

const server = new McpServer(
  { name: "discord-admin", version: "0.1.0" },
  {
    instructions: [
      "Tools for inspecting and restructuring the Binary Semaphore Discord server.",
      "Start with get_server_overview. Before any change that touches more than one channel or role, call snapshot_server, then show the user the complete plan (every channel, role, and permission change) and wait for approval.",
      "Always ask before delete_channel, delete_role, remove_member_role, update_server_settings, or send_message, even inside an approved plan.",
      "The bot can only manage roles below its own highest role and can only grant permissions it holds; get_server_overview reports both.",
      readOnly ? "This server is running with DISCORD_READ_ONLY=true, so every write tool will refuse." : "",
    ]
      .filter(Boolean)
      .join(" "),
  },
);

const READ = { readOnlyHint: true, openWorldHint: true } as const;
const WRITE = { readOnlyHint: false, destructiveHint: false, openWorldHint: true } as const;
const DESTRUCTIVE = { readOnlyHint: false, destructiveHint: true, openWorldHint: true } as const;

server.registerTool(
  "list_guilds",
  {
    description: "List the guilds the bot is in, and which of them this server is allowed to act on.",
    inputSchema: {},
    annotations: READ,
  },
  () =>
    run(async () => {
      const guilds = await discord.get<PartialGuild[]>("/users/@me/guilds");
      return guilds.map((g) => ({
        id: g.id,
        name: g.name,
        allowed: guildIds.includes(g.id),
        default: g.id === defaultGuildId,
      }));
    }),
);

server.registerTool(
  "get_server_overview",
  {
    description:
      "Everything needed to plan a redesign: server settings and counts, roles by position with decoded permissions and whether the bot can manage each, and channels grouped by category with decoded permission overwrites.",
    inputSchema: { guild_id: guildIdField },
    annotations: READ,
  },
  ({ guild_id }) =>
    run(async () => {
      const guildId = guild(guild_id);
      const [info, channels, bot] = await Promise.all([
        discord.get<Guild>(`/guilds/${guildId}`, { query: { with_counts: true } }),
        discord.get<Channel[]>(`/guilds/${guildId}/channels`),
        botContext(guildId),
      ]);
      const { roles } = bot;
      const byPosition = (a: Channel, b: Channel) => (a.position ?? 0) - (b.position ?? 0);
      const describe = (c: Channel) => ({
        id: c.id,
        name: c.name,
        type: channelTypeName(c.type),
        position: c.position,
        ...(c.topic ? { topic: c.topic } : {}),
        ...(c.nsfw ? { nsfw: true } : {}),
        ...(c.rate_limit_per_user ? { slowmode_seconds: c.rate_limit_per_user } : {}),
        overwrites: describeOverwrites(c.permission_overwrites, guildId, roles),
      });
      const categories = channels.filter((c) => c.type === CHANNEL_TYPES.category).sort(byPosition);

      return {
        guild: {
          id: info.id,
          name: info.name,
          owner_id: info.owner_id,
          members: info.approximate_member_count,
          online: info.approximate_presence_count,
          verification_level: nameOf(VERIFICATION_LEVELS, info.verification_level),
          explicit_content_filter: nameOf(CONTENT_FILTERS, info.explicit_content_filter),
          default_message_notifications: nameOf(NOTIFICATION_LEVELS, info.default_message_notifications),
          system_channel_id: info.system_channel_id,
          rules_channel_id: info.rules_channel_id,
          features: info.features,
        },
        bot: {
          id: bot.user.id,
          username: bot.user.username,
          highest_role_position: bot.highestPosition,
          permissions: decodePermissions(bot.permissions),
          read_only: readOnly,
        },
        roles: [...roles]
          .sort((a, b) => b.position - a.position)
          .map((r) => ({
            id: r.id,
            name: r.name,
            position: r.position,
            color: hexColor(r.color),
            hoist: r.hoist,
            mentionable: r.mentionable,
            managed: r.managed,
            permissions: decodePermissions(r.permissions),
            bot_can_manage: canManageRole(bot, r),
          })),
        channels: {
          uncategorized: channels
            .filter((c) => c.type !== CHANNEL_TYPES.category && !c.parent_id)
            .sort(byPosition)
            .map(describe),
          categories: categories.map((category) => ({
            ...describe(category),
            channels: channels.filter((c) => c.parent_id === category.id).sort(byPosition).map(describe),
          })),
        },
      };
    }),
);

server.registerTool(
  "snapshot_server",
  {
    description:
      "Save the raw guild, roles, and channels as JSON under tools/discord-admin-mcp/snapshots/. Take one before any redesign so the previous state can be rebuilt.",
    inputSchema: { guild_id: guildIdField, label: z.string().regex(/^[a-z0-9-]{1,40}$/).optional() },
    annotations: { ...READ, readOnlyHint: false, destructiveHint: false },
  },
  ({ guild_id, label }) =>
    run(async () => {
      const guildId = guild(guild_id);
      const [info, roles, channels] = await Promise.all([
        discord.get<Guild>(`/guilds/${guildId}`, { query: { with_counts: true } }),
        discord.get<Role[]>(`/guilds/${guildId}/roles`),
        discord.get<Channel[]>(`/guilds/${guildId}/channels`),
      ]);
      const takenAt = new Date().toISOString();
      const dir = resolve(root, "snapshots");
      await mkdir(dir, { recursive: true });
      const file = resolve(dir, `${guildId}-${takenAt.replace(/[:.]/g, "-")}${label ? `-${label}` : ""}.json`);
      await writeFile(file, JSON.stringify({ taken_at: takenAt, guild: info, roles, channels }, null, 2) + "\n");
      return { file, roles: roles.length, channels: channels.length };
    }),
);

server.registerTool(
  "create_channel",
  {
    description: "Create a channel or category. Overwrites set per-role or per-member permissions on it.",
    inputSchema: {
      guild_id: guildIdField,
      name: z.string().min(1).max(100),
      type: z.enum(Object.keys(CHANNEL_TYPES) as [keyof typeof CHANNEL_TYPES]).default("text"),
      parent_id: snowflake.optional().describe("Category to place it in."),
      topic: z.string().max(1024).optional(),
      slowmode_seconds: z.number().int().min(0).max(21600).optional(),
      nsfw: z.boolean().optional(),
      position: z.number().int().min(0).optional(),
      overwrites: z.array(overwriteInput).optional(),
      reason,
    },
    annotations: WRITE,
  },
  (input) =>
    run(async () => {
      assertWritable();
      const guildId = guild(input.guild_id);
      const channel = await discord.post<Channel>(`/guilds/${guildId}/channels`, {
        reason: input.reason,
        body: {
          name: input.name,
          type: CHANNEL_TYPES[input.type],
          parent_id: input.parent_id,
          topic: input.topic,
          rate_limit_per_user: input.slowmode_seconds,
          nsfw: input.nsfw,
          position: input.position,
          permission_overwrites: input.overwrites ? await buildOverwrites(guildId, input.overwrites) : undefined,
        },
      });
      return { id: channel.id, name: channel.name, type: channelTypeName(channel.type), parent_id: channel.parent_id };
    }),
);

server.registerTool(
  "update_channel",
  {
    description:
      "Change a channel's name, topic, category, slowmode, or NSFW flag. Passing overwrites replaces every overwrite on the channel; to change one target use set_channel_permission.",
    inputSchema: {
      channel_id: snowflake,
      name: z.string().min(1).max(100).optional(),
      topic: z.string().max(1024).nullable().optional(),
      parent_id: snowflake.nullable().optional().describe("null moves it out of its category."),
      slowmode_seconds: z.number().int().min(0).max(21600).optional(),
      nsfw: z.boolean().optional(),
      overwrites: z.array(overwriteInput).optional(),
      reason,
    },
    annotations: WRITE,
  },
  (input) =>
    run(async () => {
      assertWritable();
      const channel = await allowedChannel(input.channel_id);
      const updated = await discord.patch<Channel>(`/channels/${channel.id}`, {
        reason: input.reason,
        body: {
          name: input.name,
          topic: input.topic,
          parent_id: input.parent_id,
          rate_limit_per_user: input.slowmode_seconds,
          nsfw: input.nsfw,
          permission_overwrites: input.overwrites ? await buildOverwrites(channel.guild_id, input.overwrites) : undefined,
        },
      });
      return { id: updated.id, name: updated.name, parent_id: updated.parent_id, topic: updated.topic };
    }),
);

server.registerTool(
  "delete_channel",
  {
    description:
      "Delete a channel or category, permanently, with its message history. Deleting a category leaves its channels uncategorized. confirm_name must equal the channel's current name.",
    inputSchema: { channel_id: snowflake, confirm_name: z.string(), reason },
    annotations: DESTRUCTIVE,
  },
  ({ channel_id, confirm_name, reason: why }) =>
    run(async () => {
      assertWritable();
      const channel = await allowedChannel(channel_id);
      if (confirm_name !== channel.name) {
        throw new GuardError(`confirm_name "${confirm_name}" does not match the channel name "${channel.name}".`);
      }
      await discord.delete(`/channels/${channel.id}`, { reason: why });
      return { deleted: { id: channel.id, name: channel.name, type: channelTypeName(channel.type) } };
    }),
);

server.registerTool(
  "set_channel_permission",
  {
    description:
      "Set the permission overwrite for one role or member on one channel. This replaces that target's existing overwrite: list everything it should allow and deny, not only the change.",
    inputSchema: { channel_id: snowflake, ...overwriteInput.shape, reason },
    annotations: WRITE,
  },
  (input) =>
    run(async () => {
      assertWritable();
      const channel = await allowedChannel(input.channel_id);
      const target = await resolveTarget(channel.guild_id, input.target, input.type);
      await discord.put(`/channels/${channel.id}/permissions/${target.id}`, {
        reason: input.reason,
        body: { type: target.type, allow: encodePermissions(input.allow), deny: encodePermissions(input.deny) },
      });
      return { channel: channel.name, target: input.target, id: target.id, allow: input.allow, deny: input.deny };
    }),
);

server.registerTool(
  "remove_channel_permission",
  {
    description: "Remove one role's or member's overwrite from a channel, so it falls back to the category and role permissions.",
    inputSchema: {
      channel_id: snowflake,
      target: overwriteInput.shape.target,
      type: overwriteInput.shape.type,
      reason,
    },
    annotations: DESTRUCTIVE,
  },
  (input) =>
    run(async () => {
      assertWritable();
      const channel = await allowedChannel(input.channel_id);
      const target = await resolveTarget(channel.guild_id, input.target, input.type);
      await discord.delete(`/channels/${channel.id}/permissions/${target.id}`, { reason: input.reason });
      return { channel: channel.name, removed: input.target, id: target.id };
    }),
);

server.registerTool(
  "create_role",
  {
    description: "Create a role. New roles start at the bottom; use set_role_positions to move them.",
    inputSchema: {
      guild_id: guildIdField,
      name: z.string().min(1).max(100),
      permissions: permissionList.default([]),
      color: colorField,
      hoist: z.boolean().optional().describe("Show members with this role separately in the member list."),
      mentionable: z.boolean().optional(),
      reason,
    },
    annotations: WRITE,
  },
  (input) =>
    run(async () => {
      assertWritable();
      const guildId = guild(input.guild_id);
      assertCanGrant(await botContext(guildId), input.permissions);
      const role = await discord.post<Role>(`/guilds/${guildId}/roles`, {
        reason: input.reason,
        body: {
          name: input.name,
          permissions: encodePermissions(input.permissions),
          color: input.color ? parseColor(input.color) : undefined,
          hoist: input.hoist,
          mentionable: input.mentionable,
        },
      });
      return { id: role.id, name: role.name, position: role.position, permissions: decodePermissions(role.permissions) };
    }),
);

server.registerTool(
  "update_role",
  {
    description: "Change a role's name, colour, hoist, mentionable flag, or permissions. permissions replaces the whole set.",
    inputSchema: {
      guild_id: guildIdField,
      role_id: snowflake,
      name: z.string().min(1).max(100).optional(),
      permissions: permissionList.optional(),
      color: colorField,
      hoist: z.boolean().optional(),
      mentionable: z.boolean().optional(),
      reason,
    },
    annotations: WRITE,
  },
  (input) =>
    run(async () => {
      assertWritable();
      const guildId = guild(input.guild_id);
      const { bot } = await manageableRole(guildId, input.role_id);
      if (input.permissions) assertCanGrant(bot, input.permissions);
      const role = await discord.patch<Role>(`/guilds/${guildId}/roles/${input.role_id}`, {
        reason: input.reason,
        body: {
          name: input.name,
          permissions: input.permissions ? encodePermissions(input.permissions) : undefined,
          color: input.color ? parseColor(input.color) : undefined,
          hoist: input.hoist,
          mentionable: input.mentionable,
        },
      });
      return { id: role.id, name: role.name, color: hexColor(role.color), permissions: decodePermissions(role.permissions) };
    }),
);

server.registerTool(
  "delete_role",
  {
    description: "Delete a role, permanently, removing it from every member. confirm_name must equal the role's current name.",
    inputSchema: { guild_id: guildIdField, role_id: snowflake, confirm_name: z.string(), reason },
    annotations: DESTRUCTIVE,
  },
  (input) =>
    run(async () => {
      assertWritable();
      const guildId = guild(input.guild_id);
      if (input.role_id === guildId) throw new GuardError("@everyone cannot be deleted.");
      const { role } = await manageableRole(guildId, input.role_id);
      if (input.confirm_name !== role.name) {
        throw new GuardError(`confirm_name "${input.confirm_name}" does not match the role name "${role.name}".`);
      }
      await discord.delete(`/guilds/${guildId}/roles/${role.id}`, { reason: input.reason });
      return { deleted: { id: role.id, name: role.name } };
    }),
);

server.registerTool(
  "set_role_positions",
  {
    description: "Reorder roles. Higher position means higher in the list and more authority. Roles must stay below the bot's highest role.",
    inputSchema: {
      guild_id: guildIdField,
      positions: z.array(z.object({ role_id: snowflake, position: z.number().int().min(1) })).min(1),
      reason,
    },
    annotations: WRITE,
  },
  (input) =>
    run(async () => {
      assertWritable();
      const guildId = guild(input.guild_id);
      const bot = await botContext(guildId);
      for (const { role_id, position } of input.positions) {
        const role = bot.roles.find((r) => r.id === role_id);
        if (!role) throw new GuardError(`Role ${role_id} does not exist in guild ${guildId}.`);
        if (!canManageRole(bot, role) || position >= bot.highestPosition) {
          throw new GuardError(`"${role.name}" cannot be placed at ${position}: it must stay below the bot's role (position ${bot.highestPosition}).`);
        }
      }
      const roles = await discord.patch<Role[]>(`/guilds/${guildId}/roles`, {
        reason: input.reason,
        body: input.positions.map((p) => ({ id: p.role_id, position: p.position })),
      });
      return roles.sort((a, b) => b.position - a.position).map((r) => ({ name: r.name, position: r.position }));
    }),
);

server.registerTool(
  "set_channel_positions",
  {
    description:
      "Reorder channels and move them between categories in one call. lock_permissions syncs a moved channel's permissions to its new category.",
    inputSchema: {
      guild_id: guildIdField,
      positions: z
        .array(
          z.object({
            channel_id: snowflake,
            position: z.number().int().min(0).optional(),
            parent_id: snowflake.nullable().optional(),
            lock_permissions: z.boolean().optional(),
          }),
        )
        .min(1),
      reason,
    },
    annotations: WRITE,
  },
  (input) =>
    run(async () => {
      assertWritable();
      const guildId = guild(input.guild_id);
      await discord.patch(`/guilds/${guildId}/channels`, {
        reason: input.reason,
        body: input.positions.map((p) => ({
          id: p.channel_id,
          position: p.position,
          parent_id: p.parent_id,
          lock_permissions: p.lock_permissions,
        })),
      });
      return { updated: input.positions.length };
    }),
);

server.registerTool(
  "search_members",
  {
    description: "Find members whose username or nickname starts with the query. Needs the Server Members Intent enabled for the bot.",
    inputSchema: {
      guild_id: guildIdField,
      query: z.string().min(1).max(100),
      limit: z.number().int().min(1).max(1000).default(25),
    },
    annotations: READ,
  },
  (input) =>
    run(async () => {
      const guildId = guild(input.guild_id);
      const [members, roles] = await Promise.all([
        discord.get<Member[]>(`/guilds/${guildId}/members/search`, { query: { query: input.query, limit: input.limit } }),
        discord.get<Role[]>(`/guilds/${guildId}/roles`),
      ]);
      return members.map((m) => ({
        id: m.user?.id,
        username: m.user?.username,
        display_name: m.nick ?? m.user?.global_name ?? m.user?.username,
        bot: m.user?.bot ?? false,
        joined_at: m.joined_at,
        roles: m.roles.map((id) => roles.find((r) => r.id === id)?.name ?? id),
      }));
    }),
);

for (const [name, method, summary] of [
  ["add_member_role", "put", "Give a member a role."],
  ["remove_member_role", "delete", "Take a role away from a member."],
] as const) {
  server.registerTool(
    name,
    {
      description: `${summary} The role must be below the bot's highest role.`,
      inputSchema: { guild_id: guildIdField, user_id: snowflake, role_id: snowflake, reason },
      annotations: method === "put" ? WRITE : DESTRUCTIVE,
    },
    (input) =>
      run(async () => {
        assertWritable();
        const guildId = guild(input.guild_id);
        const { role } = await manageableRole(guildId, input.role_id);
        await discord[method](`/guilds/${guildId}/members/${input.user_id}/roles/${role.id}`, { reason: input.reason });
        return { user_id: input.user_id, role: role.name, [method === "put" ? "added" : "removed"]: true };
      }),
  );
}

server.registerTool(
  "update_server_settings",
  {
    description:
      "Change server-wide settings: name, verification level, explicit content filter, default notifications, and the system and rules channels. The rules channel needs the Community feature.",
    inputSchema: {
      guild_id: guildIdField,
      name: z.string().min(2).max(100).optional(),
      verification_level: z.enum(Object.keys(VERIFICATION_LEVELS) as [keyof typeof VERIFICATION_LEVELS]).optional(),
      explicit_content_filter: z.enum(Object.keys(CONTENT_FILTERS) as [keyof typeof CONTENT_FILTERS]).optional(),
      default_message_notifications: z
        .enum(Object.keys(NOTIFICATION_LEVELS) as [keyof typeof NOTIFICATION_LEVELS])
        .optional(),
      system_channel_id: snowflake.nullable().optional(),
      rules_channel_id: snowflake.nullable().optional(),
      reason,
    },
    annotations: WRITE,
  },
  (input) =>
    run(async () => {
      assertWritable();
      const guildId = guild(input.guild_id);
      const updated = await discord.patch<Guild>(`/guilds/${guildId}`, {
        reason: input.reason,
        body: {
          name: input.name,
          verification_level: input.verification_level && VERIFICATION_LEVELS[input.verification_level],
          explicit_content_filter: input.explicit_content_filter && CONTENT_FILTERS[input.explicit_content_filter],
          default_message_notifications:
            input.default_message_notifications && NOTIFICATION_LEVELS[input.default_message_notifications],
          system_channel_id: input.system_channel_id,
          rules_channel_id: input.rules_channel_id,
        },
      });
      return {
        name: updated.name,
        verification_level: nameOf(VERIFICATION_LEVELS, updated.verification_level),
        explicit_content_filter: nameOf(CONTENT_FILTERS, updated.explicit_content_filter),
        default_message_notifications: nameOf(NOTIFICATION_LEVELS, updated.default_message_notifications),
        system_channel_id: updated.system_channel_id,
        rules_channel_id: updated.rules_channel_id,
      };
    }),
);

server.registerTool(
  "send_message",
  {
    description:
      "Post a message as the bot, for example a welcome or rules message in a new channel. Mentions do not ping anyone unless allow_mentions is true.",
    inputSchema: {
      channel_id: snowflake,
      content: z.string().min(1).max(2000),
      allow_mentions: z.boolean().default(false),
    },
    annotations: WRITE,
  },
  (input) =>
    run(async () => {
      assertWritable();
      const channel = await allowedChannel(input.channel_id);
      const message = await discord.post<{ id: Snowflake }>(`/channels/${channel.id}/messages`, {
        body: {
          content: input.content,
          // An empty parse list keeps @everyone and role mentions from pinging.
          allowed_mentions: input.allow_mentions ? undefined : { parse: [] },
        },
      });
      return { id: message.id, channel: channel.name };
    }),
);

await server.connect(new StdioServerTransport());
console.error(
  `discord-admin-mcp: ready for ${guildIds.join(", ")}${readOnly ? " (read-only)" : ""}.`,
);
