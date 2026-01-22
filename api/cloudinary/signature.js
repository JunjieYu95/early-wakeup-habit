import crypto from "node:crypto";
import { getEnv } from "../_lib/env.js";
import { onlyMethods, sendJson, sendError } from "../_lib/http.js";

export default async function handler(req, res) {
  try {
    const m = onlyMethods(req, ["POST"]);
    if (m) throw m;

    const env = getEnv();
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = (env.CLOUDINARY_FOLDER || "early-wakeup").trim();

    // Cloudinary signature: sign the string of params in alphabetical order.
    // We sign only what we require client to send (timestamp + folder).
    const toSign = `folder=${folder}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash("sha1").update(toSign).digest("hex");

    sendJson(res, 200, {
      timestamp,
      signature,
      apiKey: env.CLOUDINARY_API_KEY,
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      folder
    });
  } catch (err) {
    sendError(res, err);
  }
}
