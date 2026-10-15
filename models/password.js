import bcryptjs from "bcryptjs";
import { createHmac } from "node:crypto";
import { InternalServerError } from "infra/errors";

function applyPepper(password) {
  const pepper = process.env.PASSWORD_PEPPER;

  if (!pepper) {
    throw new InternalServerError({
      cause: "PASSWORD_PEPPER is not defined.",
    });
  }

  return createHmac("sha384", pepper).update(password).digest("base64");
}

async function hash(password) {
  const pepperedPassword = applyPepper(password);
  const rounds = process.env.NODE_ENV === "production" ? 14 : 4;
  const salt = await bcryptjs.genSalt(rounds);

  return await bcryptjs.hash(pepperedPassword, salt);
}

async function compare(password, storedHash) {
  const pepperedPassword = applyPepper(password);

  return await bcryptjs.compare(pepperedPassword, storedHash);
}

const password = {
  hash,
  compare,
};

export default password;
