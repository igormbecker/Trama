import orchestrator from "tests/orchestrator.js";
import session from "models/session.js";
import work from "models/work.js";
import workStructure from "models/workStructure.js";
import workInvitation from "models/workInvitation.js";
import workParticipant from "models/workParticipant.js";
import database from "infra/database.js";
import chapterContent from "models/chapterContent.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDataBase();
  await orchestrator.runPendingMigrations();
});
async function account() {
  const user = await orchestrator.createUser({});
  return {
    ...user,
    cookie: `trama_session_id=${(await session.create(user.id)).token}`,
  };
}
function request(path, user, method = "GET", body) {
  return fetch(`http://127.0.0.1:3002${path}`, {
    method,
    headers: { Cookie: user?.cookie || "", "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
async function setup() {
  const owner = await account();
  const createdWork = await work.create(owner.id, { title: "Editor" });
  const part = await workStructure.createPart(createdWork.id, owner.id, {
    title: "Parte",
  });
  const chapter = await workStructure.createChapter(
    createdWork.id,
    part.id,
    owner.id,
    { title: "Carta", description: "Descrição preservada" },
  );
  return {
    owner,
    work: createdWork,
    part,
    chapter,
    path: `/api/v1/works/${createdWork.id}/chapters/${chapter.id}`,
  };
}
const document = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Uma carta", marks: [{ type: "italic" }] },
      ],
    },
  ],
};

test("Reads the saved work as a whole and protects the reading page", async () => {
  const fixture = await setup();
  const { owner, work: book, chapter } = fixture;
  const url = `/works/${book.id}/read`;
  const empty = await request(url, owner);
  expect(empty.status).toBe(200);
  expect(await empty.text()).toContain("Esta obra ainda não tem texto salvo");
  const lease = await chapterContent.reserve(book.id, chapter.id, owner.id, {});
  await chapterContent.save(book.id, chapter.id, owner.id, {
    document,
    revision: 0,
    token: lease.token,
  });
  const response = await request(url, owner);
  expect(response.status).toBe(200);
  const html = await response.text();
  expect(html).toContain("Uma carta");
  expect(html).toContain("Sumário");
  expect(html).not.toContain(lease.token);
  expect(html).not.toContain("Descrição preservada");
  for (const format of ["docx", "pdf"]) {
    const exported = await request(
      `/api/v1/works/${book.id}/export?format=${format}`,
      owner,
    );
    expect(exported.status).toBe(200);
    expect(exported.headers.get("cache-control")).toBe("private, no-store");
    expect(exported.headers.get("content-disposition")).toContain(`.${format}`);
    const buffer = Buffer.from(await exported.arrayBuffer());
    expect(buffer.subarray(0, format === "pdf" ? 5 : 2).toString()).toBe(
      format === "pdf" ? "%PDF-" : "PK",
    );
  }
  expect(
    (await request(`/api/v1/works/${book.id}/export?format=html`, owner))
      .status,
  ).toBe(400);
  expect(
    (await request(`/api/v1/works/${book.id}/export?format=pdf`, null)).status,
  ).toBe(401);
  expect(
    (
      await request(
        `/api/v1/works/${book.id}/export?format=pdf`,
        await account(),
      )
    ).status,
  ).toBe(404);
  const organizer = await account();
  const invitation = await workInvitation.create(book.id, owner.id, {
    email: organizer.email,
  });
  await workInvitation.respond(invitation.token, organizer.id, {
    action: "accept",
  });
  expect((await request(url, organizer)).status).toBe(200);
  expect(
    (await request(`/api/v1/works/${book.id}/export?format=pdf`, organizer))
      .status,
  ).toBe(404);
  await workParticipant.remove(book.id, organizer.id, owner.id);
  expect((await request(url, organizer)).status).toBe(404);
  expect(
    (await request(`/api/v1/works/${book.id}/export?format=docx`, organizer))
      .status,
  ).toBe(404);
  expect((await request(url, await account())).status).toBe(404);
  const anonymous = await fetch(`http://127.0.0.1:3002${url}`, {
    redirect: "manual",
  });
  expect(anonymous.status).toBe(307);
  expect(anonymous.headers.get("location")).toBe("/login");
});

test("Owner saves rich text under an exclusive lease and revision; readers cannot write", async () => {
  const fixture = await setup();
  const { owner, path, work: createdWork, part, chapter } = fixture;
  expect((await request(path, null)).status).toBe(401);
  const initial = await request(path, owner);
  expect(initial.status).toBe(200);
  expect(initial.headers.get("cache-control")).toBe("private, no-store");
  expect(await initial.json()).toMatchObject({ revision: 0 });
  const leaseResponse = await request(`${path}/lease`, owner, "POST", {});
  expect(leaseResponse.status).toBe(200);
  const lease = await leaseResponse.json();
  expect(lease.token).toMatch(/^[0-9a-f-]{36}$/);
  expect((await request(`${path}/lease`, owner, "POST", {})).status).toBe(409);
  expect(
    (
      await request(path, owner, "PUT", {
        document,
        revision: 0,
        token: lease.token,
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await request(path, owner, "PUT", {
        document,
        revision: 0,
        token: lease.token,
      })
    ).status,
  ).toBe(409);
  expect(
    (await request(path, owner, "PUT", { document, revision: 1, token: "bad" }))
      .status,
  ).toBe(400);
  expect(
    (
      await request(path, owner, "PUT", {
        document: { type: "image" },
        revision: 1,
        token: lease.token,
      })
    ).status,
  ).toBe(400);
  const saved = await (await request(path, owner)).json();
  expect(saved).toMatchObject({ document, revision: 1 });
  expect(saved.token).toBeUndefined();
  expect(saved.lease_token).toBeUndefined();
  expect(
    (await workStructure.listChapters(createdWork.id, part.id, owner.id))[0],
  ).toMatchObject({ description: chapter.description });
  const organizer = await account();
  const invitation = await workInvitation.create(createdWork.id, owner.id, {
    email: organizer.email,
  });
  await workInvitation.respond(invitation.token, organizer.id, {
    action: "accept",
  });
  expect((await request(path, organizer)).status).toBe(200);
  const outsider = await account();
  const administrator = {
    cookie: await orchestrator.createAdministratorCookie(),
  };
  for (const user of [outsider, administrator])
    expect((await request(path, user)).status).toBe(404);
  const other = await setup();
  expect(
    (
      await request(
        `/api/v1/works/${other.work.id}/chapters/${chapter.id}`,
        other.owner,
      )
    ).status,
  ).toBe(404);
  for (const user of [organizer, outsider, administrator]) {
    expect(
      (
        await request(path, user, "PUT", {
          document,
          revision: 1,
          token: lease.token,
        })
      ).status,
    ).toBe(404);
    expect((await request(`${path}/lease`, user, "POST", {})).status).toBe(404);
  }
  const html = await (
    await request(`/works/${createdWork.id}/chapters/${chapter.id}`, organizer)
  ).text();
  expect(html).toContain("Uma carta");
  expect(html).toContain("<em>");
  expect(html).not.toContain("Escrever capítulo");
  await workParticipant.remove(createdWork.id, organizer.id, owner.id);
  expect((await request(path, organizer)).status).toBe(404);
});

test("Lease release and expiry permit recovery without stale writers overwriting content", async () => {
  const { owner, path, chapter } = await setup();
  const first = await (
    await request(`${path}/lease`, owner, "POST", {})
  ).json();
  expect(
    (await request(`${path}/lease`, owner, "POST", { token: first.token }))
      .status,
  ).toBe(200);
  await database.query({
    text: "UPDATE chapter_drafts SET lease_expires_at = now() - interval '1 second' WHERE chapter_id = $1",
    values: [chapter.id],
  });
  const second = await (
    await request(`${path}/lease`, owner, "POST", {})
  ).json();
  expect(second.token).not.toBe(first.token);
  expect(
    (
      await request(path, owner, "PUT", {
        document,
        revision: 0,
        token: first.token,
      })
    ).status,
  ).toBe(409);
  expect(
    (await request(`${path}/lease`, owner, "DELETE", { token: first.token }))
      .status,
  ).toBe(204);
  expect((await request(`${path}/lease`, owner, "POST", {})).status).toBe(409);
  expect(
    (await request(`${path}/lease`, owner, "DELETE", { token: second.token }))
      .status,
  ).toBe(204);
  const races = await Promise.all([
    request(`${path}/lease`, owner, "POST", {}),
    request(`${path}/lease`, owner, "POST", {}),
  ]);
  expect(races.map((response) => response.status).sort()).toEqual([200, 409]);
});

test("Concurrent saves with the same revision commit only once", async () => {
  const { owner, path } = await setup();
  const lease = await (
    await request(`${path}/lease`, owner, "POST", {})
  ).json();
  const responses = await Promise.all([
    request(path, owner, "PUT", { document, revision: 0, token: lease.token }),
    request(path, owner, "PUT", { document, revision: 0, token: lease.token }),
  ]);
  expect(responses.map((response) => response.status).sort()).toEqual([
    200, 409,
  ]);
  expect(await (await request(path, owner)).json()).toMatchObject({
    document,
    revision: 1,
  });
});
