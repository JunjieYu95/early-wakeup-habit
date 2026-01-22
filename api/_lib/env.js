import { z } from "zod";
import dotenv from "dotenv";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

// Load .env.local file from project root (for local development)
// Vercel dev should load it automatically, but we load it here as a fallback
// Calculate project root: api/_lib/env.js -> api -> project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "../..");

// Try loading .env.local from project root
const envLocalPath = join(projectRoot, ".env.local");
if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  // Fallback: try from current working directory
  dotenv.config({ path: ".env.local" });
}

const EnvSchema = z.object({
  TURSO_DATABASE_URL: z.string().min(1),
  TURSO_AUTH_TOKEN: z.string().min(1),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  CLOUDINARY_FOLDER: z.string().optional()
});

// Clean environment variable - remove quotes, whitespace, and line endings
function cleanEnvValue(value) {
  if (!value) return value;
  return value.trim().replace(/^["']|["']$/g, '').replace(/[\r\n]+/g, '').trim();
}

export function getEnv() {
  // Clean all environment variables before validation
  const cleanedEnv = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('TURSO_') || key.startsWith('CLOUDINARY_')) {
      cleanedEnv[key] = cleanEnvValue(value);
    } else {
      cleanedEnv[key] = value;
    }
  }
  
  const parsed = EnvSchema.safeParse(cleanedEnv);
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
    const err = new Error(`Invalid environment configuration: ${msg}`);
    err.statusCode = 500;
    throw err;
  }
  return parsed.data;
}
