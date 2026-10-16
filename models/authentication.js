import user from "models/user.js";
import password from "models/password.js";
import session from "models/session.js";
import {
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from "infra/errors.js";

async function authenticate(providedEmail, providedPassword) {
  try {
    const storedUser = await findUserByEmail(providedEmail);
    await validatePassword(providedPassword, storedUser.password);

    return storedUser;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "Invalid email or password.",
        action: "Check your credentials and try again.",
      });
    }

    throw error;
  }

  async function findUserByEmail(providedEmail) {
    let storedUser;

    try {
      storedUser = await user.findOneByEmail(providedEmail);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: "Invalid email.",
          action: "Check your credentials and try again.",
        });
      }

      throw error;
    }

    return storedUser;
  }

  async function validatePassword(providedPassword, storedPassword) {
    const correctPasswordMatch = await password.compare(
      providedPassword,
      storedPassword,
    );

    if (!correctPasswordMatch) {
      throw new UnauthorizedError({
        message: "Invalid password.",
        action: "Check your credentials and try again.",
      });
    }
  }
}

async function authenticateSession(token) {
  const storedSession = await session.findOneValidByToken(token);

  try {
    return await user.findOneById(storedSession.user_id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new UnauthorizedError();
    }

    throw error;
  }
}

async function authenticateAdministrator(token) {
  const authenticatedUser = await authenticateSession(token);
  if (!authenticatedUser.is_admin) {
    throw new ForbiddenError();
  }
  return authenticatedUser;
}

const authentication = {
  authenticateAdministrator,
  authenticate,
  authenticateSession,
};

export default authentication;
