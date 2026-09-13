import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DiscordError,
  createDiscordClient,
  decodePermissions,
  encodePermissions,
  hasPermission,
  memberPermissions,
  type Fetch,
  type Role,
} from "../src/discord.ts";

test("the invite permission integer decodes to exactly the six documented permissions", () => {
  assert.deepEqual(decodePermissions("268504112"), [
    "MANAGE_CHANNELS",
    "MANAGE_GUILD",
    "VIEW_CHANNEL",
    "SEND_MESSAGES",
    "READ_MESSAGE_HISTORY",
    "MANAGE_ROLES",
  ]);
  assert.equal(
    encodePermissions(["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY", "MANAGE_CHANNELS", "MANAGE_GUILD", "MANAGE_ROLES"]),
    "268504112",
  );
});

test("bits above 31 round-trip, and unnamed bits come back as BIT_n", () => {
  assert.deepEqual(decodePermissions(encodePermissions(["BYPASS_SLOWMODE", "SEND_POLLS"])), ["SEND_POLLS", "BYPASS_SLOWMODE"]);
  assert.deepEqual(decodePermissions(1n << 47n), ["BIT_47"]);
});

test("administrator implies every permission, and member permissions include @everyone", () => {
  assert.ok(hasPermission(encodePermissions(["ADMINISTRATOR"]), "BAN_MEMBERS"));
  assert.ok(!hasPermission(encodePermissions(["VIEW_CHANNEL"]), "BAN_MEMBERS"));
  const role = (id: string, permissions: string) => ({ id, permissions }) as Role;
  const bits = memberPermissions("1", [role("1", encodePermissions(["VIEW_CHANNEL"])), role("2", encodePermissions(["MANAGE_ROLES"])), role("3", encodePermissions(["BAN_MEMBERS"]))], ["2"]);
  assert.deepEqual(decodePermissions(bits), ["VIEW_CHANNEL", "MANAGE_ROLES"]);
});

function fakeFetch(responses: Response[], calls: { url: string; init: RequestInit }[]): Fetch {
  return (async (url: URL | string, init: RequestInit) => {
    calls.push({ url: String(url), init });
    const next = responses.shift();
    if (!next) throw new Error("unexpected request");
    return next;
  }) as Fetch;
}

test("a 429 is retried after retry_after, and the audit reason is URL-encoded", async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const client = createDiscordClient(
    "t0ken",
    fakeFetch(
      [
        new Response(JSON.stringify({ message: "rate limited", retry_after: 0.01, global: false }), { status: 429 }),
        new Response(JSON.stringify({ id: "42" }), { status: 200 }),
      ],
      calls,
    ),
  );
  const created = await client.post<{ id: string }>("/guilds/1/roles", { body: { name: "mods" }, reason: "redesign: tidy roles" });
  assert.equal(created.id, "42");
  assert.equal(calls.length, 2);
  const headers = calls[1]!.init.headers as Record<string, string>;
  assert.equal(headers.Authorization, "Bot t0ken");
  assert.equal(headers["X-Audit-Log-Reason"], "redesign%3A%20tidy%20roles");
});

test("an error response throws with Discord's message, and 204 resolves empty", async () => {
  const client = createDiscordClient(
    "t",
    fakeFetch(
      [
        new Response(JSON.stringify({ code: 50013, message: "Missing Permissions" }), { status: 403 }),
        new Response(null, { status: 204 }),
      ],
      [],
    ),
  );
  await assert.rejects(client.delete("/channels/1"), (error: unknown) => {
    assert.ok(error instanceof DiscordError);
    assert.equal(error.status, 403);
    assert.match(error.message, /Missing Permissions/);
    return true;
  });
  assert.equal(await client.delete("/channels/2"), undefined);
});
