import { existsSync } from "node:fs";
import { parseArgs } from "node:util";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const { values, positionals } = parseArgs({ allowPositionals: true, options: {
  code: { type: "string" }, address: { type: "string" }, width: { type: "string" }, seconds: { type: "string" }, confirm: { type: "boolean", default: false },
} });
const [action] = positionals;
if (!["list", "get", "create", "update", "delete"].includes(action)) throw new Error("Use list, get, create, update ou delete. Consulte README.md.");
if (action !== "list" && !values.code) throw new Error("Informe --code.");
if (action === "delete" && !values.confirm) throw new Error("Confirme a exclusão deste código com --confirm.");
if (!process.env.ADMIN_API_TOKEN) throw new Error("Configure ADMIN_API_TOKEN em .env.local.");
const base = new URL(process.env.APP_BASE_URL || "http://localhost:3000");
if (base.protocol !== "https:" && !(base.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname))) throw new Error("Use HTTPS para acessar um backend remoto.");
const path = `/api/admin/cruzamentos${["get", "update", "delete"].includes(action) ? `/${encodeURIComponent(values.code)}` : ""}`;
const method = { list: "GET", get: "GET", create: "POST", update: "PATCH", delete: "DELETE" }[action];
const body = {};
if (action === "create") body.code = values.code;
if (values.address !== undefined) body.address = values.address;
if (values.width !== undefined) body.width = Number(values.width);
if (values.seconds !== undefined) body.currentSeconds = Number(values.seconds);
const response = await fetch(new URL(path, base), {
  method,
  headers: { Authorization: `Bearer ${process.env.ADMIN_API_TOKEN}`, "Content-Type": "application/json" },
  body: ["create", "update"].includes(action) ? JSON.stringify(body) : undefined,
  signal: AbortSignal.timeout(30000),
});
const text = await response.text();
if (!response.ok) { console.error(`HTTP ${response.status}: ${text}`); process.exitCode = 1; }
else if (response.status === 204) console.log(`Cruzamento ${values.code} excluído.`);
else console.log(JSON.stringify(JSON.parse(text), null, 2));
