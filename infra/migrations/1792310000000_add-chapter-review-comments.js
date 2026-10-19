export const up = (pgm) => {
  pgm.addColumns("chapter_requests", {
    review_document: { type: "jsonb" },
    review_comments: { type: "jsonb", notNull: true, default: "[]" },
    review_verdict: {
      type: "varchar(20)",
      check: "review_verdict IN ('approved', 'changes_requested')",
    },
  });
  // Preserve existing review copies as frozen references; never rewrite chapter text.
  pgm.sql(
    "UPDATE chapter_requests SET review_document = COALESCE(submitted_document, working_document), lease_token = NULL, lease_expires_at = NULL WHERE kind = 'review'",
  );
};
exports.down = false;
