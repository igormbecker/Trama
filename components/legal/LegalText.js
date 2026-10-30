import Link from "next/link";

function inline(text) {
  return text
    .split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/gu)
    .map((part, index) => {
      if (part.startsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`")) {
        return <code key={index}>{part.slice(1, -1)}</code>;
      }
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/u.exec(part);
      if (!link) {
        return part;
      }
      const href =
        { "terms-of-use.md": "/terms", "privacy-notice.md": "/privacy" }[
          link[2]
        ] || link[2];
      return /^(https:\/\/|mailto:|\/)/u.test(href) ? (
        <Link key={index} href={href}>
          {link[1]}
        </Link>
      ) : (
        link[1]
      );
    });
}
export default function LegalText({ content }) {
  return content
    .trim()
    .split(/\n\s*\n/u)
    .map((block, index) => {
      const heading = /^(#{1,3}) (.+)$/u.exec(block);
      if (heading) {
        const Heading = `h${heading[1].length}`;
        return <Heading key={index}>{inline(heading[2])}</Heading>;
      }
      const lines = block.split("\n");
      if (lines.every((line) => line.startsWith("- "))) {
        return (
          <ul key={index}>
            {lines.map((line, item) => (
              <li key={item}>{inline(line.slice(2))}</li>
            ))}
          </ul>
        );
      }
      if (lines.length > 2 && lines.every((line) => line.startsWith("|"))) {
        const cells = (line) =>
          line
            .split("|")
            .slice(1, -1)
            .map((cell) => cell.trim());
        return (
          <div key={index} style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  {cells(lines[0]).map((cell, item) => (
                    <th scope="col" key={item}>
                      {inline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.slice(2).map((line, row) => (
                  <tr key={row}>
                    {cells(line).map((cell, item) => (
                      <td key={item}>{inline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      return <p key={index}>{inline(block)}</p>;
    });
}
