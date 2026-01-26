import { getDb, isoNow } from "../_lib/db.js";
import { onlyMethods, parseJsonBody, sendJson, sendError } from "../_lib/http.js";
import { DateKey } from "../_lib/validation.js";

const ACTIONS = {
  CHECKIN: "habit.checkin",
  QUERY: "habit.query",
  STATS: "habit.stats",
  DELETE: "habit.delete"
};

const ACTION_SCOPES = {
  [ACTIONS.CHECKIN]: ["habit:write"],
  [ACTIONS.QUERY]: ["habit:read"],
  [ACTIONS.STATS]: ["habit:read"],
  [ACTIONS.DELETE]: ["habit:delete"]
};

function getNowWithOffset(utcOffsetMinutes) {
  if (Number.isFinite(utcOffsetMinutes)) {
    return new Date(Date.now() + utcOffsetMinutes * 60 * 1000);
  }
  return new Date();
}

function getTodayDate(utcOffsetMinutes) {
  return getNowWithOffset(utcOffsetMinutes).toISOString().split("T")[0];
}

function getDateDaysAgo(days, utcOffsetMinutes) {
  const date = getNowWithOffset(utcOffsetMinutes);
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}

function getCurrentMonth(utcOffsetMinutes) {
  return getNowWithOffset(utcOffsetMinutes).toISOString().slice(0, 7);
}

function parseScopes(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.flatMap((v) => String(v).split(","));
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function requireScope(scopes, required) {
  if (scopes.includes("admin")) return true;
  return required.every((scope) => scopes.includes(scope));
}

async function fetchRecords(db, from, to) {
  const rs = await db.execute({
    sql: `SELECT date, checked, image_url as imageUrl, image_public_id as imagePublicId, note, utc_offset_minutes as utcOffsetMinutes, created_at as createdAt, updated_at as updatedAt
          FROM wakeup_records
          WHERE date >= ? AND date <= ?
          ORDER BY date ASC`,
    args: [from, to]
  });
  return rs.rows || [];
}

async function fetchRecord(db, date) {
  const rs = await db.execute({
    sql: `SELECT date, checked, image_url as imageUrl, image_public_id as imagePublicId, note, utc_offset_minutes as utcOffsetMinutes, created_at as createdAt, updated_at as updatedAt
          FROM wakeup_records WHERE date = ? LIMIT 1`,
    args: [date]
  });
  return rs.rows?.[0] || null;
}

async function createOrUpdateRecord(db, date, checked, note, utcOffsetMinutes) {
  await db.execute({
    sql: `INSERT INTO wakeup_records (date, checked, image_url, image_public_id, note, utc_offset_minutes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(date) DO UPDATE SET
            checked=excluded.checked,
            image_url=excluded.image_url,
            image_public_id=excluded.image_public_id,
            note=excluded.note,
            utc_offset_minutes=excluded.utc_offset_minutes,
            updated_at=excluded.updated_at`,
    args: [
      date,
      checked ? 1 : 0,
      null,
      null,
      note ?? null,
      utcOffsetMinutes ?? null,
      isoNow(),
      isoNow()
    ]
  });
}

async function deleteRecord(db, date) {
  await db.execute({ sql: `DELETE FROM wakeup_records WHERE date = ?`, args: [date] });
}

function validateDate(value) {
  const parsed = DateKey.safeParse(value);
  if (!parsed.success) {
    const err = new Error("date must be YYYY-MM-DD");
    err.statusCode = 400;
    throw err;
  }
  return parsed.data;
}

async function handleCheckin(db, params, userId, utcOffsetMinutes) {
  const date = params.date ? validateDate(params.date) : getTodayDate(utcOffsetMinutes);
  const checked = params.checked !== false;
  const note = params.note;
  const wakeTime = params.wakeTime;

  const fullNote = wakeTime
    ? (note ? `${note} (Woke up at ${wakeTime})` : `Woke up at ${wakeTime}`)
    : note;

  await createOrUpdateRecord(db, date, checked, fullNote, utcOffsetMinutes);

  return {
    success: true,
    result: {
      message: checked
        ? `Check-in recorded for ${date}. Great job!`
        : `Marked as not completed for ${date}.`,
      record: {
        date,
        checked,
        note: fullNote || undefined,
        wakeTime,
        utcOffsetMinutes: utcOffsetMinutes ?? undefined
      },
      userId
    }
  };
}

async function handleQuery(db, params, utcOffsetMinutes) {
  if (params.date) {
    const date = validateDate(params.date);
    const record = await fetchRecord(db, date);
    return {
      success: true,
      result: {
        date,
        found: !!record,
        record: record
          ? {
              date: record.date,
              checked: record.checked === 1,
              note: record.note || undefined,
              utcOffsetMinutes: record.utcOffsetMinutes ?? undefined
            }
          : null
      }
    };
  }

  const from = params.from ? validateDate(params.from) : getDateDaysAgo(7, utcOffsetMinutes);
  const to = params.to ? validateDate(params.to) : getTodayDate(utcOffsetMinutes);

  const externalRecords = await fetchRecords(db, from, to);
  const records = externalRecords.map((r) => ({
    date: r.date,
    checked: r.checked === 1,
    note: r.note || undefined,
    utcOffsetMinutes: r.utcOffsetMinutes ?? undefined
  }));

  return {
    success: true,
    result: {
      from,
      to,
      count: records.length,
      records
    }
  };
}

async function handleStats(db, params, utcOffsetMinutes) {
  const month = params.month || getCurrentMonth(utcOffsetMinutes);
  const includeStreak = params.includeStreak !== false;

  const monthStart = `${month}-01`;
  const monthEnd = `${month}-31`;
  const fromDate = includeStreak ? getDateDaysAgo(60, utcOffsetMinutes) : monthStart;
  const toDate = includeStreak ? getTodayDate(utcOffsetMinutes) : monthEnd;

  const externalRecords = await fetchRecords(db, fromDate, toDate);
  const allRecords = externalRecords
    .map((r) => ({
      date: r.date,
      checked: r.checked === 1
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const monthRecords = allRecords.filter((r) => r.date.startsWith(month));
  const completedDays = monthRecords.filter((r) => r.checked).length;
  const totalDays = monthRecords.length;

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  if (includeStreak) {
    const sortedRecords = [...allRecords].sort((a, b) => b.date.localeCompare(a.date));
    let expectedDate = getTodayDate(utcOffsetMinutes);

    for (const record of sortedRecords) {
      if (record.date === expectedDate && record.checked) {
        currentStreak++;
        const prevDate = new Date(expectedDate);
        prevDate.setDate(prevDate.getDate() - 1);
        expectedDate = prevDate.toISOString().split("T")[0];
      } else if (record.date < expectedDate) {
        break;
      }
    }

    for (const record of allRecords) {
      if (record.checked) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }
  }

  const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  return {
    success: true,
    result: {
      month,
      stats: {
        completedDays,
        totalDays,
        completionRate: `${completionRate}%`,
        ...(includeStreak ? { currentStreak, longestStreak } : {})
      },
      summary:
        currentStreak > 0
          ? `You're on a ${currentStreak}-day streak! This month: ${completedDays}/${totalDays} days (${completionRate}%).`
          : `This month: ${completedDays}/${totalDays} days (${completionRate}%). Start your streak today!`
    }
  };
}

async function handleDelete(db, params) {
  const date = params.date ? validateDate(params.date) : null;
  if (!date) {
    return {
      success: false,
      error: { code: "MISSING_PARAM", message: "date parameter is required" }
    };
  }

  const record = await fetchRecord(db, date);
  if (!record) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: `No record found for ${date}` }
    };
  }

  await deleteRecord(db, date);
  return {
    success: true,
    result: { message: `Record for ${date} has been deleted.`, date }
  };
}

export default async function handler(req, res) {
  try {
    const m = onlyMethods(req, ["POST"]);
    if (m) throw m;

    const body = await parseJsonBody(req);

    if (!body?.action || typeof body.action !== "string") {
      sendJson(res, 400, {
        success: false,
        error: { code: "BAD_REQUEST", message: "action is required" }
      });
      return;
    }

    const userId = req.headers["x-yukie-user-id"] || body?.context?.userId;
    const scopes = parseScopes(req.headers["x-yukie-scopes"] || body?.context?.scopes);
    const headerOffset = req.headers["x-yukie-utc-offset-minutes"];
    const headerOffsetValue = Array.isArray(headerOffset) ? headerOffset[0] : headerOffset;
    const offsetCandidate = [
      body?.params?.utcOffsetMinutes,
      body?.context?.utcOffsetMinutes,
      headerOffsetValue !== undefined ? Number(headerOffsetValue) : undefined
    ].find((value) => Number.isFinite(value));
    const utcOffsetMinutes = Number.isFinite(offsetCandidate) ? Number(offsetCandidate) : undefined;

    if (!userId) {
      sendJson(res, 401, {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Missing X-Yukie-User-Id" }
      });
      return;
    }

    const requiredScopes = ACTION_SCOPES[body.action] || [];
    if (requiredScopes.length > 0 && !requireScope(scopes, requiredScopes)) {
      sendJson(res, 403, {
        success: false,
        error: { code: "FORBIDDEN", message: "Missing required scopes" }
      });
      return;
    }

    const db = getDb();
    const params = body.params || {};

    let result;
    switch (body.action) {
      case ACTIONS.CHECKIN:
        result = await handleCheckin(db, params, userId, utcOffsetMinutes);
        break;
      case ACTIONS.QUERY:
        result = await handleQuery(db, params, utcOffsetMinutes);
        break;
      case ACTIONS.STATS:
        result = await handleStats(db, params, utcOffsetMinutes);
        break;
      case ACTIONS.DELETE:
        result = await handleDelete(db, params);
        break;
      default:
        sendJson(res, 400, {
          success: false,
          error: { code: "UNKNOWN_ACTION", message: `Unknown action: ${body.action}` }
        });
        return;
    }

    sendJson(res, 200, result);
  } catch (err) {
    sendError(res, err);
  }
}
