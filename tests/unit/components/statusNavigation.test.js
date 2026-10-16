import { getStatusReturnPath } from "components/home/statusNavigation";
test.each([
  ["/login", "/login"],
  ["/works", "/works"],
  ["/users?search=reader", "/users?search=reader"],
  [undefined, "/"],
  ["//example.com", "/"],
  ["/\\example.com", "/"],
  ["https://example.com", "/"],
  ["/status?returnTo=/login", "/"],
  [["/login"], "/"],
])("Returns safely to %s", (input, expected) => {
  expect(getStatusReturnPath(input)).toBe(expected);
});

test.each(["/\\example.com", "/\n/example.com"])(
  "Rejects browser-normalized external paths: %s",
  (value) => {
    expect(getStatusReturnPath(value)).toBe("/");
  },
);
