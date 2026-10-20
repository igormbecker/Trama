import orchestrator from "tests/orchestrator.js";
import session from "models/session.js";
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
function request(path, actor, method = "GET", body) {
  return fetch(`${base}${path}`, {
    method,
    headers: { Cookie: actor.cookie, "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

test("Group assignments reuse sections, saved reading, export and organizer permissions", async () => {
  const owner = await account();
  const organizer = await account();
  const response = await request("/api/v1/works", owner, "POST", {
    title: "Pesquisa em grupo",
    type: "group_assignment",
  });
  expect(response.status).toBe(201);
  const work = await response.json();
  expect(work.type).toBe("group_assignment");
  const basePath = `/api/v1/works/${work.id}`;
  const partResponse = await request(`${basePath}/parts`, owner, "POST", {
    title: "Pesquisa",
  });
  expect(partResponse.status).toBe(201);
  const part = await partResponse.json();
  const sectionResponse = await request(
    `${basePath}/parts/${part.id}/chapters`,
    owner,
    "POST",
    { title: "Introdução" },
  );
  expect(sectionResponse.status).toBe(201);
  const section = await sectionResponse.json();
  const chapterPath = `${basePath}/chapters/${section.id}`;
  const leaseResponse = await request(
    `${chapterPath}/lease`,
    owner,
    "POST",
    {},
  );
  expect(leaseResponse.status).toBe(200);
  const lease = await leaseResponse.json();
  const saved = await request(chapterPath, owner, "PUT", {
    token: lease.token,
    revision: 0,
    document: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Introdução da pesquisa em grupo." }],
        },
      ],
    },
  });
  expect(saved.status).toBe(200);
  const invitation = await workInvitation.create(work.id, owner.id, {
    email: organizer.email,
  });
  await workInvitation.respond(invitation.token, organizer.id, {
    action: "accept",
  });
  const listed = await (await request("/api/v1/works", organizer)).json();
  expect(listed).toEqual([work]);
  const page = await request(`/works/${work.id}`, organizer);
  expect(page.status).toBe(200);
  expect(await page.text()).toContain("seções");
  const reading = await request(`/works/${work.id}/read`, organizer);
  expect(await reading.text()).toContain("Introdução da pesquisa em grupo.");
  expect(
    (await request(`${chapterPath}/lease`, organizer, "POST", {})).status,
  ).toBe(404);
  expect(
    (await request(`${basePath}/parts`, organizer, "POST", { title: "Denied" }))
      .status,
  ).toBe(404);
  expect(
    (await request(`${basePath}/export?format=pdf`, organizer)).status,
  ).toBe(404);
  const pdf = await request(`${basePath}/export?format=pdf`, owner);
  expect(pdf.status).toBe(200);
  expect(pdf.headers.get("content-type")).toContain("application/pdf");
});
