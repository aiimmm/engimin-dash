// ============================================================================
// LIB / AUTH — /login (Server-Only Session Management)
// Purpose: Encrypted cookie session management using AES-256-GCM
// Description: Handles session creation, decryption, reading and destruction
// ============================================================================

import "server-only";

import { getSessionSecret } from "@/lib/config";
import { cookies } from "next/headers";
import { connection } from "next/server";
import crypto from "node:crypto";

export const SESSION_COOKIE = "wo_session";
export const SESSION_MAX_AGE = 60 * 60 * 8;

function encryptionKey() {
  return crypto.createHash("sha256").update(getSessionSecret()).digest();
}

export function encryptSession(payload) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const body = Buffer.from(JSON.stringify(payload));
  const encrypted = Buffer.concat([cipher.update(body), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptSession(value, nowTime) {
  try {
    const data = Buffer.from(value, "base64url");
    const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), data.subarray(0, 12));
    decipher.setAuthTag(data.subarray(12, 28));
    const decrypted = Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]);
    const session = JSON.parse(decrypted.toString("utf8"));
    const currentTime = typeof nowTime === "number" ? nowTime : Date.now();
    return session.expiresAt > currentTime ? session : null;
  } catch {
    return null;
  }
}

export async function getSession() {
  await connection();
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;
  if (!value) return null;
  return decryptSession(value, Date.now());
}

export function sessionCookie(value) {
  return {
    name: SESSION_COOKIE,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}
