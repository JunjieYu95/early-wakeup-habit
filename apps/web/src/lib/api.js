import axios from "axios";

export const api = axios.create({
  baseURL: "",
  timeout: 10000 // 10 second timeout
});

export async function getRecords(from, to) {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const { data } = await api.get("/api/records", { params });
  return data.records || [];
}

export async function upsertRecord(payload) {
  const { data } = await api.post("/api/records", payload);
  return data;
}

export async function getRecord(date) {
  const { data } = await api.get(`/api/records/${date}`);
  return data.record;
}

export async function patchRecord(date, patch) {
  const { data } = await api.put(`/api/records/${date}`, patch);
  return data;
}

export async function deleteRecord(date) {
  const { data } = await api.delete(`/api/records/${date}`);
  return data;
}

export async function getCloudinarySignature() {
  const { data } = await api.post("/api/cloudinary/signature", {});
  return data;
}

export async function uploadToCloudinary(file) {
  const sig = await getCloudinarySignature();
  const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`;

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", sig.apiKey);
  fd.append("timestamp", String(sig.timestamp));
  fd.append("signature", sig.signature);
  fd.append("folder", sig.folder);

  const resp = await fetch(url, { method: "POST", body: fd });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Cloudinary upload failed: ${t}`);
  }
  const uploaded = await resp.json();
  return {
    imageUrl: uploaded.secure_url,
    imagePublicId: uploaded.public_id
  };
}
