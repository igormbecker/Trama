import { exportBlocks, generateDocx, generatePdf } from "models/workExport";
import JSZip from "jszip";
import PDFDocument from "pdfkit";

jest.mock("pdfkit", () => {
  const ActualDocument = jest.requireActual("pdfkit");
  return jest.fn((options) => {
    const pdf = new ActualDocument(options);
    const text = pdf.text;
    pdf.renderedText = [];
    jest.spyOn(pdf, "text").mockImplementation(function (...args) {
      pdf.renderedText.push({
        text: args[0],
        page: pdf.page,
        x: args[1],
        y: args[2],
        options: args[3],
      });
      return text.apply(this, args);
    });
    return pdf;
  });
});
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

test("Includes the work description before the manuscript and omits empty descriptions", () => {
  const describedReading = {
    ...reading,
    work: { ...reading.work, description: "Primeira linha.\nSegunda linha." },
  };
  const blocks = exportBlocks(describedReading);
  const text = blocks.map((block) =>
    block.runs.map((run) => run.text).join(""),
  );
  expect(text.slice(0, 4)).toEqual([
    "Livro de ação",
    "Descrição da obra",
    "Primeira linha.",
    "Segunda linha.",
  ]);
  expect(text.indexOf("1. Parte")).toBeGreaterThan(
    text.indexOf("Segunda linha."),
  );
  expect(
    exportBlocks(reading).some((block) =>
      block.runs.some((run) => run.text === "Descrição da obra"),
    ),
  ).toBe(false);
});

test("DOCX includes a visible linked contents table and editable page references", async () => {
  const archive = await JSZip.loadAsync(
    await generateDocx({
      ...reading,
      work: { ...reading.work, description: "Uma descrição da obra." },
    }),
  );
  const xml = await archive.file("word/document.xml").async("string");
  const settings = await archive.file("word/settings.xml").async("string");
  expect(xml).toContain("Uma descrição da obra.");
  expect(xml).toContain("Sumário");
  expect(xml).toContain("TOC");
  expect(xml).toContain("PAGEREF");
  expect(xml).toContain('w:anchor="export_section_');
  expect(xml).toContain('w:name="export_section_');
  expect(settings).toContain("w:updateFields");
  expect(xml.indexOf("Uma descrição da obra.")).toBeLessThan(
    xml.indexOf("Sumário"),
  );
  expect(xml.match(/1.2. Capítulo/g)).toHaveLength(2);
});

test("PDF contents includes actual chapter page numbers after a long description", async () => {
  await generatePdf({
    ...reading,
    work: { ...reading.work, description: "Descrição extensa.\n".repeat(120) },
  });
  const pdf = PDFDocument.mock.results.at(-1).value;
  const rendered = pdf.renderedText;
  expect(rendered.some((entry) => entry.text === "Descrição")).toBe(true);
  expect(rendered.some((entry) => entry.text === "Sumário")).toBe(true);
  const tocEntry = rendered.findIndex(
    (entry) => entry.text === "1.2. Capítulo",
  );
  expect(tocEntry).toBeGreaterThan(-1);
  const chapterStart = rendered.find((entry) => entry.text === "1.2.");
  const pages = [...new Set(rendered.map((entry) => entry.page))];
  expect(rendered[tocEntry + 1].text).toBe(
    `${pages.indexOf(chapterStart.page) + 1}`,
  );
});

test("PDF paginates a long contents table and links every entry to its actual page", async () => {
  const chapters = Array.from({ length: 35 }, (_, index) => ({
    ...reading.parts[0].chapters[0],
    position: index + 1,
    title: `Capítulo ${index + 1} ${"com um título extenso ".repeat(9)}`,
  }));
  await generatePdf({ ...reading, parts: [{ ...reading.parts[0], chapters }] });
  const pdf = PDFDocument.mock.results.at(-1).value;
  const rendered = pdf.renderedText;
  const contentsPages = rendered.filter((entry) => entry.text === "Sumário");
  expect(contentsPages.length).toBeGreaterThan(1);
  const pages = [...new Set(rendered.map((entry) => entry.page))];
  for (const chapter of chapters) {
    const title = `1.${chapter.position}. ${chapter.title}`;
    const rowIndex = rendered.findIndex((entry) => entry.text === title);
    expect(rowIndex).toBeGreaterThan(-1);
    const row = rendered[rowIndex];
    const start = rendered.find(
      (entry) => entry.text === `1.${chapter.position}.`,
    );
    expect(rendered[rowIndex + 1].text).toBe(
      `${pages.indexOf(start.page) + 1}`,
    );
    expect(row.options.goTo).toBe(`export_section_1_${chapter.position}`);
    expect(row.y).toBeGreaterThanOrEqual(115);
    expect(row.y).toBeLessThan(row.page.height - 84);
  }
});

test("Exports an empty work without a description or broken chapter references", async () => {
  const emptyReading = {
    work: { title: "Obra vazia", description: "  \n  " },
    parts: [],
  };
  const archive = await JSZip.loadAsync(await generateDocx(emptyReading));
  const xml = await archive.file("word/document.xml").async("string");
  expect(xml).toContain("Sumário");
  expect(xml).not.toContain("Descrição da obra");
  expect(xml).not.toContain("PAGEREF");
  await expect(generatePdf(emptyReading)).resolves.toBeInstanceOf(Buffer);
});
