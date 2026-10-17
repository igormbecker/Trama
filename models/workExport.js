import { readFileSync } from "node:fs";
import path from "node:path";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ExternalHyperlink,
  HeadingLevel,
  Footer,
  PageNumber,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeightRule,
  VerticalAlign,
  BorderStyle,
} from "docx";
import PDFDocument from "pdfkit";
import { getWorkCoverColor } from "./workCover.js";

export function exportBlocks(reading) {
  const blocks = [];
  const heading = (text, level, pageBreak = false) =>
    blocks.push({ level, pageBreak, runs: [{ text }] });
  function inline(node) {
    if (node.type === "hardBreak") return { text: "\n" };
    const marks = node.marks || [];
    return {
      text: node.text || "",
      bold: marks.some((mark) => mark.type === "bold"),
      italic: marks.some((mark) => mark.type === "italic"),
      href: marks.find((mark) => mark.type === "link")?.attrs.href,
    };
  }
  function visit(node, depth = 0, prefix = "") {
    if (["paragraph", "heading"].includes(node.type)) {
      blocks.push({
        level:
          node.type === "heading" ? Math.min(5, node.attrs?.level + 2 || 3) : 0,
        depth,
        runs: [
          ...(prefix ? [{ text: prefix }] : []),
          ...(node.content || []).map(inline),
        ],
      });
    } else if (["bulletList", "orderedList"].includes(node.type)) {
      (node.content || []).forEach((item, index) => {
        const marker =
          node.type === "bulletList"
            ? "• "
            : `${(node.attrs?.start || 1) + index}. `;
        (item.content || []).forEach((child, childIndex) =>
          visit(child, depth + 1, childIndex === 0 ? marker : ""),
        );
      });
    } else (node.content || []).forEach((child) => visit(child, depth));
  }
  heading(reading.work.title, 1);
  for (const part of reading.parts) {
    heading(`${part.position}. ${part.title}`, 2, true);
    part.chapters.forEach((chapter, index) => {
      heading(
        `${part.position}.${chapter.position}. ${chapter.title}`,
        3,
        index > 0,
      );
      visit(chapter.document);
    });
  }
  return blocks;
}

export async function generateDocx(reading) {
  const headings = [
    null,
    HeadingLevel.TITLE,
    HeadingLevel.HEADING_1,
    HeadingLevel.HEADING_2,
    HeadingLevel.HEADING_3,
    HeadingLevel.HEADING_4,
  ];
  const children = exportBlocks(reading)
    .slice(1)
    .map(
      (block) =>
        new Paragraph({
          heading: headings[block.level],
          pageBreakBefore: block.pageBreak,
          spacing: { after: block.level ? 240 : 120, line: 360 },
          indent: block.depth ? { left: block.depth * 360 } : undefined,
          keepNext: Boolean(block.level),
          children: block.runs.map((run) => {
            const text = new TextRun({
              text: run.text,
              bold: run.bold,
              italics: run.italic,
              break: run.text === "\n" ? 1 : undefined,
            });
            return run.href
              ? new ExternalHyperlink({ link: run.href, children: [text] })
              : text;
          }),
        }),
    );
  const coverColor = getWorkCoverColor(
    reading.work.id || reading.work.title,
  ).slice(1);
  const cover = new Table({
    alignment: "center",
    width: { size: 6500, type: WidthType.DXA },
    columnWidths: [6500],
    rows: [
      new TableRow({
        height: { value: 10000, rule: HeightRule.ATLEAST },
        children: [
          new TableCell({
            shading: { fill: coverColor },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 600, bottom: 600, left: 600, right: 600 },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              left: { style: BorderStyle.SINGLE, size: 36, color: "B6A58A" },
            },
            children: [
              new Paragraph({
                alignment: "center",
                spacing: { after: 1600 },
                children: [
                  new TextRun({
                    text: reading.work.title,
                    bold: true,
                    font: "Times New Roman",
                    size: 40,
                    color: "FFFFFF",
                  }),
                ],
              }),
              new Paragraph({
                alignment: "center",
                children: [
                  new TextRun({
                    text: "trama",
                    font: "Times New Roman",
                    size: 24,
                    color: "FFFFFF",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
  children.unshift(cover);
  const document = new Document({
    title: reading.work.title,
    styles: {
      default: {
        document: {
          run: { font: "Times New Roman", size: 24, color: "000000" },
        },
        title: { run: { font: "Times New Roman", size: 36, color: "000000" } },
        heading1: {
          run: {
            font: "Times New Roman",
            size: 32,
            bold: true,
            color: "000000",
          },
        },
        heading2: {
          run: {
            font: "Times New Roman",
            size: 28,
            bold: true,
            color: "000000",
          },
        },
        heading3: { run: { color: "000000" } },
        heading4: { run: { color: "000000" } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: "center",
                children: [new TextRun({ children: [PageNumber.CURRENT] })],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
  return Packer.toBuffer(document);
}

export function generatePdf(reading) {
  return new Promise((resolve, reject) => {
    const fonts = {};
    for (const name of ["regular", "bold", "italic", "boldItalic"]) {
      fonts[name] = readFileSync(
        path.join(process.cwd(), `infra/fonts/inter/${name}.ttf`),
      );
    }
    const pdf = new PDFDocument({
      size: "A4",
      margins: { top: 64, bottom: 84, left: 64, right: 64 },
      bufferPages: true,
      font: fonts.regular,
      info: { Title: reading.work.title, Creator: "Trama" },
    });
    const chunks = [];
    pdf.on("data", (chunk) => chunks.push(chunk));
    pdf.on("error", reject);
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    Object.entries(fonts).forEach(([name, buffer]) =>
      pdf.registerFont(name, buffer),
    );
    const blocks = exportBlocks(reading);
    let cursorY = 64;
    for (const block of blocks) {
      if (block.level === 1) {
        const width = 340;
        const height = 560;
        const x = (pdf.page.width - width) / 2;
        const y = 85;
        pdf
          .roundedRect(x, y, width, height, 5)
          .fill(getWorkCoverColor(reading.work.id || reading.work.title));
        pdf
          .save()
          .fillOpacity(0.25)
          .rect(x, y, 14, height)
          .fill("#ffffff")
          .restore();
        pdf.font("bold").fontSize(27).fillColor("#ffffff");
        const titleHeight = pdf.heightOfString(reading.work.title, {
          width: width - 64,
        });
        pdf.text(
          reading.work.title,
          x + 32,
          y + (height - titleHeight) / 2 - 30,
          { width: width - 64, align: "center" },
        );
        pdf
          .font("regular")
          .fontSize(14)
          .fillColor("#ffffff")
          .text("trama", x + 32, y + height - 60, {
            width: width - 64,
            align: "center",
          });
        continue;
      }
      if (block.pageBreak) {
        pdf.addPage();
        cursorY = 64;
      }
      const size = block.level ? [0, 24, 19, 16, 14, 12][block.level] : 11;
      const lineHeight = size * 1.6;
      const left = 64 + (block.depth || 0) * 16;
      const right = pdf.page.width - 64;
      let cursorX = left;
      function nextLine() {
        cursorX = left;
        cursorY += lineHeight;
        if (cursorY + lineHeight > pdf.page.height - 84) {
          pdf.addPage();
          cursorY = 64;
        }
      }
      if (cursorY + lineHeight * (block.level ? 3 : 1) > pdf.page.height - 84) {
        pdf.addPage();
        cursorY = 64;
      }
      for (const run of block.runs) {
        const font =
          block.level || run.bold
            ? run.italic
              ? "boldItalic"
              : "bold"
            : run.italic
              ? "italic"
              : "regular";
        pdf.font(font).fontSize(size).fillColor("#202020");
        for (const token of run.text.match(/\n|[^\S\n]+|[^\s]+/gu) || []) {
          if (token === "\n") {
            nextLine();
            continue;
          }
          const width = pdf.widthOfString(token);
          if (cursorX + width > right && cursorX > left) nextLine();
          if (/^\s+$/u.test(token)) {
            if (cursorX > left) cursorX += width;
            continue;
          }
          if (width > right - left) {
            for (const character of token) {
              const characterWidth = pdf.widthOfString(character);
              if (cursorX + characterWidth > right) nextLine();
              pdf.text(character, cursorX, cursorY, {
                lineBreak: false,
                link: run.href || null,
                underline: Boolean(run.href),
              });
              cursorX += characterWidth;
            }
          } else {
            pdf.text(token, cursorX, cursorY, {
              lineBreak: false,
              link: run.href || null,
              underline: Boolean(run.href),
            });
            cursorX += width;
          }
        }
      }
      cursorY += lineHeight + (block.level ? 12 : 8);
    }
    const range = pdf.bufferedPageRange();
    for (let index = range.start; index < range.start + range.count; index++) {
      pdf.switchToPage(index);
      const y = pdf.page.height - 50;
      pdf
        .strokeColor("#d5d5d5")
        .lineWidth(0.5)
        .moveTo(64, y - 12)
        .lineTo(pdf.page.width - 64, y - 12)
        .stroke();
      pdf
        .strokeColor("#373a86")
        .lineWidth(1.3)
        .moveTo(64, y + 2)
        .lineTo(77, y + 2)
        .moveTo(64, y + 7)
        .lineTo(77, y + 7)
        .moveTo(64, y + 12)
        .lineTo(77, y + 12)
        .moveTo(67, y)
        .lineTo(67, y + 14)
        .moveTo(74, y)
        .lineTo(74, y + 14)
        .stroke();
      pdf
        .font("bold")
        .fontSize(9)
        .fillColor("#373a86")
        .text("trama", 83, y + 1, { lineBreak: false, continued: false });
      pdf.font("regular").fontSize(7).fillColor("#555555");
      pdf.text(`${index + 1}`, pdf.page.width - 90, y, { lineBreak: false });
    }
    pdf.end();
  });
}
