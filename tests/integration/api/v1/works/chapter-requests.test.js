import orchestrator from "tests/orchestrator.js";
import session from "models/session.js";
import work from "models/work.js";
import workStructure from "models/workStructure.js";
import workInvitation from "models/workInvitation.js";
import chapterContent from "models/chapterContent.js";
import workParticipant from "models/workParticipant.js";
import database from "infra/database.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDataBase();
  await orchestrator.runPendingMigrations();
});
async function account() {
  const created = await orchestrator.createUser({});
  return {
    ...created,
    cookie: `trama_session_id=${(await session.create(created.id)).token}`,
  };
}
function request(path, person, method = "GET", body) {
  return fetch(`http://127.0.0.1:3002${path}`, {
    method,
    headers: {
      Cookie: person?.cookie || "",
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
async function setup() {
  const owner = await account();
  const contributor = await account();
  const createdWork = await work.create(owner.id, { title: "Obra editorial" });
  const part = await workStructure.createPart(createdWork.id, owner.id, {
    title: "Parte",
  });
  const chapter = await workStructure.createChapter(
    createdWork.id,
    part.id,
    owner.id,
    { title: "Capítulo" },
  );
  const invitation = await workInvitation.create(createdWork.id, owner.id, {
    email: contributor.email,
  });
  await workInvitation.respond(invitation.token, contributor.id, {
    action: "accept",
  });
  return {
    owner,
    contributor,
    work: createdWork,
    chapter,
    path: `/api/v1/works/${createdWork.id}/chapters/${chapter.id}/request`,
  };
}
const submittedDocument = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "Entrega" }] },
  ],
};

test("Chapter lists expose only editorial progress to authorized participants", async () => {
  const { owner, contributor, work: book, chapter, path } = await setup();
  expect(
    (await workStructure.findAll(book.id, owner.id))[0].chapters[0]
      .editorial_request,
  ).toBeNull();
  await request(path, owner, "POST", {
    assignee_user_id: contributor.id,
    kind: "review",
    instructions: "Private instructions",
  });
  const list = await workStructure.findAll(book.id, contributor.id);
  expect(list[0].chapters[0].editorial_request).toEqual({
    kind: "review",
    status: "writing",
    review_verdict: null,
    assignee_name: contributor.name,
    adjustments_requested: false,
  });
  const chapters = await workStructure.listChapters(
    book.id,
    chapter.part_id,
    owner.id,
  );
  expect(chapters[0].editorial_request).toEqual(
    list[0].chapters[0].editorial_request,
  );
  const outsider = await account();
  await expect(
    workStructure.findAll(book.id, outsider.id),
  ).rejects.toMatchObject({ name: "NotFoundError" });
});

test("My participations lists only my active memberships, keeps completed requests accessible and revokes removed access", async () => {
  const { owner, contributor, work: book, chapter, path } = await setup();
  const endpoint = "/api/v1/participations";
  expect((await request(endpoint)).status).toBe(401);
  const created = await (
    await request(path, owner, "POST", {
      assignee_user_id: contributor.id,
      kind: "review",
      instructions: "Revise.",
    })
  ).json();
  const listed = await request(endpoint, contributor);
  expect(listed.status).toBe(200);
  expect(listed.headers.get("cache-control")).toBe("private, no-store");
  const items = await listed.json();
  expect(items).toHaveLength(1);
  expect(items[0]).toMatchObject({
    id: created.id,
    work_id: book.id,
    chapter_id: chapter.id,
    status: "writing",
  });
  expect(items[0]).not.toHaveProperty("working_document");
  const otherParticipant = await account();
  const otherInvitation = await workInvitation.create(book.id, owner.id, {
    email: otherParticipant.email,
  });
  await workInvitation.respond(otherInvitation.token, otherParticipant.id, {
    action: "accept",
  });
  expect(
    (await request(`${path}?requestId=${created.id}`, otherParticipant)).status,
  ).toBe(404);
  expect(await (await request(endpoint, owner)).json()).toEqual([]);
  await request(path, contributor, "PATCH", {
    action: "conclude_review",
    verdict: "approved",
  });
  await request(path, owner, "POST", {
    assignee_user_id: contributor.id,
    kind: "review",
    instructions: "Nova revisão.",
  });
  expect(
    (await request(`${path}?requestId=${created.id}`, contributor)).status,
  ).toBe(200);
  expect(
    await (
      await request(`${path}?requestId=${created.id}`, contributor)
    ).json(),
  ).toMatchObject({ request: { id: created.id, status: "approved" } });
  const page = await request("/participations", contributor);
  expect(page.status).toBe(200);
  expect(await page.text()).toContain("Concluídas");
  await workParticipant.remove(book.id, contributor.id, owner.id);
  expect(await (await request(endpoint, contributor)).json()).toEqual([]);
  expect(
    (await request(`${path}?requestId=${created.id}`, contributor)).status,
  ).toBe(404);
});

test("A participant writes separately, resubmits after adjustments, and only the owner approves", async () => {
  const fixture = await setup();
  const { owner, contributor, work: book, chapter, path } = fixture;
  const created = await request(path, owner, "POST", {
    assignee_user_id: contributor.id,
    kind: "contribution",
    instructions: "Desenvolva a cena.",
  });
  expect(created.status).toBe(201);
  const initialRequest = await created.json();
  const chapterPage = `/works/${book.id}/chapters/${chapter.id}`;
  expect(await (await request(chapterPage, owner)).text()).toContain(
    "Contribuição",
  );
  expect(await (await request(chapterPage, contributor)).text()).toContain(
    "Trabalhar na cópia",
  );
  expect(
    (
      await request(path, owner, "POST", {
        assignee_user_id: contributor.id,
        kind: "review",
        instructions: "Revise.",
      })
    ).status,
  ).toBe(409);
  expect((await request(path, contributor)).status).toBe(200);
  const lease = await (
    await request(`${path}/lease`, contributor, "POST", {})
  ).json();
  expect(lease.token).toBeTruthy();
  expect(
    (
      await request(path, contributor, "PUT", {
        document: submittedDocument,
        revision: 0,
        token: lease.token,
      })
    ).status,
  ).toBe(200);
  const original = await chapterContent.read(book.id, chapter.id, owner.id);
  expect(original.revision).toBe(0);
  expect(
    (await request(path, contributor, "PATCH", { action: "submit" })).status,
  ).toBe(200);
  expect(
    (
      await request(path, contributor, "PUT", {
        document: submittedDocument,
        revision: 1,
        token: lease.token,
      })
    ).status,
  ).toBe(409);
  expect(
    (
      await request(path, owner, "PATCH", {
        action: "adjust",
        message: "Amplie o final.",
      })
    ).status,
  ).toBe(200);
  expect(
    (await request(path, contributor, "PATCH", { action: "submit" })).status,
  ).toBe(200);
  expect(
    (await request(path, contributor, "PATCH", { action: "approve" })).status,
  ).toBe(404);
  expect(
    (
      await request(path, owner, "PATCH", {
        action: "approve",
        expected_chapter_revision: 0,
      })
    ).status,
  ).toBe(200);
  expect(
    (await chapterContent.read(book.id, chapter.id, owner.id)).document,
  ).toEqual(submittedDocument);
  const history = await database.query({
    text: "SELECT previous_document FROM chapter_requests WHERE chapter_id = $1",
    values: [chapter.id],
  });
  expect(history.rows[0].previous_document).toEqual(original.document);
  expect(
    (
      await request(path, owner, "PATCH", {
        action: "restore",
        expected_chapter_revision: 1,
      })
    ).status,
  ).toBe(200);
  expect(
    (await chapterContent.read(book.id, chapter.id, owner.id)).document,
  ).toEqual(original.document);
  expect(
    (
      await request(path, owner, "POST", {
        assignee_user_id: contributor.id,
        kind: "review",
        instructions: "Revise a próxima versão.",
      })
    ).status,
  ).toBe(201);
  const historical = await (
    await request(`${path}?requestId=${initialRequest.id}`, owner)
  ).json();
  expect(historical.request.status).toBe("approved");
  expect(historical.request.previous_document).toEqual(original.document);
  expect(
    (await request(`${path}?requestId=${initialRequest.id}`, contributor))
      .status,
  ).toBe(200);
});

test("Approval requires explicit comparison when the owner changed the chapter", async () => {
  const { owner, contributor, work: book, chapter, path } = await setup();
  await request(path, owner, "POST", {
    assignee_user_id: contributor.id,
    kind: "contribution",
    instructions: "Revise.",
  });
  const lease = await (
    await request(`${path}/lease`, contributor, "POST", {})
  ).json();
  await request(path, contributor, "PUT", {
    document: submittedDocument,
    revision: 0,
    token: lease.token,
  });
  await request(path, contributor, "PATCH", { action: "submit" });
  const ownerLease = await chapterContent.reserve(
    book.id,
    chapter.id,
    owner.id,
    {},
  );
  await chapterContent.save(book.id, chapter.id, owner.id, {
    document: { type: "doc", content: [{ type: "paragraph" }] },
    revision: 0,
    token: ownerLease.token,
  });
  await chapterContent.release(book.id, chapter.id, owner.id, {
    token: ownerLease.token,
  });
  expect(
    (
      await request(path, owner, "PATCH", {
        action: "approve",
        expected_chapter_revision: 1,
      })
    ).status,
  ).toBe(409);
  expect(
    (
      await request(path, owner, "PATCH", {
        action: "approve",
        expected_chapter_revision: 1,
        confirm_conflict: true,
      })
    ).status,
  ).toBe(200);
});

test("Review comments stay anchored to the requested version and never replace chapter text", async () => {
  const { owner, contributor, work: book, chapter, path } = await setup();
  const lease = await chapterContent.reserve(book.id, chapter.id, owner.id, {});
  await chapterContent.save(book.id, chapter.id, owner.id, {
    document: submittedDocument,
    revision: 0,
    token: lease.token,
  });
  await chapterContent.release(book.id, chapter.id, owner.id, {
    token: lease.token,
  });
  expect(
    (
      await request(path, owner, "POST", {
        assignee_user_id: contributor.id,
        kind: "review",
        instructions: "Confira a cena.",
      })
    ).status,
  ).toBe(201);
  expect((await request(`${path}/lease`, contributor, "POST", {})).status).toBe(
    404,
  );
  expect(
    (await request(path, contributor, "PATCH", { action: "submit" })).status,
  ).toBe(400);
  expect(
    (
      await request(path, contributor, "PATCH", {
        action: "conclude_review",
        verdict: "changes_requested",
      })
    ).status,
  ).toBe(400);
  const comment = {
    action: "comment",
    start: 0,
    end: 7,
    quote: "Entrega",
    message: "Explique melhor este trecho.",
  };
  expect((await request(path, owner, "PATCH", comment)).status).toBe(404);
  expect(
    (await request(path, contributor, "PATCH", { ...comment, quote: "Outro" }))
      .status,
  ).toBe(400);
  expect((await request(path, contributor, "PATCH", comment)).status).toBe(200);
  const changedLease = await chapterContent.reserve(
    book.id,
    chapter.id,
    owner.id,
    {},
  );
  const changed = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Novo texto" }] },
    ],
  };
  await chapterContent.save(book.id, chapter.id, owner.id, {
    document: changed,
    revision: 1,
    token: changedLease.token,
  });
  await chapterContent.release(book.id, chapter.id, owner.id, {
    token: changedLease.token,
  });
  expect(
    (
      await request(path, contributor, "PATCH", {
        action: "conclude_review",
        verdict: "changes_requested",
      })
    ).status,
  ).toBe(200);
  const review = await (await request(path, owner)).json();
  expect(review.request.review_verdict).toBe("changes_requested");
  expect(review.request.review_document).toEqual(submittedDocument);
  expect(review.request.review_comments[0]).toMatchObject({
    start: 0,
    end: 7,
    quote: "Entrega",
  });
  expect((await request(path, contributor, "PATCH", comment)).status).toBe(404);
  expect(
    (
      await request(path, owner, "PATCH", {
        action: "approve",
        expected_chapter_revision: 2,
      })
    ).status,
  ).toBe(400);
  expect(
    (await chapterContent.read(book.id, chapter.id, owner.id)).document,
  ).toEqual(changed);
  expect(
    (
      await request(path, owner, "POST", {
        assignee_user_id: contributor.id,
        kind: "review",
        instructions: "Confira novamente.",
      })
    ).status,
  ).toBe(201);
  expect(
    (
      await request(path, contributor, "PATCH", {
        action: "conclude_review",
        verdict: "approved",
      })
    ).status,
  ).toBe(200);
  expect(
    (await (await request(path, owner)).json()).request.review_verdict,
  ).toBe("approved");
});

test("Removing the assignee immediately blocks access while preserving the owner's request", async () => {
  const { owner, contributor, work: book, path } = await setup();
  expect(
    (
      await request(path, owner, "POST", {
        assignee_user_id: contributor.id,
        kind: "review",
        instructions: "Revise.",
      })
    ).status,
  ).toBe(201);
  await workParticipant.remove(book.id, contributor.id, owner.id);
  expect((await request(path, contributor)).status).toBe(404);
  expect((await request(`${path}/lease`, contributor, "POST", {})).status).toBe(
    404,
  );
  expect((await request(path, owner)).status).toBe(200);
  expect(
    (await request(path, owner, "PATCH", { action: "cancel" })).status,
  ).toBe(200);
});
