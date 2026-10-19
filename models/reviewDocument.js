// Offsets count UTF-16 text characters, matching DOM Range and String.slice.
export function reviewText(document) {
  if (document.type === "text") return document.text || "";
  return (document.content || []).map(reviewText).join("");
}
