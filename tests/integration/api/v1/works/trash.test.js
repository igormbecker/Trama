import orchestrator from "tests/orchestrator.js";
import session from "models/session.js";
import database from "infra/database.js";
import work from "models/work.js";
import workStructure from "models/workStructure.js";
import chapterContent from "models/chapterContent.js";
import workInvitation from "models/workInvitation.js";
import chapterRequest from "models/chapterRequest.js";

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
function request(path, actor, method = "GET", body) {
  return fetch(`${base}${path}`, {
    method,
    headers: {
      Cookie: actor?.cookie || "",
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
async function setup() {
  const owner = await account();
  const organizer = await account();
  const project = await work.create(owner.id, { title: "Story" });
  const part = await workStructure.createPart(project.id, owner.id, {
    title: "Part",
  });
  const chapter = await workStructure.createChapter(
    project.id,
    part.id,
    owner.id,
    { title: "Conclusion" },
  );
  const invitation = await workInvitation.create(project.id, owner.id, {
    email: organizer.email,
  });
  await workInvitation.respond(invitation.token, organizer.id, {
    action: "accept",
  });
  return {
    owner,
    organizer,
    project,
    part,
    chapter,
    path: `/api/v1/works/${project.id}`,
    chapterPath: `/api/v1/works/${project.id}/parts/${part.id}/chapters/${chapter.id}`,
  };
}
const document = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Preserved content" }],
    },
  ],
};

test("New group assignments get two editable parts and four described sections, while literary works start empty", async () => {
  const owner = await account();
  const project = await work.create(owner.id, {
    title: "Group",
    type: "group_assignment",
  });
  const parts = await workStructure.findAll(project.id, owner.id);
  expect(parts.map((part) => part.title)).toEqual([
    "Elementos textuais",
    "Elementos pós-textuais",
  ]);
  expect(parts[0].chapters.map((chapter) => chapter.title)).toEqual([
    "Introdução",
    "Desenvolvimento",
    "Conclusão",
  ]);
  expect(parts[1].chapters.map((chapter) => chapter.title)).toEqual([
    "Referências",
  ]);
  expect(
    parts
      .flatMap((part) => part.chapters)
      .every((chapter) => chapter.description.length > 0),
  ).toBe(true);
  const literary = await work.create(owner.id, { title: "Book" });
  expect(await workStructure.findAll(literary.id, owner.id)).toEqual([]);
});

test("Trashing a chapter hides it everywhere, preserves content and requests, compacts order and invalidates old leases after restore", async () => {
  const { owner, organizer, project, part, chapter, path, chapterPath } =
    await setup();
  const second = await workStructure.createChapter(
    project.id,
    part.id,
    owner.id,
    { title: "Next" },
  );
  const lease = await chapterContent.reserve(
    project.id,
    chapter.id,
    owner.id,
    {},
  );
  await chapterContent.save(project.id, chapter.id, owner.id, {
    token: lease.token,
    revision: 0,
    document,
  });
  const editorial = await chapterRequest.create(
    project.id,
    chapter.id,
    owner.id,
    {
      assignee_user_id: organizer.id,
      kind: "contribution",
      instructions: "Write",
    },
  );
  expect((await request(chapterPath, owner, "DELETE")).status).toBe(204);
  expect((await request(`${path}/chapters/${chapter.id}`, owner)).status).toBe(
    404,
  );
  expect(
    (await request(`${path}/chapters/${chapter.id}/lease`, owner, "POST", {}))
      .status,
  ).toBe(404);
  expect(
    (await request(`${path}/chapters/${chapter.id}/request`, organizer)).status,
  ).toBe(404);
  expect(await chapterRequest.findForAssignee(organizer.id)).toEqual([]);
  expect(
    (await workStructure.listChapters(project.id, part.id, owner.id)).map(
      (entry) => [entry.id, entry.position],
    ),
  ).toEqual([[second.id, 1]]);
  const reading = await request(`/works/${project.id}/read`, owner);
  expect(await reading.text()).not.toContain("Preserved content");
  const trash = await (await request("/api/v1/trash", owner)).json();
  expect(trash).toEqual([
    expect.objectContaining({ kind: "chapter", id: chapter.id }),
  ]);
  expect(
    (
      await request("/api/v1/trash", owner, "POST", {
        kind: "chapter",
        id: chapter.id,
      })
    ).status,
  ).toBe(200);
  expect(
    (await chapterContent.read(project.id, chapter.id, owner.id)).document,
  ).toEqual(document);
  await expect(
    chapterContent.save(project.id, chapter.id, owner.id, {
      token: lease.token,
      revision: 1,
      document,
    }),
  ).rejects.toMatchObject({ name: "ConflictError" });
  expect((await chapterRequest.findForAssignee(organizer.id))[0].id).toBe(
    editorial.id,
  );
  expect(
    (await workStructure.listChapters(project.id, part.id, owner.id)).map(
      (entry) => entry.position,
    ),
  ).toEqual([1, 2]);
});

test("Parent trash and restoration preserve separately trashed children and block invitations and exports", async () => {
  const { owner, organizer, project, part, chapter, path, chapterPath } =
    await setup();
  const invited = await account();
  const pendingInvitation = await workInvitation.create(project.id, owner.id, {
    email: invited.email,
  });
  await request(chapterPath, owner, "DELETE");
  await request(`${path}/parts/${part.id}`, owner, "DELETE");
  expect(await workStructure.findAll(project.id, owner.id)).toEqual([]);
  await request(path, owner, "DELETE");
  await expect(
    workInvitation.findForRegistration(pendingInvitation.token),
  ).rejects.toMatchObject({ name: "NotFoundError" });
  expect(await workInvitation.findPendingForAccount(invited.id)).toEqual([]);
  expect((await request(path, organizer)).status).toBe(404);
  expect((await request(`${path}/export?format=pdf`, owner)).status).toBe(404);
  expect(await work.findAllForUser(owner.id)).toEqual([]);
  expect(await work.findAllForUser(organizer.id)).toEqual([]);
  expect(
    (
      await request("/api/v1/trash", owner, "POST", {
        kind: "part",
        id: part.id,
      })
    ).status,
  ).toBe(404);
  const trash = await (await request("/api/v1/trash", owner)).json();
  expect(trash.map((entry) => entry.kind)).toEqual(["work"]);
  await request("/api/v1/trash", owner, "POST", {
    kind: "work",
    id: project.id,
  });
  expect(await workStructure.findAll(project.id, owner.id)).toEqual([]);
  await request("/api/v1/trash", owner, "POST", { kind: "part", id: part.id });
  expect(
    (await workStructure.findAll(project.id, owner.id))[0].chapters,
  ).toEqual([]);
  await request("/api/v1/trash", owner, "POST", {
    kind: "chapter",
    id: chapter.id,
  });
  expect(
    (await workStructure.findAll(project.id, owner.id))[0].chapters[0].id,
  ).toBe(chapter.id);
});

test("Creating and reordering around trash keeps active positions continuous; concurrent restores succeed once", async () => {
  const { owner, project, part, chapter, chapterPath } = await setup();
  await request(chapterPath, owner, "DELETE");
  const next = await workStructure.createChapter(
    project.id,
    part.id,
    owner.id,
    { title: "Next" },
  );
  const last = await workStructure.createChapter(
    project.id,
    part.id,
    owner.id,
    { title: "Last" },
  );
  expect([next.position, last.position]).toEqual([1, 2]);
  await workStructure.reorder(
    project.id,
    owner.id,
    { ids: [last.id, next.id] },
    part.id,
  );
  const restored = await Promise.all([
    request("/api/v1/trash", owner, "POST", {
      kind: "chapter",
      id: chapter.id,
    }),
    request("/api/v1/trash", owner, "POST", {
      kind: "chapter",
      id: chapter.id,
    }),
  ]);
  expect(restored.map((response) => response.status).sort()).toEqual([
    200, 404,
  ]);
  const chapters = await workStructure.listChapters(
    project.id,
    part.id,
    owner.id,
  );
  expect(chapters.map((entry) => [entry.id, entry.position])).toEqual([
    [last.id, 1],
    [next.id, 2],
    [chapter.id, 3],
  ]);
});

test("Only the owner can trash or restore, including against global administrators and cross-project identifiers", async () => {
  const { owner, organizer, project, part, chapter, path, chapterPath } =
    await setup();
  const admin = { cookie: await orchestrator.createAdministratorCookie() };
  for (const actor of [null, organizer, admin]) {
    for (const itemPath of [path, `${path}/parts/${part.id}`, chapterPath])
      expect((await request(itemPath, actor, "DELETE")).status).toBe(
        actor ? 404 : 401,
      );
  }
  const other = await work.create(owner.id, { title: "Other" });
  expect(
    (
      await request(
        `/api/v1/works/${other.id}/parts/${part.id}/chapters/${chapter.id}`,
        owner,
        "DELETE",
      )
    ).status,
  ).toBe(404);
  await request(path, owner, "DELETE");
  for (const actor of [organizer, admin]) {
    expect(await (await request("/api/v1/trash", actor)).json()).toEqual([]);
    expect(
      (
        await request("/api/v1/trash", actor, "POST", {
          kind: "work",
          id: project.id,
        })
      ).status,
    ).toBe(404);
  }
  const rows = await database.query({
    text: "SELECT id FROM chapters WHERE id = $1",
    values: [chapter.id],
  });
  expect(rows.rowCount).toBe(1);
});
