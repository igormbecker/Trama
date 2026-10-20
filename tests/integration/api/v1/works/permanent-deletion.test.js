import orchestrator from "tests/orchestrator.js";
import session from "models/session.js";
import database from "infra/database.js";
import work from "models/work.js";
import workStructure from "models/workStructure.js";
import projectTrash from "models/projectTrash.js";
import chapterContent from "models/chapterContent.js";
import chapterRequest from "models/chapterRequest.js";
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
const purge = (actor, input) =>
  fetch(`${base}/api/v1/trash`, {
    method: "DELETE",
    headers: {
      Cookie: actor?.cookie || "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
async function setup() {
  const owner = await account();
  const guest = await account();
  const project = await work.create(owner.id, { title: "Disposable" });
  const part = await workStructure.createPart(project.id, owner.id, {
    title: "Part",
  });
  const chapter = await workStructure.createChapter(
    project.id,
    part.id,
    owner.id,
    { title: "Text" },
  );
  await chapterContent.reserve(project.id, chapter.id, owner.id, {});
  const invitation = await workInvitation.create(project.id, owner.id, {
    email: guest.email,
  });
  await workInvitation.respond(invitation.token, guest.id, {
    action: "accept",
  });
  const editorial = await chapterRequest.create(
    project.id,
    chapter.id,
    owner.id,
    { assignee_user_id: guest.id, kind: "contribution", instructions: "Write" },
  );
  await database.query({
    text: "INSERT INTO chapter_request_events (request_id, actor_user_id, action) VALUES ($1, $2, $3)",
    values: [editorial.id, owner.id, "canceled"],
  });
  return { owner, guest, project, part, chapter };
}
test("Only trashed items with matching title confirmation can be permanently removed", async () => {
  const { owner, guest, project, chapter } = await setup();
  const input = {
    kind: "chapter",
    id: chapter.id,
    confirmation: chapter.title,
  };
  expect((await purge(owner, input)).status).toBe(404);
  await projectTrash.move(project.id, owner.id, "chapter", chapter.id);
  expect((await purge(null, input)).status).toBe(401);
  expect((await purge(guest, input)).status).toBe(404);
  const admin = { cookie: await orchestrator.createAdministratorCookie() };
  expect((await purge(admin, input)).status).toBe(404);
  expect((await purge(owner, { ...input, confirmation: "wrong" })).status).toBe(
    400,
  );
  expect((await purge(owner, { kind: "chapter", id: chapter.id })).status).toBe(
    400,
  );
  expect((await purge(owner, input)).status).toBe(204);
  await expect(
    projectTrash.restore(owner.id, { kind: "chapter", id: chapter.id }),
  ).rejects.toMatchObject({ name: "NotFoundError" });
  expect(
    (
      await database.query({
        text: "SELECT id FROM chapter_requests WHERE chapter_id = $1",
        values: [chapter.id],
      })
    ).rowCount,
  ).toBe(0);
});
test.each(["part", "work"])(
  "Permanently deleting a %s removes its descendants and preserves unrelated data",
  async (kind) => {
    const { owner, guest, project, part, chapter } = await setup();
    const unrelated = await work.create(owner.id, { title: "Keep" });
    const target = kind === "work" ? project : part;
    await projectTrash.move(project.id, owner.id, kind, target.id);
    expect(
      (await purge(owner, { kind, id: target.id, confirmation: target.title }))
        .status,
    ).toBe(204);
    expect(
      (
        await database.query({
          text: "SELECT id FROM chapters WHERE id = $1",
          values: [chapter.id],
        })
      ).rowCount,
    ).toBe(0);
    expect(
      (
        await database.query({
          text: "SELECT id FROM users WHERE id = $1",
          values: [guest.id],
        })
      ).rowCount,
    ).toBe(1);
    expect((await work.findOneById(unrelated.id, owner.id)).title).toBe("Keep");
  },
);
