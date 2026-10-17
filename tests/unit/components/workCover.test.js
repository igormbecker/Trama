import { getWorkCoverColor } from "components/works/workCover.js";

test("Keeps each work's cover color stable", () => {
  expect(getWorkCoverColor("98ea9191-aa8b-4c48-bc01-9ed32870b232")).toBe(
    getWorkCoverColor("98ea9191-aa8b-4c48-bc01-9ed32870b232"),
  );
  expect(getWorkCoverColor("98ea9191-aa8b-4c48-bc01-9ed32870b232")).toMatch(
    /^#[0-9a-f]{6}$/,
  );
});

test("Uses varied colors across works", () => {
  const colors = Array.from({ length: 20 }, (_, index) =>
    getWorkCoverColor(`work-${index}`),
  );
  expect(new Set(colors).size).toBeGreaterThan(1);
});
