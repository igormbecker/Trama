import {
  focusStructureForm,
  focusSavedChapter,
} from "components/works/focusStructureForm";
import { savedStructureEntry } from "components/works/focusStructureForm";

test("Identifies the saved part separately from a chapter", () => {
  expect(savedStructureEntry({ entry: { id: "part" } })).toEqual({
    id: "part",
    type: "part",
  });
  expect(
    savedStructureEntry({ partId: "part", entry: { id: "chapter" } }),
  ).toEqual({ id: "chapter", type: "chapter" });
  expect(savedStructureEntry({ entry: {} })).toBeNull();
});

test("Returns to the saved chapter confirmation without moving focus elsewhere", () => {
  const notice = { scrollIntoView: jest.fn(), focus: jest.fn() };
  focusSavedChapter(notice);
  expect(notice.scrollIntoView).toHaveBeenCalledWith({
    block: "start",
    behavior: "instant",
  });
  expect(notice.focus).toHaveBeenCalledWith({ preventScroll: true });
});

test("Reveals the form and focuses the description when editing a chapter", () => {
  const field = { focus: jest.fn() };
  const panel = {
    scrollIntoView: jest.fn(),
    querySelector: jest.fn().mockReturnValue(field),
  };
  focusStructureForm(panel, true);
  expect(panel.scrollIntoView).toHaveBeenCalledWith({
    block: "start",
    behavior: "instant",
  });
  expect(panel.querySelector).toHaveBeenCalledWith('[name="description"]');
  expect(field.focus).toHaveBeenCalledWith({ preventScroll: true });
});

test("Focuses the title for creation and part editing", () => {
  const field = { focus: jest.fn() };
  const panel = {
    scrollIntoView: jest.fn(),
    querySelector: jest.fn().mockReturnValue(field),
  };
  focusStructureForm(panel, false);
  expect(panel.querySelector).toHaveBeenCalledWith('[name="title"]');
  expect(field.focus).toHaveBeenCalledWith({ preventScroll: true });
});
