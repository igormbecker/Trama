import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors";
import password from "models/password.js";

async function findOneById(id) {
  const results = await database.query({
    text: "SELECT * FROM users WHERE id = $1 LIMIT 1;",
    values: [id],
  });

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "User not found.",
      action: "Please sign in again.",
    });
  }

  return results.rows[0];
}

async function findOneByUsername(username) {
  const userFound = await runSelectQuery(username);

  return userFound;

  async function runSelectQuery(username) {
    const results = await database.query({
      text: `
      SELECT
        * 
      FROM 
        users
      WHERE
        LOWER(username) = LOWER($1)
      LIMIT
        1
      ;`,
      values: [username],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "Username not found.",
        action:
          "Please check that the username was entered correctly and try again.",
      });
    }

    return results.rows[0];
  }
}

async function findOneByEmail(email) {
  const userFound = await runSelectQuery(email);

  return userFound;

  async function runSelectQuery(email) {
    const results = await database.query({
      text: `
      SELECT
        * 
      FROM 
        users
      WHERE
        LOWER(email) = LOWER($1)
      LIMIT
        1
      ;`,
      values: [email],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "Email not found.",
        action:
          "Please check that the email was entered correctly and try again.",
      });
    }

    return results.rows[0];
  }
}

async function create(userInputValues) {
  userInputValues = validateRegistrationInput(userInputValues);
  await validateUniqueUsername(userInputValues.username);
  await validateUniqueEmail(userInputValues.email);
  await hashPasswordInObject(userInputValues);

  const newUser = await runInsertQuery(userInputValues);
  return newUser;

  async function runInsertQuery(userInputValues) {
    const results = await database.query({
      text: `
      INSERT INTO 
        users (name, username, email, password) 
      VALUES 
        ($1, $2, $3, $4)
      RETURNING
        *
      ;`,
      values: [
        userInputValues.name,
        userInputValues.username,
        userInputValues.email,
        userInputValues.password,
      ],
    });

    return results.rows[0];
  }
}

function validateRegistrationInput(input) {
  const invalidInput = () =>
    new ValidationError({
      message: "Invalid registration data.",
      action:
        "Provide a name, a username, a valid email and a password with at least 8 characters.",
    });

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw invalidInput();
  }

  for (const field of ["name", "username", "email", "password"]) {
    if (typeof input[field] !== "string") {
      throw invalidInput();
    }
  }

  const values = {
    name: input.name.trim(),
    username: input.username.trim(),
    email: input.email.trim(),
    password: input.password,
  };

  if (
    values.name.length === 0 ||
    values.name.length > 255 ||
    !/^[a-zA-Z0-9_.-]{1,30}$/.test(values.username) ||
    values.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) ||
    values.password.length < 8 ||
    values.password.length > 128
  ) {
    throw invalidInput();
  }

  return values;
}

async function update(username, userInputValues) {
  const currentUser = await findOneByUsername(username);

  if ("username" in userInputValues) {
    await validateUniqueUsername(userInputValues.username);
  }

  if ("email" in userInputValues) {
    await validateUniqueEmail(userInputValues.email);
  }

  if ("password" in userInputValues) {
    await hashPasswordInObject(userInputValues);
  }

  const userWithNewValues = { ...currentUser, ...userInputValues };
  const updateUser = await runUpdateQuery(userWithNewValues);
  return updateUser;

  async function runUpdateQuery(userWithNewValues) {
    const results = await database.query({
      text: `
        UPDATE
          users
        SET
          name = $2,
          username = $3,
          email = $4,
          password = $5,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [
        userWithNewValues.id,
        userWithNewValues.name,
        userWithNewValues.username,
        userWithNewValues.email,
        userWithNewValues.password,
      ],
    });

    return results.rows[0];
  }
}

async function validateUniqueUsername(username) {
  const results = await database.query({
    text: `
    SELECT
      username 
    FROM 
      users
    WHERE
      LOWER(username) = LOWER($1)
    ;`,
    values: [username],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "The informed username is already in use.",
      action: "Use another username.",
    });
  }
}

async function validateUniqueEmail(email) {
  const results = await database.query({
    text: `
    SELECT
      email 
    FROM 
      users
    WHERE
      LOWER(email) = LOWER($1)
    ;`,
    values: [email],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "The informed e-mail is already in use.",
      action: "Use another email.",
    });
  }
}

async function hashPasswordInObject(userInputValues) {
  const hashedPassword = await password.hash(userInputValues.password);
  userInputValues.password = hashedPassword;
}

const user = {
  create,
  findOneById,
  findOneByUsername,
  update,
  findOneByEmail,
};

export default user;
