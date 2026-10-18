import { Resend } from "resend";
import nodemailer from "nodemailer";
import email from "infra/email.js";

jest.mock("resend", () => ({ Resend: jest.fn() }), { virtual: true });
jest.mock("nodemailer", () => ({ createTransport: jest.fn() }), {
  virtual: true,
});

const originalEnvironment = { ...process.env };
const sendResend = jest.fn();
const sendSmtp = jest.fn();
const message = {
  to: "reader@example.com",
  subject: "Conheça o Trama",
  html: "<p>Uma obra construída em conjunto.</p>",
  text: "Uma obra construída em conjunto.",
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env = {
    ...originalEnvironment,
    NODE_ENV: "production",
    VERCEL_ENV: "production",
  };
  process.env.RESEND_API_KEY = "re_fake_key_for_tests";
  process.env.EMAIL_FROM = "Trama <notificacoes@etrama.bectec.com.br>";
  delete process.env.EMAIL_PREVIEW_RECIPIENTS;
  delete process.env.TRAMA_TEST_SERVER;
  sendResend.mockResolvedValue({ data: { id: "email-id" }, error: null });
  sendSmtp.mockResolvedValue({ messageId: "smtp-id" });
  Resend.mockImplementation(() => ({ emails: { send: sendResend } }));
  nodemailer.createTransport.mockReturnValue({ sendMail: sendSmtp });
});

afterEach(() => {
  process.env = { ...originalEnvironment };
});

test("Sends production messages using the configured sender and idempotency key", async () => {
  await expect(
    email.send({ ...message, idempotencyKey: "invitation-123" }),
  ).resolves.toEqual({ id: "email-id" });
  expect(sendResend).toHaveBeenCalledWith(
    { ...message, from: process.env.EMAIL_FROM },
    expect.objectContaining({
      idempotencyKey: "invitation-123",
      signal: expect.any(AbortSignal),
    }),
  );
  expect(sendSmtp).not.toHaveBeenCalled();
});

test("Blocks preview delivery when no explicit recipient list is configured", async () => {
  process.env.VERCEL_ENV = "preview";
  await expect(email.send(message)).rejects.toMatchObject({
    name: "ServiceError",
  });
  expect(Resend).not.toHaveBeenCalled();
});

test("Allows only exact preview addresses, ignoring casing and spaces around entries", async () => {
  process.env.VERCEL_ENV = "preview";
  process.env.EMAIL_PREVIEW_RECIPIENTS =
    " Tester@example.com, READER@example.com ";
  await email.send(message);
  expect(sendResend).toHaveBeenCalledTimes(1);
  await expect(
    email.send({ ...message, to: "other@example.com" }),
  ).rejects.toMatchObject({ name: "ServiceError" });
  expect(sendResend).toHaveBeenCalledTimes(1);
});

test.each([
  "reader@example.com,other@example.com",
  "Reader <reader@example.com>",
  "reader@example.com\r\nBcc: other@example.com",
  ["reader@example.com"],
  "invalid",
])("Rejects ambiguous or invalid recipients: %s", async (to) => {
  await expect(email.send({ ...message, to })).rejects.toMatchObject({
    name: "ValidationError",
  });
  expect(Resend).not.toHaveBeenCalled();
});

test.each(["development", "test"])(
  "Uses only isolated local SMTP in %s even with inherited production keys",
  async (environment) => {
    process.env.NODE_ENV = environment;
    delete process.env.VERCEL_ENV;
    await expect(email.send(message)).resolves.toEqual({ id: "smtp-id" });
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "127.0.0.1",
        port: environment === "test" ? 1027 : 1026,
        secure: false,
      }),
    );
    expect(Resend).not.toHaveBeenCalled();
  },
);

test("Uses the test mailbox when Next.js compiles the isolated server in development mode", async () => {
  process.env.NODE_ENV = "development";
  process.env.TRAMA_TEST_SERVER = "true";
  await email.send(message);
  expect(nodemailer.createTransport).toHaveBeenCalledWith(
    expect.objectContaining({ port: 1027 }),
  );
  expect(Resend).not.toHaveBeenCalled();
});

test.each(["development", "test"])(
  "Keeps %s local even with an inherited Vercel production environment",
  async (environment) => {
    process.env.NODE_ENV = environment;
    await email.send(message);
    expect(Resend).not.toHaveBeenCalled();
    expect(sendSmtp).toHaveBeenCalledTimes(1);
  },
);

test.each(["RESEND_API_KEY", "EMAIL_FROM"])(
  "Fails before contacting the provider without %s",
  async (variable) => {
    delete process.env[variable];
    await expect(email.send(message)).rejects.toMatchObject({
      name: "ServiceError",
    });
    expect(Resend).not.toHaveBeenCalled();
  },
);

test("Blocks an unknown production environment instead of sending without preview restrictions", async () => {
  delete process.env.VERCEL_ENV;
  await expect(email.send(message)).rejects.toMatchObject({
    name: "ServiceError",
  });
  expect(Resend).not.toHaveBeenCalled();
});

test("Provider failures do not leak payloads or keys through errors or trigger duplicate attempts", async () => {
  sendResend.mockResolvedValue({
    data: null,
    error: { message: `private ${process.env.RESEND_API_KEY} ${message.to}` },
  });
  let caught;
  try {
    await email.send(message);
  } catch (error) {
    caught = error;
  }
  expect(caught).toMatchObject({ name: "ServiceError", statusCode: 503 });
  expect(JSON.stringify(caught)).not.toContain(message.to);
  expect(caught.cause).toBeUndefined();
  expect(sendResend).toHaveBeenCalledTimes(1);
});

test("Network failures return the same sanitized service error", async () => {
  sendResend.mockRejectedValue(new Error("private provider details"));
  await expect(email.send(message)).rejects.toMatchObject({
    name: "ServiceError",
    message: "Email delivery failed.",
  });
});

test.each([
  { subject: "" },
  { subject: "Title\nBcc: attacker@example.com" },
  { html: "" },
  { text: "" },
  { cc: "other@example.com" },
  { from: "spoof@example.com" },
])(
  "Rejects incomplete messages and unsupported envelope fields: %j",
  async (fields) => {
    await expect(email.send({ ...message, ...fields })).rejects.toMatchObject({
      name: "ValidationError",
    });
    expect(Resend).not.toHaveBeenCalled();
  },
);
