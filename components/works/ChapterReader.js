function inline(node, key) {
  let text = node.text;
  for (const mark of node.marks || []) {
    if (mark.type === "bold")
      text = <strong key={`${key}-bold`}>{text}</strong>;
    if (mark.type === "italic") text = <em key={`${key}-italic`}>{text}</em>;
    if (
      mark.type === "link" &&
      /^(https?:\/\/|mailto:)/i.test(mark.attrs?.href || "")
    )
      text = (
        <a
          key={`${key}-link`}
          href={mark.attrs.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {text}
        </a>
      );
  }
  return <span key={key}>{text}</span>;
}
function renderNode(node, key) {
  if (node.type === "text") return inline(node, key);
  if (node.type === "hardBreak") return <br key={key} />;
  const tags = {
    paragraph: "p",
    heading: `h${(node.attrs?.level || 1) + 1}`,
    bulletList: "ul",
    orderedList: "ol",
    listItem: "li",
  };
  const Tag = tags[node.type];
  const content = node.content?.map((child, index) =>
    renderNode(child, `${key}-${index}`),
  );
  return Tag ? (
    <Tag
      key={key}
      {...(node.type === "orderedList"
        ? { start: node.attrs?.start || 1, type: node.attrs?.type || "1" }
        : {})}
    >
      {content || <br />}
    </Tag>
  ) : null;
}
export default function ChapterReader({ document }) {
  return (
    <>{document.content?.map((node, index) => renderNode(node, `${index}`))}</>
  );
}
