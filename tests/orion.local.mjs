import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";

// Teste real: cria e remove somente uma entidade com código único TEST_.
process.loadEnvFile(".env.local");
assert.equal(process.env.CROSSINGS_SOURCE, "orion", "Ative a fonte Orion antes deste teste.");
assert.ok(process.env.ADMIN_API_TOKEN?.length >= 32, "Configure ADMIN_API_TOKEN.");
const orionBase = new URL(process.env.ORION_BASE_URL);
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(orionBase.hostname), "Este teste aceita apenas Orion local.");
const brokerHeaders = { Accept: "application/json" };
if (process.env.ORION_FIWARE_SERVICE) brokerHeaders["Fiware-Service"] = process.env.ORION_FIWARE_SERVICE;
if (process.env.ORION_FIWARE_SERVICEPATH) brokerHeaders["Fiware-ServicePath"] = process.env.ORION_FIWARE_SERVICEPATH;
if (process.env.ORION_AUTH_TOKEN) brokerHeaders.Authorization = `Bearer ${process.env.ORION_AUTH_TOKEN}`;
const version = await fetch(new URL("/version", orionBase), { headers: brokerHeaders });
assert.equal(version.status, 200, "Orion local deve responder.");
console.log(`Orion local: ${(await version.json()).orion.version}`);

const probe = createServer();
probe.listen(0, "127.0.0.1");
await once(probe, "listening");
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], { env: process.env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
let logs = "";
child.stdout.on("data", (data) => { logs += data; });
child.stderr.on("data", (data) => { logs += data; });
const adminHeaders = { Authorization: `Bearer ${process.env.ADMIN_API_TOKEN}`, "Content-Type": "application/json" };
const code = `TEST_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`.toUpperCase();
const collection = `${base}/api/admin/cruzamentos`;
const itemUrl = `${collection}/${code}`;
let created = false;
let entityId;
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(`${base}/api/cruzamentos`)).status === 200) { ready = true; break; } } catch { /* Aguarda o Next. */ }
    if (child.exitCode !== null) throw new Error(`Servidor de teste encerrou: ${logs}`);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(ready, "Servidor deve iniciar e consultar o Orion.");
  assert.equal((await fetch(collection)).status, 401);
  assert.equal((await fetch(collection, { headers: { Authorization: "Bearer incorrect" } })).status, 401);
  assert.equal((await fetch(collection, { method: "POST", headers: adminHeaders, body: "{" })).status, 400);
  assert.equal((await fetch(collection, { method: "POST", headers: adminHeaders, body: JSON.stringify({ code, address: "Teste", width: 0, currentSeconds: 20 }) })).status, 400);
  const draft = { code, address: "Cruzamento temporário de teste automatizado", width: 30, currentSeconds: 20 };
  const creation = await fetch(collection, { method: "POST", headers: adminHeaders, body: JSON.stringify(draft) });
  assert.equal(creation.status, 201, await creation.clone().text());
  created = true;
  entityId = (await creation.json()).crossing.id;
  assert.equal((await fetch(collection, { method: "POST", headers: adminHeaders, body: JSON.stringify(draft) })).status, 409);
  const read = await fetch(itemUrl, { headers: adminHeaders });
  assert.equal(read.status, 200);
  assert.equal((await read.json()).crossing.width, 30);
  const list = await fetch(collection, { headers: adminHeaders });
  assert.equal(list.status, 200);
  assert.ok((await list.json()).crossings.some((item) => item.code === code));
  const directUrl = new URL(`v2/entities/${encodeURIComponent(entityId)}`, `${orionBase.href.replace(/\/$/, "")}/`);
  const persisted = await fetch(directUrl, { headers: brokerHeaders });
  assert.equal(persisted.status, 200);
  assert.equal((await persisted.json())[process.env.ORION_WIDTH_ATTRIBUTE || "largura"].value, 30);
  const update = await fetch(itemUrl, { method: "PATCH", headers: adminHeaders, body: JSON.stringify({ currentSeconds: 40 }) });
  assert.equal(update.status, 200, await update.clone().text());
  const changed = (await update.json()).crossing;
  assert.equal(changed.currentSeconds, 40);
  assert.equal(changed.address, draft.address);
  const reread = await (await fetch(itemUrl, { headers: adminHeaders })).json();
  assert.equal(reread.crossing.currentSeconds, 40);
  const rawChanged = await (await fetch(directUrl, { headers: brokerHeaders })).json();
  assert.equal(rawChanged[process.env.ORION_TIME_ATTRIBUTE || "tempoAtual"].value, 40);
  assert.equal((await fetch(itemUrl, { method: "PATCH", headers: adminHeaders, body: JSON.stringify({ code: "OUTRO" }) })).status, 400);
  assert.equal((await fetch(itemUrl, { method: "PATCH", headers: adminHeaders, body: JSON.stringify({ width: -1 }) })).status, 400);
  assert.equal((await fetch(itemUrl, { method: "DELETE", headers: adminHeaders })).status, 204);
  created = false;
  assert.equal((await fetch(itemUrl, { headers: adminHeaders })).status, 404);
  assert.equal((await fetch(directUrl, { headers: brokerHeaders })).status, 404);
  assert.equal((await fetch(itemUrl, { method: "DELETE", headers: adminHeaders })).status, 404);
  console.log("OK: autenticação, validação, criação, duplicidade, consulta, listagem, PATCH parcial, persistência no Orion e exclusão. Entidade de teste removida.");
} finally {
  if (created) {
    const cleanup = await fetch(itemUrl, { method: "DELETE", headers: adminHeaders }).catch(() => null);
    if (cleanup?.status !== 204) console.error(`Limpeza pendente do registro de teste ${code}.`);
  }
  child.kill();
  if (child.exitCode === null) await once(child, "exit");
}
