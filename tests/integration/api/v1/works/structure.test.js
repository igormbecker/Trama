import orchestrator from "tests/orchestrator.js";
import session from "models/session.js";
import work from "models/work.js";
import workInvitation from "models/workInvitation.js";

const base = "http://127.0.0.1:3002";
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
  return fetch(`${base}${path}`, {
    method,
    headers: { Cookie: user?.cookie || "", "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
async function setup() {
  const owner = await account();
  const createdWork = await work.create(owner.id, {
    title: "Obra com estrutura",
  });
  return {
    owner,
    work: createdWork,
    path: `/api/v1/works/${createdWork.id}/parts`,
  };
}

test("Owner creates, edits and reorders parts and chapters without losing their contents", async () => {
  const { owner, path, work: createdWork } = await setup();
  const firstResponse = await request(path, owner, "POST", {
    title: " Primeira parte ",
  });
  expect(firstResponse.status).toBe(201);
  expect(firstResponse.headers.get("cache-control")).toBe("private, no-store");
  const first = await firstResponse.json();
  expect(first.title).toBe("Primeira parte");
  const second = await (
    await request(path, owner, "POST", { title: "Segunda parte" })
  ).json();
  expect(
    (
      await request(`${path}/${first.id}`, owner, "PATCH", {
        title: "Parte editada",
      })
    ).status,
  ).toBe(200);
  expect(
    (await request(path, owner, "PATCH", { ids: [second.id, first.id] }))
      .status,
  ).toBe(200);
  const chapterPath = `${path}/${first.id}/chapters`;
  const chapterResponse = await request(chapterPath, owner, "POST", {
    title: " Capítulo 1 ",
    description: " Descrição ",
  });
  expect(chapterResponse.status).toBe(201);
  const chapter = await chapterResponse.json();
  expect(chapter).toMatchObject({
    title: "Capítulo 1",
    description: "Descrição",
    position: 1,
  });
  const another = await (
    await request(chapterPath, owner, "POST", { title: "Capítulo 2" })
  ).json();
  expect(another.description).toBe("");
  expect(
    (
      await request(`${chapterPath}/${chapter.id}`, owner, "PATCH", {
        title: "Capítulo editado",
        description: "Nova descrição",
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await request(chapterPath, owner, "PATCH", {
        ids: [another.id, chapter.id],
      })
    ).status,
  ).toBe(200);
  const parts = await (await request(path, owner)).json();
  expect(parts.map((entry) => entry.id)).toEqual([second.id, first.id]);
  expect(parts.map((entry) => entry.position)).toEqual([1, 2]);
  const chapters = await (await request(chapterPath, owner)).json();
  expect(chapters.map((entry) => entry.id)).toEqual([another.id, chapter.id]);
  expect(chapters[1]).toMatchObject({
    title: "Capítulo editado",
    description: "Nova descrição",
  });
  const html = await (await request(`/works/${createdWork.id}`, owner)).text();
  expect(html).toContain("Parte editada");
  expect(html).toContain("Capítulo editado");
  expect(html).toContain("Adicionar parte");
});

test("Only the owner changes structure; active organizers can read it and removed organizers lose access", async () => {
  const { owner, path, work: createdWork } = await setup();
  const part = await (
    await request(path, owner, "POST", { title: "Parte privada" })
  ).json();
  const chapterPath = `${path}/${part.id}/chapters`;
  const chapter = await (
    await request(chapterPath, owner, "POST", { title: "Capítulo privado" })
  ).json();
  const guest = await account();
  const invitation = await workInvitation.create(createdWork.id, owner.id, {
    email: guest.email,
  });
  await workInvitation.respond(invitation.token, guest.id, {
    action: "accept",
  });
  expect((await request(path, guest)).status).toBe(200);
  expect((await request(chapterPath, guest)).status).toBe(200);
  const guestHtml = await (
    await request(`/works/${createdWork.id}`, guest)
  ).text();
  expect(guestHtml).toContain("Capítulo privado");
  expect(guestHtml).not.toContain("Adicionar parte");
  const outsider = await account();
  const admin = { cookie: await orchestrator.createAdministratorCookie() };
  for (const user of [guest, outsider, admin, null]) {
    for (const [url, method, body] of [
      [path, "POST", { title: "Intruso" }],
      [path, "PATCH", { ids: [part.id] }],
      [`${path}/${part.id}`, "PATCH", { title: "Intruso" }],
      [chapterPath, "POST", { title: "Intruso" }],
      [chapterPath, "PATCH", { ids: [chapter.id] }],
      [`${chapterPath}/${chapter.id}`, "PATCH", { title: "Intruso" }],
    ])
      expect((await request(url, user, method, body)).status).toBe(
        user ? 404 : 401,
      );
  }
  for (const user of [outsider, admin, null]) {
    expect((await request(path, user)).status).toBe(user ? 404 : 401);
  }
  await request(
    `/api/v1/works/${createdWork.id}/participants/${guest.id}`,
    owner,
    "DELETE",
  );
  expect((await request(path, guest)).status).toBe(404);
  expect((await request(chapterPath, guest)).status).toBe(404);
});

test("Rejects invalid input and incomplete, repeated or cross-work ordering without changing the order", async () => {
  const { owner, path } = await setup();
  const part = await (
    await request(path, owner, "POST", { title: "Parte" })
  ).json();
  const other = await setup();
  const foreign = await (
    await request(other.path, other.owner, "POST", { title: "Outra obra" })
  ).json();
  for (const input of [
    {},
    { title: " " },
    { title: 42 },
    { title: "a".repeat(256) },
    { title: "Título", owner_id: owner.id },
  ]) {
    expect((await request(path, owner, "POST", input)).status).toBe(400);
  }
  for (const ids of [[], [part.id, part.id], [foreign.id], ["invalid"]]) {
    expect((await request(path, owner, "PATCH", { ids })).status).toBe(400);
  }
  expect(
    (await (await request(path, owner)).json()).map((entry) => entry.id),
  ).toEqual([part.id]);
  expect((await request(`${path}/${foreign.id}/chapters`, owner)).status).toBe(
    404,
  );
  const chapterPath = `${path}/${part.id}/chapters`;
  for (const input of [
    { title: "Título", description: null },
    { title: "Título", description: "a".repeat(5001) },
    { title: "Título", part_id: foreign.id },
  ]) {
    expect((await request(chapterPath, owner, "POST", input)).status).toBe(400);
  }
  const chapter = await (
    await request(chapterPath, owner, "POST", { title: "Original" })
  ).json();
  expect(
    (
      await request(
        `${other.path}/${foreign.id}/chapters/${chapter.id}`,
        other.owner,
        "PATCH",
        { title: "Intruso" },
      )
    ).status,
  ).toBe(404);
  expect(
    (
      await request(`${chapterPath}/${chapter.id}`, owner, "PATCH", {
        description: "Descrição sem alterar título",
      })
    ).status,
  ).toBe(200);
  expect(
    (await request(`${path}/invalid`, owner, "PATCH", { title: "Inválido" }))
      .status,
  ).toBe(404);
});

test("Concurrent creations preserve distinct consecutive positions", async () => {
  const { owner, path } = await setup();
  const responses = await Promise.all(
    ["A", "B", "C"].map((title) => request(path, owner, "POST", { title })),
  );
  expect(responses.map((response) => response.status)).toEqual([201, 201, 201]);
  const parts = await (await request(path, owner)).json();
  expect(parts.map((entry) => entry.position)).toEqual([1, 2, 3]);
});
