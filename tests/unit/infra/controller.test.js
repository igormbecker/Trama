import { jest } from "@jest/globals";
import controller from "infra/controller.js";

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe("Session cookie", () => {
  test.each(["development", "production"])(
    "Protects the cookie in %s",
    (environment) => {
      jest.replaceProperty(process.env, "NODE_ENV", environment);
      jest.useFakeTimers().setSystemTime(new Date("2026-10-15T12:00:00.000Z"));
      const response = { setHeader: jest.fn() };
      const session = {
        token: "a".repeat(96),
        expires_at: new Date("2026-10-16T12:00:00.000Z"),
      };

      controller.setSessionCookie(response, session);

      const cookie = response.setHeader.mock.calls.find(
        ([name]) => name === "Set-Cookie",
      )[1];
      const attributes = cookie.split("; ");
      expect(attributes).toEqual(
        expect.arrayContaining([
          `trama_session_id=${session.token}`,
          "Max-Age=86400",
          "Expires=Fri, 16 Oct 2026 12:00:00 GMT",
          "Path=/",
          "HttpOnly",
          "SameSite=Lax",
        ]),
      );
      expect(attributes.includes("Secure")).toBe(environment === "production");
      expect(
        attributes.some((attribute) => attribute.startsWith("Domain=")),
      ).toBe(false);
    },
  );
});

describe("Clear session cookie", () => {
  test.each(["development", "production"])(
    "Removes the cookie with matching attributes in %s",
    (environment) => {
      jest.replaceProperty(process.env, "NODE_ENV", environment);
      const response = { setHeader: jest.fn() };

      controller.clearSessionCookie(response);

      const cookie = response.setHeader.mock.calls.find(
        ([name]) => name === "Set-Cookie",
      )[1];
      const attributes = cookie.split("; ");
      expect(attributes).toEqual(
        expect.arrayContaining([
          "trama_session_id=",
          "Max-Age=0",
          "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
          "Path=/",
          "HttpOnly",
          "SameSite=Lax",
        ]),
      );
      expect(attributes.includes("Secure")).toBe(environment === "production");
      expect(
        attributes.some((attribute) => attribute.startsWith("Domain=")),
      ).toBe(false);
    },
  );
});
