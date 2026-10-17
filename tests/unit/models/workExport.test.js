import { exportBlocks, generateDocx, generatePdf } from "models/workExport";
import JSZip from "jszip";
const reading = {
  work: { title: "Livro de ação" },
  parts: [
    {
      title: "Parte",
      position: 1,
      chapters: [
        {
          title: "Capítulo",
          position: 2,
          document: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Olá",
                    marks: [{ type: "bold" }, { type: "italic" }],
                  },
                ],
              },
              {
                type: "orderedList",
                attrs: { start: 3 },
                content: [
                  {
                    type: "listItem",
                    content: [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "Item" }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      ],
    },
  ],
};
test("Builds the manuscript in editorial order and preserves inline formatting and list starts", () => {
  const blocks = exportBlocks(reading);
  expect(
    blocks.map((block) => block.runs.map((run) => run.text).join("")),
  ).toEqual(["Livro de ação", "1. Parte", "1.2. Capítulo", "Olá", "3. Item"]);
  expect(blocks[3].runs[0]).toMatchObject({ bold: true, italic: true });
});
test("Generates downloadable DOCX and PDF binary files", async () => {
  const docx = await generateDocx(reading);
  const pdf = await generatePdf(reading);
  expect(docx.subarray(0, 2).toString()).toBe("PK");
  expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  const archive = await JSZip.loadAsync(docx);
  const xml = await archive.file("word/document.xml").async("string");
  expect(xml).toContain("Livro de ação");
  expect(xml).toContain("1.2. Capítulo");
  expect(xml).toContain("<w:b/>");
  expect(xml).toContain("<w:i/>");
  expect(xml).not.toContain("bectec");
  expect(xml).toContain("<w:tbl>");
  expect(xml).toContain('w:val="center"');
  expect(xml).toContain("w:fill=");
});
