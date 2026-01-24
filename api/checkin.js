import { getDb, isoNow } from "./_lib/db.js";
import { onlyMethods, parseJsonBody, sendJson, sendError } from "./_lib/http.js";
import { CheckInBatchSchema, CheckInSchema } from "./_lib/validation.js";

export default async function handler(req, res) {
  try {
    const m = onlyMethods(req, ["POST"]);
    if (m) throw m;

    const db = getDb();
    const body = await parseJsonBody(req);
    
    // Determine if it's a batch request or single request
    const isBatch = body.checkins && Array.isArray(body.checkins);
    
    if (isBatch) {
      // Handle batch check-ins
      const parsed = CheckInBatchSchema.parse(body);
      const results = [];
      const errors = [];

      for (let i = 0; i < parsed.checkins.length; i++) {
        const checkin = parsed.checkins[i];
        try {
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
              checkin.date,
              checkin.checked ? 1 : 0,
              checkin.imageUrl ?? null,
              checkin.imagePublicId ?? null,
              checkin.note ?? null,
              isoNow(),
              isoNow()
            ]
          });

          results.push({ date: checkin.date, success: true });
        } catch (err) {
          errors.push({ 
            date: checkin.date, 
            error: err.message || "Failed to process check-in" 
          });
        }
      }

      sendJson(res, 200, {
        ok: true,
        processed: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined
      });
      return;
    } else {
      // Handle single check-in
      const parsed = CheckInSchema.parse(body);

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

      sendJson(res, 200, { 
        ok: true, 
        date: parsed.date,
        checked: parsed.checked,
        message: parsed.note
      });
      return;
    }
  } catch (err) {
    sendError(res, err);
  }
}
