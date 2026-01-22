import { sendJson, sendError } from "./_lib/http.js";

export default async function handler(req, res) {
  try {
    // Simple health check - don't require env vars
    sendJson(res, 200, { 
      ok: true, 
      service: "early-wakeup-habit", 
      time: new Date().toISOString()
    });
  } catch (err) {
    sendError(res, err);
  }
}
