export const up = (pgm) => {
  pgm.addColumn("users", {
    is_admin: { type: "boolean", notNull: true, default: false },
  });
};

export const down = (pgm) => {
  pgm.dropColumn("users", "is_admin");
};
