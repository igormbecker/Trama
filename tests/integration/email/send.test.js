import { randomUUID } from "node:crypto";
import email from "infra/email.js";
import { renderMessage } from "models/transactional/index.js";

test("Captures a real multipart SMTP message in the isolated test MailCatcher", async () => {
  const subject = `Trama local email ${randomUUID()}`;
  const content = await renderMessage({
    title: "Uma mensagem do Trama",
    paragraphs: ["Esta mensagem foi capturada somente no ambiente de testes."],
    actionLabel: "Abrir Trama",
    actionUrl: "https://trama.bectec.com.br/login",
  });
  const result = await email.send({
    to: "reader@example.invalid",
    subject,
    ...content,
  });
  expect(result.id).toBeTruthy();
  const response = await fetch("http://127.0.0.1:1082/messages");
  expect(response.ok).toBe(true);
  const messages = await response.json();
  const captured = messages.find((message) => message.subject === subject);
  expect(captured).toBeDefined();
  const source = await fetch(
    `http://127.0.0.1:1082/messages/${captured.id}.source`,
  );
  const rawMessage = await source.text();
  expect(rawMessage).toContain("multipart/alternative");
  expect(rawMessage).toContain("text/plain");
  expect(rawMessage).toContain("text/html");
  expect(rawMessage).toContain("reader@example.invalid");
});
