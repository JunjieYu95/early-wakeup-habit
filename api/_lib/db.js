import { createClient } from "@libsql/client";
import { getEnv } from "./env.js";

let cached = null;

export function getDb() {
  if (cached) return cached;
  const env = getEnv();
  try {
    cached = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });
    return cached;
  } catch (err) {
    const error = new Error(`Database connection failed: ${err.message}`);
    error.statusCode = 500;
    throw error;
  }
}

export function isoNow() {
  return new Date().toISOString();
}
