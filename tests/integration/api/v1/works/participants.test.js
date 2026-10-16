import orchestrator from "tests/orchestrator.js";
import session from "models/session.js";
import database from "infra/database.js";

const baseUrl = "http://127.0.0.1:3002";
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDataBase();
  await orchestrator.runPendingMigrations();
});
async function account(input = {}) {
  const user = await orchestrator.createUser(input);
  return {
    ...user,
    cookie: `trama_session_id=${(await session.create(user.id)).token}`,
  };
}
function request(path, user, method = "GET", body) {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: { Cookie: user?.cookie || "", "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
async function setup() {
  const owner = await account();
  const guest = await account();
  const response = await request("/api/v1/works", owner, "POST", {
    title: "Obra colaborativa",
  });
  return { owner, guest, work: await response.json() };
}
function invite(work, owner, email) {
  return request(`/api/v1/works/${work.id}/invitations`, owner, "POST", {
    email,
  });
}

test("Owner invites by email without granting access before acceptance", async () => {
  const { owner, guest, work } = await setup();
  const response = await invite(work, owner, ` ${guest.email.toUpperCase()} `);
  expect(response.status).toBe(201);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  const invitation = await response.json();
  expect(invitation.email).toBe(guest.email.toLowerCase());
  expect(invitation.token).toMatch(/^[a-f0-9]{96}$/);
  expect(
    new Date(invitation.expires_at) - new Date(invitation.created_at),
  ).toBeCloseTo(7 * 86400000, -3);
  expect((await request(`/api/v1/works/${work.id}`, guest)).status).toBe(404);
  const stored = await database.query({
    text: "SELECT * FROM work_invitations WHERE id = $1",
    values: [invitation.id],
  });
  expect(JSON.stringify(stored.rows)).not.toContain(invitation.token);
  const list = await request(`/api/v1/works/${work.id}/invitations`, owner);
  const entries = await list.json();
  expect(entries).toHaveLength(1);
  expect(entries[0]).not.toHaveProperty("token");
  expect(entries[0]).not.toHaveProperty("token_hash");
});

test("Matching account accepts once, sees the work and can be removed without deleting history", async () => {
  const { owner, guest, work } = await setup();
  const invitation = await (await invite(work, owner, guest.email)).json();
  const path = `/api/v1/invitations/${invitation.token}`;
  const preview = await request(path, guest);
  expect(preview.status).toBe(200);
  expect((await preview.json()).work_title).toBe(work.title);
  const accepted = await request(path, guest, "POST", { action: "accept" });
  expect(accepted.status).toBe(200);
  expect(
    (await request(path, guest, "POST", { action: "accept" })).status,
  ).toBe(404);
  expect((await request(`/api/v1/works/${work.id}`, guest)).status).toBe(200);
  expect(await (await request("/api/v1/works", guest)).json()).toEqual([work]);
  const page = await request(`/works/${work.id}`, guest);
  expect(page.status).toBe(200);
  const html = await page.text();
  expect(html).toContain("Você participa como organizador");
  expect(html).not.toContain('id="invite-email"');
  const participants = await (
    await request(`/api/v1/works/${work.id}/participants`, owner)
  ).json();
  expect(participants).toEqual([
    expect.objectContaining({
      user_id: guest.id,
      role: "organizer",
      name: guest.name,
    }),
  ]);
  expect(JSON.stringify(participants)).not.toContain(guest.password);
  const removed = await request(
    `/api/v1/works/${work.id}/participants/${guest.id}`,
    owner,
    "DELETE",
  );
  expect(removed.status).toBe(204);
  expect((await request(`/api/v1/works/${work.id}`, guest)).status).toBe(404);
  expect((await request(`/works/${work.id}`, guest)).status).toBe(404);
  expect(await (await request("/api/v1/works", guest)).json()).toEqual([]);
  expect(
    (await request(path, guest, "POST", { action: "accept" })).status,
  ).toBe(404);
  const history = await database.query({
    text: "SELECT removed_at FROM work_participants WHERE work_id = $1 AND user_id = $2",
    values: [work.id, guest.id],
  });
  expect(history.rows[0].removed_at).not.toBeNull();
});

test("Only the owner manages invitations and participants, including against organizers and global administrators", async () => {
  const { owner, guest, work } = await setup();
  const invitation = await (await invite(work, owner, guest.email)).json();
  await request(`/api/v1/invitations/${invitation.token}`, guest, "POST", {
    action: "accept",
  });
  const admin = { cookie: await orchestrator.createAdministratorCookie() };
  for (const user of [guest, await account(), admin]) {
    for (const [suffix, method, body] of [
      ["invitations", "GET"],
      ["invitations", "POST", { email: "new@trama.test" }],
      [`invitations/${invitation.id}`, "DELETE"],
      ["participants", "GET"],
      [`participants/${guest.id}`, "DELETE"],
    ]) {
      const response = await request(
        `/api/v1/works/${work.id}/${suffix}`,
        user,
        method,
        body,
      );
      expect(response.status).toBe(404);
    }
  }
  expect(
    (
      await request(
        `/api/v1/works/${work.id}/participants/${owner.id}`,
        owner,
        "DELETE",
      )
    ).status,
  ).toBe(400);
  expect((await request(`/api/v1/works/${work.id}`, guest)).status).toBe(200);
});

test("Wrong email and anonymous visitors cannot inspect or consume an invitation", async () => {
  const { owner, guest, work } = await setup();
  const invitation = await (await invite(work, owner, guest.email)).json();
  for (const user of [
    await account(),
    { cookie: await orchestrator.createAdministratorCookie() },
    null,
  ]) {
    for (const method of ["GET", "POST"]) {
      const response = await request(
        `/api/v1/invitations/${invitation.token}`,
        user,
        method,
        method === "POST" ? { action: "accept" } : undefined,
      );
      expect(response.status).toBe(user ? 404 : 401);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(JSON.stringify(await response.json())).not.toContain(work.title);
    }
  }
  expect(
    (
      await request(`/api/v1/invitations/${invitation.token}`, guest, "POST", {
        action: "accept",
      })
    ).status,
  ).toBe(200);
});

test("Resending cancels the previous link, declining and canceling never grant access", async () => {
  const { owner, guest, work } = await setup();
  const first = await (await invite(work, owner, guest.email)).json();
  const second = await (await invite(work, owner, guest.email)).json();
  expect(
    (await request(`/api/v1/invitations/${first.token}`, guest)).status,
  ).toBe(404);
  expect(
    (
      await request(`/api/v1/invitations/${second.token}`, guest, "POST", {
        action: "decline",
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await request(`/api/v1/invitations/${second.token}`, guest, "POST", {
        action: "accept",
      })
    ).status,
  ).toBe(404);
  const third = await (await invite(work, owner, guest.email)).json();
  expect(
    (
      await request(
        `/api/v1/works/${work.id}/invitations/${third.id}`,
        owner,
        "DELETE",
      )
    ).status,
  ).toBe(204);
  expect(
    (
      await request(`/api/v1/invitations/${third.token}`, guest, "POST", {
        action: "accept",
      })
    ).status,
  ).toBe(404);
  expect((await request(`/api/v1/works/${work.id}`, guest)).status).toBe(404);
});

test("Expired and malformed links cannot be used; invitations work for accounts registered afterwards", async () => {
  const { owner, guest, work } = await setup();
  const invitation = await (await invite(work, owner, guest.email)).json();
  await database.query({
    text: "UPDATE work_invitations SET expires_at = now() - interval '1 second' WHERE id = $1",
    values: [invitation.id],
  });
  for (const token of [invitation.token, "invalid", "0".repeat(96)]) {
    expect((await request(`/api/v1/invitations/${token}`, guest)).status).toBe(
      404,
    );
    expect(
      (
        await request(`/api/v1/invitations/${token}`, guest, "POST", {
          action: "accept",
        })
      ).status,
    ).toBe(404);
  }
  const email = "future-organizer@trama.test";
  const future = await (await invite(work, owner, email)).json();
  const newAccount = await account({ email });
  expect(
    (
      await request(`/api/v1/invitations/${future.token}`, newAccount, "POST", {
        action: "accept",
      })
    ).status,
  ).toBe(200);
});

test.each([
  null,
  {},
  { email: "bad" },
  { email: 123 },
  { email: "a".repeat(255) + "@example.test" },
  { email: "reader@trama.test", role: "owner" },
])("Rejects invalid invitation input: %#", async (body) => {
  const { owner, work } = await setup();
  expect(
    (await request(`/api/v1/works/${work.id}/invitations`, owner, "POST", body))
      .status,
  ).toBe(400);
});

test("Prevents inviting the owner or an active participant and validates actions", async () => {
  const { owner, guest, work } = await setup();
  expect((await invite(work, owner, owner.email)).status).toBe(400);
  const invitation = await (await invite(work, owner, guest.email)).json();
  expect(
    (
      await request(`/api/v1/invitations/${invitation.token}`, guest, "POST", {
        action: "promote",
      })
    ).status,
  ).toBe(400);
  await request(`/api/v1/invitations/${invitation.token}`, guest, "POST", {
    action: "accept",
  });
  expect((await invite(work, owner, guest.email)).status).toBe(400);
});

test("Concurrent accept requests create exactly one active participant", async () => {
  const { owner, guest, work } = await setup();
  const invitation = await (await invite(work, owner, guest.email)).json();
  const responses = await Promise.all(
    [1, 2].map(() =>
      request(`/api/v1/invitations/${invitation.token}`, guest, "POST", {
        action: "accept",
      }),
    ),
  );
  expect(responses.map((response) => response.status).sort()).toEqual([
    200, 404,
  ]);
  const rows = await database.query({
    text: "SELECT * FROM work_participants WHERE work_id = $1 AND user_id = $2 AND removed_at IS NULL",
    values: [work.id, guest.id],
  });
  expect(rows.rowCount).toBe(1);
});

test("Invitation pages do not disclose the work to anonymous or wrong-email visitors", async () => {
  const { owner, guest, work } = await setup();
  const invitation = await (await invite(work, owner, guest.email)).json();
  const anonymous = await request(`/invitations/${invitation.token}`, null);
  expect(anonymous.status).toBe(200);
  const html = await anonymous.text();
  expect(html).toContain("Entre para responder ao convite");
  expect(html).not.toContain(work.title);
  const wrong = await request(`/invitations/${invitation.token}`, owner);
  expect(await wrong.text()).not.toContain(work.title);
  const matching = await request(`/invitations/${invitation.token}`, guest);
  expect(matching.status).toBe(200);
  expect(matching.headers.get("referrer-policy")).toBe("no-referrer");
  const matchingHtml = await matching.text();
  expect(matchingHtml).toContain(work.title);
  expect(matchingHtml).toContain("Aceitar convite");
  expect(matchingHtml).not.toContain("token_hash");
  const ownerPage = await request(`/works/${work.id}`, owner);
  const ownerHtml = await ownerPage.text();
  expect(ownerHtml).toContain('id="invite-email"');
  expect(ownerHtml).toContain(guest.email.toLowerCase());
  expect(ownerHtml).not.toContain(invitation.token);
});

test("Reinviting a removed organizer restores access only after a fresh acceptance", async () => {
  const { owner, guest, work } = await setup();
  const first = await (await invite(work, owner, guest.email)).json();
  await request(`/api/v1/invitations/${first.token}`, guest, "POST", {
    action: "accept",
  });
  await request(
    `/api/v1/works/${work.id}/participants/${guest.id}`,
    owner,
    "DELETE",
  );
  const second = await (await invite(work, owner, guest.email)).json();
  expect((await request(`/api/v1/works/${work.id}`, guest)).status).toBe(404);
  expect(
    (
      await request(`/api/v1/invitations/${second.token}`, guest, "POST", {
        action: "accept",
      })
    ).status,
  ).toBe(200);
  expect((await request(`/api/v1/works/${work.id}`, guest)).status).toBe(200);
});

test("Owner operations require authentication and cannot target another work", async () => {
  const first = await setup();
  const second = await setup();
  const invitation = await (
    await invite(first.work, first.owner, first.guest.email)
  ).json();
  for (const [path, method, body] of [
    [`/api/v1/works/${first.work.id}/invitations`, "GET"],
    [
      `/api/v1/works/${first.work.id}/invitations`,
      "POST",
      { email: first.guest.email },
    ],
    [`/api/v1/works/${first.work.id}/invitations/${invitation.id}`, "DELETE"],
    [`/api/v1/works/${first.work.id}/participants`, "GET"],
    [`/api/v1/works/${first.work.id}/participants/${first.guest.id}`, "DELETE"],
  ]) {
    const response = await request(path, null, method, body);
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  }
  expect(
    (
      await request(
        `/api/v1/works/${second.work.id}/invitations/${invitation.id}`,
        second.owner,
        "DELETE",
      )
    ).status,
  ).toBe(404);
  expect(
    (await request(`/api/v1/invitations/${invitation.token}`, first.guest))
      .status,
  ).toBe(200);
});
