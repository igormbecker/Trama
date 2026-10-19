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
function renderNode(node, key, context) {
  if (node.type === "text") {
    const start = context.offset;
    context.offset += node.text.length;
    const comments = context.annotations.filter(
      (comment) => comment.start < context.offset && comment.end > start,
    );
    if (!comments.length) return inline(node, key);
    const boundaries = [
      ...new Set([
        start,
        context.offset,
        ...comments.flatMap((comment) => [
          Math.max(start, comment.start),
          Math.min(context.offset, comment.end),
        ]),
      ]),
    ].sort((a, b) => a - b);
    return boundaries.slice(0, -1).map((from, index) => {
      const marked = comments.filter(
        (comment) => comment.start <= from && comment.end > from,
      );
      const text = inline(
        {
          ...node,
          text: node.text.slice(from - start, boundaries[index + 1] - start),
        },
        `${key}-${index}`,
      );
      return marked.length ? (
        <mark
          key={`${key}-${index}`}
          data-review-comment={marked[0].id}
          onClick={() => context.onComment?.(marked[0].id)}
        >
          {text}
        </mark>
      ) : (
        text
      );
    });
  }
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
    renderNode(child, `${key}-${index}`, context),
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
export default function ChapterReader({
  document,
  annotations = [],
  onComment,
}) {
  const context = { offset: 0, annotations, onComment };
  return (
    <>
      {document.content?.map((node, index) =>
        renderNode(node, `${index}`, context),
      )}
    </>
  );
}
