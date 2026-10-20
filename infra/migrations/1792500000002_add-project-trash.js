export const up = (pgm) => {
  for (const table of ["works", "work_parts", "chapters"])
    pgm.addColumn(table, { deleted_at: { type: "timestamptz" } });
};
exports.down = false;
