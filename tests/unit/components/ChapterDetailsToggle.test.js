import { renderToStaticMarkup } from "react-dom/server";
import ChapterDetailsToggle from "components/works/ChapterDetailsToggle";

test.each([true, false])(
  "Exposes the chapter details visibility (%s)",
  (open) => {
    const html = renderToStaticMarkup(
      <ChapterDetailsToggle open={open} onToggle={() => {}} />,
    );
    expect(html).toContain(`aria-expanded="${open}"`);
    expect(html).toContain(
      'aria-controls="chapter-heading chapter-editorial-details"',
    );
    expect(html).toContain(
      open ? "Ocultar detalhes do capítulo" : "Mostrar detalhes do capítulo",
    );
  },
);

test("Invokes the visibility action when clicked", () => {
  const onToggle = jest.fn();
  ChapterDetailsToggle({ open: true, onToggle }).props.onClick();
  expect(onToggle).toHaveBeenCalledTimes(1);
});
