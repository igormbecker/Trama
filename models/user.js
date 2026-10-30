import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors";
import password from "models/password.js";

async function findOneById(id) {
  const results = await database.query({
    text: `
      SELECT
        *
      FROM
        users
      WHERE
        id = $1
      LIMIT
        1;
    `,
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
          1;
      `,
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
          1;
      `,
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
          users (
            name,
            username,
            email,
            password
          )
        VALUES
          ($1, $2, $3, $4)
        RETURNING
          *;
      `,
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

export function validateRegistrationInput(input) {
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

function validatePasswordConfirmation(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ValidationError({ message: "Invalid registration data." });
  }
  const { password_confirmation, ...values } = input;
  if ("password" in input || "password_confirmation" in input) {
    if (
      typeof values.password !== "string" ||
      typeof password_confirmation !== "string" ||
      values.password !== password_confirmation
    ) {
      throw new ValidationError({
        message: "Password confirmation does not match.",
        action: "Enter the same new password in both fields.",
      });
    }
    if (values.password === "") {
      delete values.password;
    }
  }
  return values;
}

async function updateOwnAccount(currentUser, input) {
  return await update(currentUser.username, input, {
    requirePasswordConfirmation: true,
  });
}

async function update(
  username,
  userInputValues,
  { allowRoleChange = false, requirePasswordConfirmation = false } = {},
) {
  const currentUser = await findOneByUsername(username);
  if (requirePasswordConfirmation) {
    const values = validatePasswordConfirmation(userInputValues);
    const hasPasswordFields =
      "password" in userInputValues ||
      "password_confirmation" in userInputValues;
    if (hasPasswordFields && Object.keys(values).length === 0) {
      return currentUser;
    }
    userInputValues = values;
  }
  const allowedFields = ["name", "username", "email", "password"];
  if (allowRoleChange) {
    allowedFields.push("is_admin");
  }
  if (
    !userInputValues ||
    typeof userInputValues !== "object" ||
    Array.isArray(userInputValues) ||
    Object.keys(userInputValues).length === 0 ||
    Object.keys(userInputValues).some((key) => !allowedFields.includes(key))
  ) {
    throw new ValidationError({ message: "Invalid registration data." });
  }
  if (
    "is_admin" in userInputValues &&
    typeof userInputValues.is_admin !== "boolean"
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
    Object.keys(userInputValues).map((key) => [
      key,
      key === "is_admin" ? userInputValues.is_admin : validatedValues[key],
    ]),
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
  if (!("is_admin" in userInputValues)) {
    return await runUpdateQuery(userWithNewValues);
  }

  let client;
  try {
    client = await database.getNewClient();
    await client.query("BEGIN");
    await client.query("LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE");
    if (!userInputValues.is_admin) {
      await requireAnotherAdministrator(client, currentUser.id);
    }
    const updatedUser = await runUpdateQuery(userWithNewValues, client);
    await client.query("COMMIT");
    return updatedUser;
  } catch (error) {
    await client?.query("ROLLBACK");
    throw error;
  } finally {
    await client?.end();
  }

  async function runUpdateQuery(userWithNewValues, executor = database) {
    const results = await executor.query({
      text: `
        UPDATE
          users
        SET
          name = $2,
          username = $3,
          email = $4,
          password = $5,
          is_admin = COALESCE($6::boolean, is_admin),
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
        "is_admin" in userInputValues ? userInputValues.is_admin : null,
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
        LOWER(username) = LOWER($1)
        AND ($2::uuid IS NULL
            OR id <> $2);
    `,
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
        LOWER(email) = LOWER($1)
        AND ($2::uuid IS NULL
            OR id <> $2);
    `,
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
    `
      SELECT
        id,
        name,
        username,
        email,
        is_admin,
        created_at,
        updated_at
      FROM
        users
      ORDER BY
        LOWER(name),
        id;
    `,
  );
  return result.rows.map(toPublic);
}

async function requireAnotherAdministrator(client, userId) {
  const target = await client.query({
    text: `
      SELECT
        is_admin
      FROM
        users
      WHERE
        id = $1
    `,
    values: [userId],
  });
  if (target.rows[0]?.is_admin) {
    const result = await client.query(
      `
        SELECT
          count(*)::int AS count
        FROM
          users
        WHERE
          is_admin = true
      `,
    );
    if (result.rows[0].count <= 1) {
      throw new ValidationError({
        message: "At least one administrator must remain.",
        action: "Promote another account before changing this administrator.",
      });
    }
  }
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
    await client.query("LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE");
    await requireAnotherAdministrator(client, target.id);
    await client.query({
      text: `
        SELECT
          id
        FROM
          users
        WHERE
          id = $1
        FOR UPDATE
      `,
      values: [target.id],
    });
    const ownedWorks = await client.query({
      text: `
        SELECT
          id
        FROM
          works
        WHERE
          owner_id = $1
        LIMIT
          1
      `,
      values: [target.id],
    });
    if (ownedWorks.rowCount > 0) {
      throw new ValidationError({
        message:
          "Transfer responsibility for your works before deleting this account.",
        action: "This account must remain while it is responsible for works.",
      });
    }
    await client.query({
      text: `
        DELETE FROM
          sessions
        WHERE
          user_id = $1;
      `,
      values: [target.id],
    });
    await client.query({
      text: `
        DELETE FROM
          users
        WHERE
          id = $1;
      `,
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
  updateOwnAccount,
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
