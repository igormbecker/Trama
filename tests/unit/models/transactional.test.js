import { renderMessage } from "models/transactional/index.js";

const content = {
  title: "Uma mensagem do Trama",
  paragraphs: ["Olá, Clara & Lídia!", "Sua obra está pronta para leitura."],
  actionLabel: "Abrir Trama",
  actionUrl: "https://trama.bectec.com.br/login",
};

test("Renders the same message and action in HTML and plain text", async () => {
  const result = await renderMessage(content);
  expect(result.html).toContain('lang="pt-BR"');
  expect(result.html).toContain("Olá, Clara &amp; Lídia!");
  expect(result.html).toContain(content.actionUrl);
  expect(result.text).toContain(content.title);
  expect(result.text).toContain(content.paragraphs[0]);
  expect(result.text).toContain(content.actionUrl);
  expect(result.text).toContain("Bectec");
  expect(result.text).toContain("Software desenvolvido por Bectec");
  expect(result.text).toContain("Trama · Pessoas, ideias e capítulos.");
});

test("Escapes content instead of interpreting it as arbitrary HTML", async () => {
  const result = await renderMessage({
    ...content,
    paragraphs: ["<script>alert(1)</script>"],
  });
  expect(result.html).not.toContain("<script>");
  expect(result.html).toContain("&lt;script&gt;");
});

test("Highlights the work title while escaping its text and preserving plain text", async () => {
  const workTitle = "Memórias & <Futuro>";
  const result = await renderMessage({
    ...content,
    paragraphs: [`Convite para a obra ${workTitle} como organizador.`],
    highlight: workTitle,
  });
  expect(result.html).toContain(
    "<strong>Memórias &amp; &lt;Futuro&gt;</strong>",
  );
  expect(result.text).toContain(workTitle);
});

test.each([
  "javascript:alert(1)",
  "data:text/html,unsafe",
  "http://external.example.com",
  "invalid",
])("Rejects unsafe action links: %s", async (actionUrl) => {
  await expect(renderMessage({ ...content, actionUrl })).rejects.toMatchObject({
    name: "ValidationError",
  });
});
