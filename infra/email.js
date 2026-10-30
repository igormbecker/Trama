import nodemailer from "nodemailer";
import { Resend } from "resend";
import { ServiceError, ValidationError } from "infra/errors.js";

const addressPattern =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/;

function deliveryError() {
  // Provider errors may contain recipients, message bodies or credentials.
  return new ServiceError({ message: "Email delivery failed." });
}

function validateMessage(message) {
  const allowedFields = ["to", "subject", "html", "text", "idempotencyKey"];
  if (
    !message ||
    typeof message !== "object" ||
    Object.keys(message).some((key) => !allowedFields.includes(key)) ||
    typeof message.to !== "string" ||
    !addressPattern.test(message.to) ||
    ![message.subject, message.html, message.text].every(
      (value) => typeof value === "string" && value.trim().length > 0,
    ) ||
    /[\r\n]/.test(message.subject) ||
    (message.idempotencyKey !== undefined &&
      (typeof message.idempotencyKey !== "string" ||
        !/^[A-Za-z0-9/_:-]{1,256}$/.test(message.idempotencyKey)))
  ) {
    throw new ValidationError({ message: "Invalid email message." });
  }
}

function getDeliveryEnvironment() {
  if (process.env.TRAMA_TEST_SERVER === "true") {
    return "test";
  }
  if (["development", "test"].includes(process.env.NODE_ENV)) {
    return process.env.NODE_ENV;
  }
  if (["production", "preview"].includes(process.env.VERCEL_ENV)) {
    return process.env.VERCEL_ENV;
  }
  throw deliveryError();
}

async function send(message) {
  validateMessage(message);
  const environment = getDeliveryEnvironment();
  const isLocal = ["test", "development"].includes(environment);
  const from = isLocal
    ? "Trama <notificacoes@trama.local>"
    : process.env.EMAIL_FROM;

  if (!isLocal) {
    if (!process.env.RESEND_API_KEY || !from || /[\r\n]/.test(from)) {
      throw deliveryError();
    }
    if (environment === "preview") {
      const recipients = (process.env.EMAIL_PREVIEW_RECIPIENTS || "")
        .split(",")
        .map((address) => address.trim().toLowerCase());
      if (!recipients.includes(message.to.toLowerCase())) {
        throw deliveryError();
      }
    }
  }

  const mail = {
    from,
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
  };

  try {
    if (isLocal) {
      const transporter = nodemailer.createTransport({
        host: "127.0.0.1",
        port: environment === "test" ? 1027 : 1026,
        secure: false,
        ignoreTLS: true,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
        disableFileAccess: true,
        disableUrlAccess: true,
      });
      const result = await transporter.sendMail(mail);
      return { id: result.messageId };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send(mail, {
      idempotencyKey: message.idempotencyKey,
      signal: AbortSignal.timeout(10000),
    });
    if (result.error || !result.data?.id) {
      throw deliveryError();
    }
    return { id: result.data.id };
  } catch {
    throw deliveryError();
  }
}

const email = { send };
export default email;
