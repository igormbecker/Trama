export const up = (pgm) => {
  pgm.addColumn("works", {
    type: { type: "text", notNull: true, default: "literary" },
  });
  pgm.addConstraint("works", "works_type_check", {
    check: "type IN ('literary', 'group_assignment')",
  });
};
exports.down = false;
