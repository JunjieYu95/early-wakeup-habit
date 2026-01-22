import { getDb, isoNow } from "../_lib/db.js";
import { onlyMethods, parseJsonBody, sendJson, sendError } from "../_lib/http.js";
import { RecordUpsertSchema, RangeQuerySchema } from "../_lib/validation.js";

function parseQuery(url) {
  const u = new URL(url, "http://localhost");
  const obj = {};
  for (const [k, v] of u.searchParams.entries()) obj[k] = v;
  return obj;
}

export default async function handler(req, res) {
  try {
    const m = onlyMethods(req, ["GET", "POST"]);
    if (m) throw m;

    const db = getDb();

    if (req.method === "GET") {
      const q = RangeQuerySchema.parse(parseQuery(req.url));
      const from = q.from || "0000-01-01";
      const to = q.to || "9999-12-31";

      const rs = await db.execute({
        sql: `SELECT date, checked, image_url as imageUrl, image_public_id as imagePublicId, note, created_at as createdAt, updated_at as updatedAt
              FROM wakeup_records
              WHERE date >= ? AND date <= ?
              ORDER BY date ASC`,
        args: [from, to]
      });

      sendJson(res, 200, { records: rs.rows });
      return;
    }

    // POST create/upsert
    const body = await parseJsonBody(req);
    const parsed = RecordUpsertSchema.parse(body);

    await db.execute({
      sql: `INSERT INTO wakeup_records (date, checked, image_url, image_public_id, note, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(date) DO UPDATE SET
              checked=excluded.checked,
              image_url=excluded.image_url,
              image_public_id=excluded.image_public_id,
              note=excluded.note,
              updated_at=excluded.updated_at`,
      args: [
        parsed.date,
        parsed.checked ? 1 : 0,
        parsed.imageUrl ?? null,
        parsed.imagePublicId ?? null,
        parsed.note ?? null,
        isoNow(),
        isoNow()
      ]
    });

    sendJson(res, 200, { ok: true, date: parsed.date });
  } catch (err) {
    sendError(res, err);
  }
}
