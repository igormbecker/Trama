import { validateDocument } from "models/chapterDocument.js";
import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";

test("Accepts the attributes emitted by the installed Tiptap extensions", () => {
  const schema = getSchema([StarterKit]);
  const document = schema
    .nodeFromJSON({
      type: "doc",
      content: [
        {
          type: "orderedList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "Carta",
                      marks: [
                        {
                          type: "link",
                          attrs: { href: "https://example.com" },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })
    .toJSON();
  expect(validateDocument(document)).toEqual(document);
});

test("Preserves supported rich text and safe links", () => {
  const document = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Carta",
            marks: [
              { type: "bold" },
              { type: "link", attrs: { href: "https://example.com" } },
            ],
          },
        ],
      },
    ],
  };
  expect(validateDocument(document)).toEqual(document);
});

test("Preserves a soft line break inside bold text", () => {
  const document = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "hardBreak", marks: [{ type: "bold" }] }],
      },
    ],
  };
  expect(validateDocument(document)).toEqual(document);
});

test("Rejects images, unknown formatting, unsafe links and malformed trees", () => {
  for (const document of [
    {
      type: "doc",
      content: [{ type: "image", attrs: { src: "data:image/png;base64,abc" } }],
    },
    { type: "doc", content: [{ type: "text", text: "Invalid parent" }] },
    {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Link",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ],
    },
    { type: "doc", attrs: { onclick: "evil" }, content: [] },
    { type: "doc", content: [{ type: "heading", attrs: { level: 9 } }] },
    {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "x".repeat(1048576) }],
        },
      ],
    },
  ])
    expect(() => validateDocument(document)).toThrow();
});
