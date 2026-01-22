import { getDb, isoNow } from "../_lib/db.js";
import { onlyMethods, parseJsonBody, sendJson, sendError } from "../_lib/http.js";
import { DateKey, RecordPatchSchema } from "../_lib/validation.js";

function getDateParam(req) {
  // Vercel provides req.query in some runtimes; but not guaranteed in Node serverless.
  // Parse from URL path: /api/records/:date
  const u = new URL(req.url, "http://localhost");
  const parts = u.pathname.split("/").filter(Boolean);
  const date = parts[parts.length - 1];
  return DateKey.parse(date);
}

export default async function handler(req, res) {
  try {
    const m = onlyMethods(req, ["GET", "PUT", "DELETE"]);
    if (m) throw m;

    const db = getDb();
    const date = getDateParam(req);

    if (req.method === "GET") {
      const rs = await db.execute({
        sql: `SELECT date, checked, image_url as imageUrl, image_public_id as imagePublicId, note, created_at as createdAt, updated_at as updatedAt
              FROM wakeup_records WHERE date = ? LIMIT 1`,
        args: [date]
      });
      const record = rs.rows?.[0] || null;
      sendJson(res, 200, { record });
      return;
    }

    if (req.method === "PUT") {
      const body = await parseJsonBody(req);
      const patch = RecordPatchSchema.parse(body);

      // ensure row exists; if not, create with defaults then patch
      await db.execute({
        sql: `INSERT INTO wakeup_records (date, checked, created_at, updated_at)
              VALUES (?, 0, ?, ?)
              ON CONFLICT(date) DO NOTHING`,
        args: [date, isoNow(), isoNow()]
      });

      // patch only provided fields
      const sets = [];
      const args = [];
      if (typeof patch.checked === "boolean") { sets.push("checked = ?"); args.push(patch.checked ? 1 : 0); }
      if ("imageUrl" in patch) { sets.push("image_url = ?"); args.push(patch.imageUrl ?? null); }
      if ("imagePublicId" in patch) { sets.push("image_public_id = ?"); args.push(patch.imagePublicId ?? null); }
      if ("note" in patch) { sets.push("note = ?"); args.push(patch.note ?? null); }

      sets.push("updated_at = ?");
      args.push(isoNow());

      await db.execute({
        sql: `UPDATE wakeup_records SET ${sets.join(", ")} WHERE date = ?`,
        args: [...args, date]
      });

      sendJson(res, 200, { ok: true, date });
      return;
    }

    // DELETE
    await db.execute({ sql: `DELETE FROM wakeup_records WHERE date = ?`, args: [date] });
    sendJson(res, 200, { ok: true, date });
  } catch (err) {
    sendError(res, err);
  }
}
