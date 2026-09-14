# discord-admin-mcp

A local MCP server that lets Claude Code inspect and restructure the Binary
Semaphore Discord server: channels, categories, roles, permission overwrites,
and server settings.

The official Claude Code Discord plugin is a chat bridge (reply, react, fetch
messages). It cannot create a channel or change a permission, so this fills that
gap. It is our own code rather than a third-party server because the bot token
can manage roles and channels, and that is not a token to hand to code we have
not read.

It runs over stdio on your machine. There is no hosted part.

## Setup

**1. Create the bot.** In the [Discord developer portal](https://discord.com/developers/applications),
create an application, open **Bot**, and reset the token to copy it. On the same
page, turn on **Server Members Intent**; `search_members` needs it.

**2. Invite it.** Open this URL with your application id in place of `APP_ID`:

```
https://discord.com/oauth2/authorize?client_id=APP_ID&scope=bot&permissions=268504112
```

`268504112` is exactly View Channels, Send Messages, Read Message History,
Manage Channels, Manage Server, and Manage Roles. Do not grant Administrator: it
bypasses every channel overwrite, which is what a redesign needs to see clearly.

**3. Move the bot's role up.** In Server Settings > Roles, drag the bot's role
above every role it should manage. A bot can only edit, assign, or delete roles
below its own highest role, and can only grant permissions it holds itself.
`get_server_overview` reports both for each role.

**4. Configure.**

```bash
cd tools/discord-admin-mcp
npm install
cp .env.example .env   # then fill in the token and server id
```

Start with `DISCORD_READ_ONLY=true` for a first look.

**5. Use it.** The server is registered in the repo's `.mcp.json` as
`discord-admin`. Restart Claude Code in the repo and approve the server when
asked. The path in `.mcp.json` is relative to the repo root, so any clone works.

## Tools

| Tool                                                                                  | Kind                          |
| ------------------------------------------------------------------------------------- | ----------------------------- |
| `list_guilds`, `get_server_overview`, `search_members`                                | read                          |
| `snapshot_server`                                                                     | writes a local JSON file only |
| `create_channel`, `update_channel`, `set_channel_permission`, `set_channel_positions` | write                         |
| `create_role`, `update_role`, `set_role_positions`, `add_member_role`                 | write                         |
| `update_server_settings`, `send_message`                                              | write                         |
| `delete_channel`, `delete_role`, `remove_channel_permission`, `remove_member_role`    | destructive                   |

Permissions are passed by name (`VIEW_CHANNEL`, `SEND_MESSAGES`, and so on) and
returned decoded. An overwrite target is `"@everyone"`, a role or user id, or an
exact role name.

## Guards

- **Server allowlist.** Only ids in `DISCORD_GUILD_IDS` are touched. Tools that
  take only a channel id fetch the channel first and check its server.
- **Read-only mode.** `DISCORD_READ_ONLY=true` refuses every write before a
  request is made.
- **Named deletes.** `delete_channel` and `delete_role` need `confirm_name` to
  match the current name.
- **No accidental pings.** `send_message` suppresses @everyone and role mentions
  unless `allow_mentions` is true.
- **Audit trail.** Every write takes an optional `reason`, recorded in the
  server's audit log.

The server also sends Claude Code instructions on connect: take a snapshot and
show the full plan before bulk changes, and ask before anything destructive.

## Development

```bash
npm run check   # tsc --noEmit
npm test        # node --test; nothing reaches Discord
```

Node 26 runs the TypeScript directly by stripping types, so there is no build
step. That allows only erasable syntax: no enums, no parameter properties, and
imports keep their `.ts` extension. `tsconfig.json` enforces it.
