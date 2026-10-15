import fs from "node:fs";

export function readCertificate(value) {
  const text = String(value ?? "").trim();
  if (!text) return undefined;
  if (text.includes("BEGIN CERTIFICATE")) return text.replace(/\\n/g, "\n");
  return fs.readFileSync(text, "utf8");
}

export function buildDbSslOptions(env) {
  if (env.DB_SSL !== "true") return undefined;

  const ca = readCertificate(env.DB_SSL_CA);
  return ca ? { rejectUnauthorized: true, ca } : { rejectUnauthorized: true };
}
