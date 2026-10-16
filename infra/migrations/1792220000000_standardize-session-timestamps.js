export const up = (pgm) => {
  for (const column of ["created_at", "updated_at"]) {
    pgm.alterColumn("sessions", column, {
      default: pgm.func("timezone('utc', now())"),
    });
  }
};

export const down = (pgm) => {
  for (const column of ["created_at", "updated_at"]) {
    pgm.alterColumn("sessions", column, { default: pgm.func("now()") });
  }
};
