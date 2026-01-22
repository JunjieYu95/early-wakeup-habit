import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in environment.");
  process.exit(1);
}

const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
const schema = fs.readFileSync(schemaPath, "utf-8");

const client = createClient({ url, authToken });

async function main() {
  // Split on semicolons that end statements (simple split; schema is straightforward)
  const statements = schema
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    await client.execute(stmt);
    console.log("Executed:", stmt.split(/\s+/).slice(0, 6).join(" "), "...");
  }

  console.log("Done.");
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
