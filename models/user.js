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
  const allowedFields = ["name", "username", "email", "password"];
  if (
    !userInputValues ||
    typeof userInputValues !== "object" ||
    Array.isArray(userInputValues) ||
    Object.keys(userInputValues).length === 0 ||
    Object.keys(userInputValues).some((key) => !allowedFields.includes(key))
  ) {
    throw new ValidationError({ message: "Invalid registration data." });
  }
  const validatedValues = validateRegistrationInput({
    ...currentUser,
    ...userInputValues,
    password:
      "password" in userInputValues
        ? userInputValues.password
        : "unchanged-password",
  });
  userInputValues = Object.fromEntries(
    Object.keys(userInputValues).map((key) => [key, validatedValues[key]]),
  );

  if ("username" in userInputValues) {
    await validateUniqueUsername(userInputValues.username, currentUser.id);
  }

  if ("email" in userInputValues) {
    await validateUniqueEmail(userInputValues.email, currentUser.id);
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

async function validateUniqueUsername(username, excludedId = null) {
  const results = await database.query({
    text: `
    SELECT
      username 
    FROM 
      users
    WHERE
      LOWER(username) = LOWER($1) AND ($2::uuid IS NULL OR id <> $2)
    ;`,
    values: [username, excludedId],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "The informed username is already in use.",
      action: "Use another username.",
    });
  }
}

async function validateUniqueEmail(email, excludedId = null) {
  const results = await database.query({
    text: `
    SELECT
      email 
    FROM 
      users
    WHERE
      LOWER(email) = LOWER($1) AND ($2::uuid IS NULL OR id <> $2)
    ;`,
    values: [email, excludedId],
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

function toPublic(storedUser) {
  return {
    id: storedUser.id,
    name: storedUser.name,
    username: storedUser.username,
    email: storedUser.email,
    is_admin: storedUser.is_admin,
    created_at: storedUser.created_at.toISOString(),
    updated_at: storedUser.updated_at.toISOString(),
  };
}

async function findAll() {
  const result = await database.query(
    "SELECT id, name, username, email, is_admin, created_at, updated_at FROM users ORDER BY LOWER(name), id;",
  );
  return result.rows.map(toPublic);
}

async function remove(username, administratorId) {
  const target = await findOneByUsername(username);
  if (target.id === administratorId) {
    throw new ValidationError({
      message: "You cannot delete your own account.",
      action: "Ask another administrator to manage this account.",
    });
  }
  let client;
  try {
    client = await database.getNewClient();
    await client.query("BEGIN");
    await client.query({
      text: "DELETE FROM sessions WHERE user_id = $1;",
      values: [target.id],
    });
    await client.query({
      text: "DELETE FROM users WHERE id = $1;",
      values: [target.id],
    });
    await client.query("COMMIT");
  } catch (error) {
    await client?.query("ROLLBACK");
    throw error;
  } finally {
    await client?.end();
  }
}

const user = {
  toPublic,
  findAll,
  remove,
  create,
  findOneById,
  findOneByUsername,
  update,
  findOneByEmail,
};

export default user;
