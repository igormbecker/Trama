import { randomUUID } from "node:crypto";
import { v5 as uuidv5 } from "uuid";
import orchestrator from "tests/orchestrator.js";
import session from "models/session.js";
import database from "infra/database.js";
import quickDraft from "models/quickDraft.js";

const baseUrl = "http://127.0.0.1:3002";
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDataBase();
  await orchestrator.runPendingMigrations();
});
async function createAccount(options = {}) {
  const user = await orchestrator.createUser(options);
  return {
    user,
    cookie: `trama_session_id=${(await session.create(user.id)).token}`,
  };
}
function createDraft(cookie, input) {
  return fetch(`${baseUrl}/api/v1/works/quick-drafts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(input),
  });
}

test("Creates a private literary draft with local date only in the work title and an editable empty chapter", async () => {
  const { user, cookie } = await createAccount();
  const response = await createDraft(cookie, {
    request_id: randomUUID(),
    time_zone: "America/Sao_Paulo",
  });
  expect(response.status).toBe(201);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  const result = await response.json();
  const stored = (
    await database.query({
      text: "SELECT * FROM works WHERE id = $1",
      values: [result.work_id],
    })
  ).rows[0];
  expect(stored).toMatchObject({
    owner_id: user.id,
    type: "literary",
    description: "",
  });
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(stored.created_at);
  const value = (type) => parts.find((part) => part.type === type).value;
  expect(stored.title).toBe(
    `Rascunho sem título — ${value("day")}/${value("month")}/${value("year")} às ${value("hour")}h${value("minute")}`,
  );
  const content = await fetch(
    `${baseUrl}/api/v1/works/${result.work_id}/chapters/${result.chapter_id}`,
    { headers: { Cookie: cookie } },
  );
  expect(content.status).toBe(200);
  expect(await content.json()).toMatchObject({
    chapter: {
      title: "Capítulo sem título",
      part_title: "Parte 1",
      position: 1,
      part_position: 1,
      description: "",
    },
    document: { type: "doc", content: [{ type: "paragraph" }] },
    revision: 0,
  });
  const lease = await fetch(
    `${baseUrl}/api/v1/works/${result.work_id}/chapters/${result.chapter_id}/lease`,
    {
      method: "POST",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: "{}",
    },
  );
  expect(lease.status).toBe(200);
});

test("Concurrent retries return one work and chapter, while another action creates a new draft", async () => {
  const { user, cookie } = await createAccount();
  const input = { request_id: randomUUID(), time_zone: "UTC" };
  const responses = await Promise.all([
    createDraft(cookie, input),
    createDraft(cookie, input),
  ]);
  expect(responses.map((response) => response.status).sort()).toEqual([
    200, 201,
  ]);
  const results = await Promise.all(
    responses.map((response) => response.json()),
  );
  expect(results[0]).toEqual(results[1]);
  expect(
    (
      await database.query({
        text: "SELECT count(*)::int AS count FROM works WHERE owner_id = $1",
        values: [user.id],
      })
    ).rows[0].count,
  ).toBe(1);
  expect(
    await (
      await createDraft(cookie, { ...input, time_zone: "Asia/Tokyo" })
    ).json(),
  ).toEqual(results[0]);
  const next = await createDraft(cookie, {
    ...input,
    request_id: randomUUID(),
  });
  expect(next.status).toBe(201);
  expect((await next.json()).work_id).not.toBe(results[0].work_id);
});

test("Scopes retries to the authenticated account and enforces authentication and legal acceptance", async () => {
  const owner = await createAccount();
  const other = await createAccount();
  const input = { request_id: randomUUID(), time_zone: "UTC" };
  expect((await createDraft(null, input)).status).toBe(401);
  const result = await (await createDraft(owner.cookie, input)).json();
  const second = await (await createDraft(other.cookie, input)).json();
  expect(second.work_id).not.toBe(result.work_id);
  expect(
    (
      await fetch(`${baseUrl}/api/v1/works/${result.work_id}`, {
        headers: { Cookie: other.cookie },
      })
    ).status,
  ).toBe(404);
  const pending = await createAccount({ skipLegalAcceptance: true });
  expect((await createDraft(pending.cookie, input)).status).toBe(403);
});

test.each([
  null,
  [],
  {},
  { request_id: "invalid", time_zone: "UTC" },
  { request_id: randomUUID(), time_zone: "Invalid/Zone" },
  { request_id: randomUUID(), time_zone: "UTC", owner_id: randomUUID() },
])(
  "Rejects invalid or privileged input without inserting: %#",
  async (input) => {
    const { user, cookie } = await createAccount();
    expect((await createDraft(cookie, input)).status).toBe(400);
    expect(
      (
        await database.query({
          text: "SELECT count(*)::int AS count FROM works WHERE owner_id = $1",
          values: [user.id],
        })
      ).rows[0].count,
    ).toBe(0);
  },
);

test("Rolls back the work and part when chapter creation fails", async () => {
  const { user } = await createAccount();
  const requestId = randomUUID();
  const workId = uuidv5(requestId, user.id);
  const client = await database.getNewClient();
  const originalQuery = client.query.bind(client);
  client.query = (query) =>
    /^\s*INSERT\s+INTO\s+chapters\b/.test(query?.text || "")
      ? Promise.reject(new Error("Chapter insert failed"))
      : originalQuery(query);
  const connection = jest
    .spyOn(database, "getNewClient")
    .mockResolvedValueOnce(client);
  try {
    await expect(
      quickDraft.create(user.id, { request_id: requestId, time_zone: "UTC" }),
    ).rejects.toThrow("Chapter insert failed");
  } finally {
    connection.mockRestore();
  }
  expect(
    (
      await database.query({
        text: "SELECT id FROM works WHERE id = $1",
        values: [workId],
      })
    ).rowCount,
  ).toBe(0);
  expect(
    (
      await database.query({
        text: "SELECT id FROM work_parts WHERE work_id = $1",
        values: [workId],
      })
    ).rowCount,
  ).toBe(0);
});

test("Retries never reopen a draft moved to the trash", async () => {
  const { cookie } = await createAccount();
  const input = { request_id: randomUUID(), time_zone: "UTC" };
  const result = await (await createDraft(cookie, input)).json();
  const removed = await fetch(`${baseUrl}/api/v1/works/${result.work_id}`, {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
  expect(removed.status).toBe(204);
  expect((await createDraft(cookie, input)).status).toBe(409);
});

test("A voice draft saves its initial text atomically and retries never overwrite later edits", async () => {
  const { user, cookie } = await createAccount();
  const input = {
    request_id: randomUUID(),
    time_zone: "UTC",
    initial_document: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Minha ideia." }],
        },
      ],
    },
  };
  const response = await createDraft(cookie, input);
  expect(response.status).toBe(201);
  const draft = await response.json();
  const first = await database.query({
    text: `
      SELECT
        document
      FROM
        chapter_drafts
      WHERE
        chapter_id = $1
    `,
    values: [draft.chapter_id],
  });
  expect(first.rows[0].document).toEqual(input.initial_document);
  const changed = {
    ...input,
    initial_document: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Outro texto." }],
        },
      ],
    },
  };
  const repeat = await createDraft(cookie, changed);
  expect(repeat.status).toBe(200);
  const stored = await database.query({
    text: `
      SELECT
        document
      FROM
        chapter_drafts
      WHERE
        chapter_id = $1
    `,
    values: [draft.chapter_id],
  });
  expect(stored.rows[0].document).toEqual(input.initial_document);
  expect(user.id).toBeDefined();
});
