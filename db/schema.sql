-- Early Wakeup Habit Tracker schema (Turso / libSQL)

CREATE TABLE IF NOT EXISTS wakeup_records (
  date TEXT PRIMARY KEY,           -- YYYY-MM-DD
  checked INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  image_public_id TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_wakeup_records_checked ON wakeup_records(checked);
