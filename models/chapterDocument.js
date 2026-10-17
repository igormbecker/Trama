import { ValidationError } from "infra/errors.js";

export const emptyDocument = { type: "doc", content: [{ type: "paragraph" }] };
export const documentLimit = 1024 * 1024;

function invalid() {
  throw new ValidationError({
    message: "Invalid chapter document (maximum 1 MB).",
  });
}

export function validateDocument(document) {
  let serialized;
  try {
    serialized = JSON.stringify(document);
  } catch {
    invalid();
  }
  if (Buffer.byteLength(serialized || "", "utf8") > documentLimit) invalid();
  let count = 0;
  function visit(node, parent, depth) {
    if (
      !node ||
      typeof node !== "object" ||
      Array.isArray(node) ||
      depth > 30 ||
      ++count > 20000
    )
      invalid();
    const children = {
      doc: ["paragraph", "heading", "bulletList", "orderedList"],
      paragraph: ["text", "hardBreak"],
      heading: ["text", "hardBreak"],
      bulletList: ["listItem"],
      orderedList: ["listItem"],
      listItem: ["paragraph", "bulletList", "orderedList"],
      text: [],
      hardBreak: [],
    };
    if (
      !Object.hasOwn(children, node.type) ||
      (parent ? !children[parent].includes(node.type) : node.type !== "doc")
    )
      invalid();
    const allowed =
      node.type === "text"
        ? ["type", "text", "marks"]
        : node.type === "hardBreak"
          ? ["type", "marks"]
          : ["type", "content", "attrs"];
    if (Object.keys(node).some((key) => !allowed.includes(key))) invalid();
    if (node.attrs !== undefined) {
      const key =
        node.type === "heading"
          ? "level"
          : node.type === "orderedList"
            ? "start"
            : null;
      if (
        !key ||
        !node.attrs ||
        Object.keys(node.attrs).some(
          (field) =>
            field !== key && !(node.type === "orderedList" && field === "type"),
        )
      )
        invalid();
      if (
        node.type === "orderedList" &&
        node.attrs.type !== undefined &&
        node.attrs.type !== null &&
        !["1", "a", "A", "i", "I"].includes(node.attrs.type)
      )
        invalid();
      const value = node.attrs[key];
      if (
        !Number.isSafeInteger(value) ||
        value < 1 ||
        (key === "level" && value > 3)
      )
        invalid();
    }
    if (node.type === "text" || node.type === "hardBreak") {
      if (
        (node.type === "text" &&
          (typeof node.text !== "string" || !node.text)) ||
        (node.marks !== undefined && !Array.isArray(node.marks))
      )
        invalid();
      const types = new Set();
      for (const mark of node.marks || []) {
        if (
          !mark ||
          !["bold", "italic", "link"].includes(mark.type) ||
          types.has(mark.type)
        )
          invalid();
        types.add(mark.type);
        if (Object.keys(mark).some((key) => !["type", "attrs"].includes(key)))
          invalid();
        if (mark.type === "link") {
          if (
            !mark.attrs ||
            Object.keys(mark.attrs).some(
              (key) =>
                !["href", "target", "rel", "class", "title"].includes(key),
            )
          )
            invalid();
          if (
            typeof mark.attrs.href !== "string" ||
            mark.attrs.href.length > 2048 ||
            !/^(https?:\/\/|mailto:)/i.test(mark.attrs.href) ||
            /\s/.test(mark.attrs.href) ||
            Array.from(mark.attrs.href).some(
              (character) => character.charCodeAt(0) < 32,
            )
          )
            invalid();
          for (const key of ["target", "rel", "class", "title"])
            if (
              mark.attrs[key] !== undefined &&
              mark.attrs[key] !== null &&
              typeof mark.attrs[key] !== "string"
            )
              invalid();
        } else if (mark.attrs !== undefined) invalid();
      }
    }
    if (node.content !== undefined) {
      if (!Array.isArray(node.content) || !children[node.type].length)
        invalid();
      for (const child of node.content) visit(child, node.type, depth + 1);
    }
    if (node.type === "listItem" && node.content?.[0]?.type !== "paragraph")
      invalid();
    if (
      ["bulletList", "orderedList", "doc"].includes(node.type) &&
      !node.content?.length
    )
      invalid();
  }
  visit(document, null, 0);
  return document;
}
