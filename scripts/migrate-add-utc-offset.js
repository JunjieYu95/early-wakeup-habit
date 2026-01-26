import { createClient } from "@libsql/client";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in environment.");
  process.exit(1);
}

const defaultOffsetMinutes = Number.isFinite(Number(process.env.DEFAULT_UTC_OFFSET_MINUTES))
  ? Number(process.env.DEFAULT_UTC_OFFSET_MINUTES)
  : -420; // Salt Lake City (UTC-7) default

const client = createClient({ url, authToken });

async function columnExists() {
  const rs = await client.execute({ sql: "PRAGMA table_info(wakeup_records)" });
  return (rs.rows || []).some((row) => row.name === "utc_offset_minutes");
}

async function addColumnIfMissing() {
  const exists = await columnExists();
  if (exists) {
    console.log("Column utc_offset_minutes already exists.");
    return;
  }
  await client.execute({
    sql: "ALTER TABLE wakeup_records ADD COLUMN utc_offset_minutes INTEGER",
  });
  console.log("Added column utc_offset_minutes.");
}

async function backfill() {
  const rs = await client.execute({
    sql: "UPDATE wakeup_records SET utc_offset_minutes = ? WHERE utc_offset_minutes IS NULL",
    args: [defaultOffsetMinutes],
  });
  console.log(`Backfilled utc_offset_minutes with ${defaultOffsetMinutes}. Rows updated: ${rs.rowsAffected ?? 'unknown'}`);
}

async function main() {
  await addColumnIfMissing();
  await backfill();
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
