import orchestrator from "tests/orchestrator";
import session from "models/session";
import work from "models/work";
import workStructure from "models/workStructure";
import workInvitation from "models/workInvitation";
import chapterRequest from "models/chapterRequest";
import JSZip from "jszip";

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
async function request(path, user, method = "GET", body) {
  return fetch(`http://127.0.0.1:3002${path}`, {
    method,
    headers: { Cookie: user?.cookie || "", "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
test("Only the owner confirms credits, and historical participants remain suggestions until selected", async () => {
  const owner = await account();
  const reviewer = await account();
  const book = await work.create(owner.id, { title: "Livro com créditos" });
  const path = `/api/v1/works/${book.id}/credits`;
  expect((await request(path)).status).toBe(401);
  expect((await request(path, reviewer)).status).toBe(404);
  const initial = await (await request(path, owner)).json();
  expect(initial.has_saved_credits).toBe(false);
  expect(initial.credits).toEqual({
    authors: [],
    contributors: [],
    reviewers: [],
  });
  const part = await workStructure.createPart(book.id, owner.id, {
    title: "Parte",
  });
  const chapter = await workStructure.createChapter(
    book.id,
    part.id,
    owner.id,
    { title: "Capítulo" },
  );
  const invitation = await workInvitation.create(book.id, owner.id, {
    email: reviewer.email,
  });
  await workInvitation.respond(invitation.token, reviewer.id, {
    action: "accept",
  });
  await chapterRequest.create(book.id, chapter.id, owner.id, {
    assignee_user_id: reviewer.id,
    kind: "review",
    instructions: "Revise.",
  });
  await chapterRequest.act(book.id, chapter.id, reviewer.id, {
    action: "conclude_review",
    verdict: "approved",
  });
  const suggested = await (await request(path, owner)).json();
  expect(suggested.credits).toEqual(initial.credits);
  expect(suggested.suggestions.reviewers).toContain(
    `${reviewer.name} — Capítulo`,
  );
  const credits = {
    authors: ["Autora sem conta"],
    contributors: [],
    reviewers: [`${reviewer.name} — Capítulo`],
  };
  expect((await request(path, reviewer, "PUT", credits)).status).toBe(404);
  expect(
    (await request(path, owner, "PUT", { ...credits, owner_id: reviewer.id }))
      .status,
  ).toBe(400);
  expect(
    (
      await request(path, owner, "PUT", {
        ...credits,
        authors: ["x".repeat(256)],
      })
    ).status,
  ).toBe(400);
  expect((await request(path, owner, "PUT", credits)).status).toBe(200);
  const saved = await request(path, owner);
  expect(saved.headers.get("cache-control")).toBe("private, no-store");
  const savedData = await saved.json();
  expect(savedData.credits).toEqual(credits);
  expect(savedData.has_saved_credits).toBe(true);
  const exported = await request(
    `/api/v1/works/${book.id}/export?format=docx`,
    owner,
  );
  expect(exported.status).toBe(200);
  const archive = await JSZip.loadAsync(await exported.arrayBuffer());
  const xml = await archive.file("word/document.xml").async("string");
  expect(xml).toContain("Autora sem conta");
  expect(xml).toContain("Créditos da obra");
});
