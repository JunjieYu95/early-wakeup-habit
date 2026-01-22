import { createClient } from "@libsql/client";
import { getEnv } from "./env.js";

let cached = null;

export function getDb() {
  if (cached) return cached;
  const env = getEnv();
  try {
    // Remove any quotes or whitespace from the URL
    const url = env.TURSO_DATABASE_URL.trim().replace(/^["']|["']$/g, '');
    const authToken = env.TURSO_AUTH_TOKEN.trim().replace(/^["']|["']$/g, '');
    
    if (!url || !url.startsWith('libsql://')) {
      throw new Error(`Invalid database URL format. Expected libsql:// URL, got: ${url ? url.substring(0, 20) + '...' : 'empty'}`);
    }
    
    cached = createClient({ url, authToken });
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
