import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "work_logger_session";

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  return secret;
}

export function expectedSessionToken() {
  return createHmac("sha256", sessionSecret())
    .update("work-logger-authenticated")
    .digest("hex");
}

export function isValidSession(value?: string | null) {
  if (!value) return false;
  const expected = expectedSessionToken();
  const receivedBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function pinMatches(value: string) {
  const expected = process.env.WORK_LOGGER_PIN;
  if (!expected) throw new Error("WORK_LOGGER_PIN is not configured");
  const receivedBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer);
}
