export function wordHeadingLevel(className = "", style = "") {
  const classes = className.toLowerCase().split(/\s+/);
  if (classes.includes("msotitle")) return 1;
  if (classes.includes("msosubtitle")) return 2;
  const headingClass = classes.find((value) => /^msoheading[1-3]$/.test(value));
  if (headingClass) return Number(headingClass.slice(-1));

  const declarations = style.split(";").map((value) => value.trim());
  for (const declaration of declarations) {
    const outline = declaration.match(/^mso-outline-level\s*:\s*([1-3])$/i);
    if (outline) return Number(outline[1]);
    const name = declaration
      .match(/^mso-style-name\s*:\s*(.*?)$/i)?.[1]
      .replace(/^["']|["']$/g, "")
      .trim()
      .toLowerCase();
    if (["title", "título"].includes(name)) return 1;
    if (["subtitle", "subtítulo"].includes(name)) return 2;
    const headingName = name?.match(/^(?:heading|título)\s*([1-3])$/);
    if (headingName) return Number(headingName[1]);
  }
  return null;
}

export function preserveWordHeadings(html) {
  const document = new DOMParser().parseFromString(html, "text/html");
  for (const paragraph of document.body.querySelectorAll("p")) {
    const level = wordHeadingLevel(
      paragraph.getAttribute("class") || "",
      paragraph.getAttribute("style") || "",
    );
    if (!level) continue;
    const heading = document.createElement(`h${level}`);
    // Keep inline formatting for Tiptap's existing schema to parse and clean.
    heading.append(...paragraph.childNodes);
    paragraph.replaceWith(heading);
  }
  return document.body.innerHTML;
}
