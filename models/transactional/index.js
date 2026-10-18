import React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
  render,
  toPlainText,
} from "react-email";
import { ValidationError } from "infra/errors.js";

function MessageEmail({ title, paragraphs, actionLabel, actionUrl }) {
  return React.createElement(
    Html,
    { lang: "pt-BR" },
    React.createElement(Head),
    React.createElement(Preview, null, title),
    React.createElement(
      Body,
      {
        style: {
          backgroundColor: "#efebe1",
          color: "#292735",
          fontFamily: "Arial, sans-serif",
          padding: "32px 12px",
        },
      },
      React.createElement(
        Container,
        {
          style: {
            backgroundColor: "#faf8f3",
            maxWidth: "560px",
            padding: "32px",
            borderRadius: "12px",
          },
        },
        React.createElement(
          Text,
          {
            style: {
              color: "#3d3787",
              fontSize: "30px",
              fontWeight: "700",
              margin: "0 0 24px",
            },
          },
          "trama",
        ),
        React.createElement(
          Heading,
          { as: "h1", style: { fontSize: "24px", lineHeight: "32px" } },
          title,
        ),
        ...paragraphs.map((paragraph, index) =>
          React.createElement(
            Text,
            { key: index, style: { fontSize: "16px", lineHeight: "26px" } },
            paragraph,
          ),
        ),
        React.createElement(
          Button,
          {
            href: actionUrl,
            style: {
              backgroundColor: "#3d3787",
              color: "#ffffff",
              padding: "14px 20px",
              borderRadius: "6px",
              margin: "16px 0",
            },
          },
          actionLabel,
        ),
        React.createElement(
          Text,
          {
            style: {
              fontSize: "13px",
              lineHeight: "21px",
              wordBreak: "break-all",
            },
          },
          `Se o botão não abrir, copie este endereço: ${actionUrl}`,
        ),
        React.createElement(Hr, {
          style: { borderColor: "#ded8cc", margin: "24px 0" },
        }),
        React.createElement(
          Text,
          { style: { color: "#68626d", fontSize: "12px", lineHeight: "20px" } },
          "Pessoas, ideias e capítulos. Uma obra construída em conjunto. Bectec — Tecnologia e Desenvolvimento de Software.",
        ),
      ),
    ),
  );
}

export async function renderMessage(content) {
  let actionUrl;
  try {
    actionUrl = new URL(content?.actionUrl);
  } catch {
    throw new ValidationError({ message: "Invalid email action URL." });
  }
  const isLocalLink =
    ["development", "test"].includes(process.env.NODE_ENV) &&
    ["localhost", "127.0.0.1"].includes(actionUrl.hostname) &&
    actionUrl.protocol === "http:";
  if (
    (actionUrl.protocol !== "https:" && !isLocalLink) ||
    actionUrl.username ||
    actionUrl.password ||
    ![content.title, content.actionLabel].every(
      (value) => typeof value === "string" && value.trim(),
    ) ||
    !Array.isArray(content.paragraphs) ||
    !content.paragraphs.length ||
    !content.paragraphs.every(
      (value) => typeof value === "string" && value.trim(),
    )
  ) {
    throw new ValidationError({ message: "Invalid email content." });
  }
  const html = await render(React.createElement(MessageEmail, content));
  return {
    html,
    text: toPlainText(html, {
      selectors: [{ selector: "h1", options: { uppercase: false } }],
    }),
  };
}
