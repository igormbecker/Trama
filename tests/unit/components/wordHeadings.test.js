import { wordHeadingLevel } from "components/works/wordHeadings.js";

test("Recognizes Word title, subtitle and numbered heading styles", () => {
  expect(wordHeadingLevel("MsoTitle")).toBe(1);
  expect(wordHeadingLevel("MsoSubtitle")).toBe(2);
  for (const level of [1, 2, 3]) {
    expect(wordHeadingLevel(`MsoHeading${level}`)).toBe(level);
    expect(wordHeadingLevel("", `margin:0; mso-outline-level:${level};`)).toBe(
      level,
    );
  }
  expect(wordHeadingLevel("custom MsoTitle extra")).toBe(1);
  expect(wordHeadingLevel("", "mso-style-name: 'Título 2';")).toBe(2);
  expect(wordHeadingLevel("", 'mso-style-name: "Heading 3";')).toBe(3);
});

test("Keeps ordinary paragraphs, large text and unsupported styles as paragraphs", () => {
  for (const [className, style] of [
    ["MsoNormal", "font-size:24pt;font-weight:bold"],
    ["myMsoTitle", ""],
    ["MsoHeading4", ""],
    ["", "mso-outline-level:10"],
    ["", "mso-style-name: Heading 12"],
    [undefined, undefined],
  ])
    expect(wordHeadingLevel(className, style)).toBeNull();
});
