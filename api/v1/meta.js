import { sendJson, sendError } from "../_lib/http.js";

export default async function handler(_req, res) {
  try {
    sendJson(res, 200, {
      service: "habit-tracker",
      version: "1.0.0",
      protocol: "ywaip",
      protocolVersion: "1.0",
      description: "Track daily habits like waking up early. Supports check-ins, streaks, and statistics.",
      capabilities: [
        "habit-checkin",
        "habit-query",
        "habit-stats",
        "streak-tracking",
        "monthly-statistics"
      ],
      scopes: ["habit:read", "habit:write", "habit:delete"]
    });
  } catch (err) {
    sendError(res, err);
  }
}
