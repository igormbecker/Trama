import { validPosition } from "models/readingProgress";

test("rejects invalid progress coordinates", () => {
  expect(validPosition({ index: -1 })).toBe(false);
  expect(validPosition({ index: 2 })).toBe(true);
  expect(validPosition({ block: 1, seconds: -1 }, 3)).toBe(false);
  expect(validPosition({ block: 3, seconds: 1 }, 3)).toBe(false);
  expect(validPosition({ block: 2, seconds: 1.25 }, 3)).toBe(true);
});
