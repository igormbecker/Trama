import orchestrator from "tests/orchestrator.js";
import session from "models/session.js";
import work from "models/work.js";
import workInvitation from "models/workInvitation.js";
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
function request(path, user, body) {
  return fetch(`${baseUrl}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { Cookie: user?.cookie || "", "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    redirect: "manual",
  });
}
async function invite(owner, email, title) {
  const createdWork = await work.create(owner.id, { title });
  return workInvitation.create(createdWork.id, owner.id, { email });
}

test("Lists only the matching account's valid pending invitations without disclosing tokens", async () => {
  const owner = await account();
  const guest = await account();
  const pending = await invite(
    owner,
    guest.email.toUpperCase(),
    "Convite disponível",
  );
  await invite(owner, "another@trama.test", "Obra de outra pessoa");
  for (const status of ["accepted", "declined", "canceled", "expired"]) {
    const invitation = await invite(owner, guest.email, `Convite ${status}`);
    await database.query({
      text:
        status === "expired"
          ? "UPDATE work_invitations SET expires_at = now() - interval '1 second' WHERE id = $1"
          : "UPDATE work_invitations SET status = $2 WHERE id = $1",
      values: status === "expired" ? [invitation.id] : [invitation.id, status],
    });
  }
  const response = await request("/api/v1/invitations", guest);
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  const entries = await response.json();
  expect(entries).toEqual([
    expect.objectContaining({
      id: pending.id,
      work_title: "Convite disponível",
      role: "organizer",
    }),
  ]);
  expect(entries[0]).not.toHaveProperty("token");
  expect(entries[0]).not.toHaveProperty("token_hash");
  expect(await (await request("/api/v1/invitations", owner)).json()).toEqual(
    [],
  );
  const page = await request("/invitations", guest);
  expect(page.status).toBe(200);
  // Next.js dev replaces page cache headers with no-cache; APIs retain no-store.
  expect(page.headers.get("cache-control")).toMatch(/no-cache|no-store/);
  const html = await page.text();
  expect(html).toContain("Convite disponível");
  expect(html).toContain("Aceitar convite");
  expect(html).not.toContain("Obra de outra pessoa");
  expect(html).not.toContain(pending.token);
  expect(html).toContain('href="/invitations"');
  expect(html).toContain("1 convite pendente");
});

test("Requires authentication and shows an empty state", async () => {
  const anonymous = await request("/api/v1/invitations", null);
  expect(anonymous.status).toBe(401);
  expect(anonymous.headers.get("cache-control")).toBe("private, no-store");
  expect(
    (
      await request("/api/v1/invitations", null, {
        invitation_id: "invalid",
        action: "accept",
      })
    ).status,
  ).toBe(401);
  const page = await request("/invitations", null);
  expect(page.status).toBe(307);
  expect(page.headers.get("location")).toBe("/login");
  expect(
    await (await request("/invitations", await account())).text(),
  ).toContain("Nenhum convite pendente");
});

test.each(["accept", "decline"])(
  "Responds by id with action %s and preserves single consumption across links and the list",
  async (action) => {
    const owner = await account();
    const guest = await account();
    const invitation = await invite(owner, guest.email, "Obra da lista");
    const input = { invitation_id: invitation.id, action };
    const response = await request("/api/v1/invitations", guest, input);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect((await response.json()).status).toBe(
      action === "accept" ? "accepted" : "declined",
    );
    expect(await (await request("/api/v1/invitations", guest)).json()).toEqual(
      [],
    );
    expect((await request("/api/v1/invitations", guest, input)).status).toBe(
      404,
    );
    expect(
      (
        await request(`/api/v1/invitations/${invitation.token}`, guest, {
          action: "accept",
        })
      ).status,
    ).toBe(404);
    expect(
      (await request(`/api/v1/works/${invitation.work_id}`, guest)).status,
    ).toBe(action === "accept" ? 200 : 404);
  },
);

test("Cannot respond to another account's invitation or an unavailable invitation by id", async () => {
  const owner = await account();
  const guest = await account();
  const invitation = await invite(owner, guest.email, "Obra privada");
  const input = { invitation_id: invitation.id, action: "accept" };
  expect((await request("/api/v1/invitations", owner, input)).status).toBe(404);
  await database.query({
    text: "UPDATE work_invitations SET expires_at = now() - interval '1 second' WHERE id = $1",
    values: [invitation.id],
  });
  expect((await request("/api/v1/invitations", guest, input)).status).toBe(404);
  for (const body of [
    null,
    {},
    { ...input, action: "promote" },
    { ...input, user_id: owner.id },
  ]) {
    expect((await request("/api/v1/invitations", guest, body)).status).toBe(
      400,
    );
  }
  expect(
    (
      await request("/api/v1/invitations", guest, {
        ...input,
        invitation_id: "invalid",
      })
    ).status,
  ).toBe(404);
});

test("Concurrent link and list acceptance creates only one participation", async () => {
  const owner = await account();
  const guest = await account();
  const invitation = await invite(owner, guest.email, "Aceite concorrente");
  const responses = await Promise.all([
    request("/api/v1/invitations", guest, {
      invitation_id: invitation.id,
      action: "accept",
    }),
    request(`/api/v1/invitations/${invitation.token}`, guest, {
      action: "accept",
    }),
  ]);
  expect(responses.map((response) => response.status).sort()).toEqual([
    200, 404,
  ]);
  const stored = await database.query({
    text: "SELECT id FROM work_participants WHERE work_id = $1 AND user_id = $2 AND removed_at IS NULL",
    values: [invitation.work_id, guest.id],
  });
  expect(stored.rowCount).toBe(1);
});
