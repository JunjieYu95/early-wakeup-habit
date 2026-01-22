import { createClient } from "@libsql/client";
import { getEnv } from "./env.js";

let cached = null;

export function getDb() {
  if (cached) return cached;
  const env = getEnv();
  cached = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });
  return cached;
}

export function isoNow() {
  return new Date().toISOString();
}
