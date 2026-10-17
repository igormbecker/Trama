export function focusStructureForm(panel, editingDescription) {
  panel.scrollIntoView({ block: "start", behavior: "instant" });
  const field = panel.querySelector(
    editingDescription ? '[name="description"]' : '[name="title"]',
  );
  field?.focus({ preventScroll: true });
}

export function focusSavedChapter(notice) {
  notice.scrollIntoView({ block: "start", behavior: "instant" });
  notice.focus({ preventScroll: true });
}

export function savedStructureEntry(form) {
  return form?.entry.id
    ? { id: form.entry.id, type: form.partId ? "chapter" : "part" }
    : null;
}
