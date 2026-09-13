import assert from "node:assert/strict";
import { resolve } from "node:path";
import { test } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Starts the real server over stdio with a fake token. Every call below is
// refused by a guard before any request is made, so nothing reaches Discord.
// Every variable is set here because the server fills unset ones from a real
// .env when one exists.
async function connect(env: Record<string, string>) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [resolve(import.meta.dirname, "../src/index.ts")],
    env: {
      PATH: process.env.PATH ?? "",
      DISCORD_BOT_TOKEN: "fake",
      DISCORD_GUILD_IDS: "111111111111111111",
      DISCORD_READ_ONLY: "false",
      ...env,
    },
    stderr: "ignore",
  });
  const client = new Client({ name: "test", version: "0.0.0" });
  await client.connect(transport);
  return client;
}

const text = (res: Awaited<ReturnType<Client["callTool"]>>) =>
  (res.content as { type: string; text: string }[]).map((c) => c.text).join("\n");

test("lists every tool with read-only and destructive hints", async () => {
  const client = await connect({});
  try {
    const { tools } = await client.listTools();
    const byName = new Map(tools.map((t) => [t.name, t]));
    assert.deepEqual(tools.map((t) => t.name).sort(), [
      "add_member_role", "create_channel", "create_role", "delete_channel", "delete_role", "get_server_overview",
      "list_guilds", "remove_channel_permission", "remove_member_role", "search_members", "send_message",
      "set_channel_permission", "set_channel_positions", "set_role_positions", "snapshot_server", "update_channel",
      "update_role", "update_server_settings",
    ]);
    assert.equal(byName.get("get_server_overview")?.annotations?.readOnlyHint, true);
    for (const name of ["delete_channel", "delete_role", "remove_channel_permission", "remove_member_role"]) {
      assert.equal(byName.get(name)?.annotations?.destructiveHint, true, name);
    }
    assert.match(client.getInstructions() ?? "", /snapshot_server/);
  } finally {
    await client.close();
  }
});

test("refuses a guild outside the allowlist", async () => {
  const client = await connect({});
  try {
    const res = await client.callTool({ name: "create_role", arguments: { guild_id: "222222222222222222", name: "x" } });
    assert.equal(res.isError, true);
    assert.match(text(res), /not in DISCORD_GUILD_IDS/);
  } finally {
    await client.close();
  }
});

test("refuses writes in read-only mode", async () => {
  const client = await connect({ DISCORD_READ_ONLY: "true" });
  try {
    const res = await client.callTool({ name: "create_channel", arguments: { name: "general" } });
    assert.equal(res.isError, true);
    assert.match(text(res), /writes are disabled/);
  } finally {
    await client.close();
  }
});
