import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";

// Reutiliza o roteiro completo de CRUD contra um broker exclusivamente em memória.
// Nunca lê o endereço compartilhado nem envia requisições fora do loopback.
const entities = new Map();
const methods = new Set();
const broker = createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1");
  const send = (status, body) => {
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(body === undefined ? undefined : JSON.stringify(body));
  };
  try {
    assert.equal(request.headers["fiware-service"], "farolamigo");
    assert.equal(request.headers["fiware-servicepath"], "/");
    if (["POST", "PATCH"].includes(request.method)) assert.equal(request.headers["content-type"], "application/json");
    methods.add(request.method);
    const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    if (parts[0] !== "v2" || parts[1] !== "entities") return send(404);
    const id = parts[2];
    const current = entities.get(id);
    const type = url.searchParams.get("type");
    if (request.method === "GET") {
      let values = id ? (current && (!type || current.type === type) ? [current] : []) : [...entities.values()].filter((entity) => !type || entity.type === type).sort((a, b) => a.id.localeCompare(b.id));
      if (id && values.length === 0) return send(404);
      if (url.searchParams.get("options") === "keyValues") values = values.map((entity) => Object.fromEntries(Object.entries(entity).map(([key, value]) => [key, ["id", "type"].includes(key) ? value : value.value])));
      const offset = Number(url.searchParams.get("offset") ?? 0);
      const limit = Number(url.searchParams.get("limit") ?? 20);
      return send(200, id ? values[0] : values.slice(offset, offset + limit));
    }
    if (request.method === "DELETE") {
      if (!current) return send(404);
      entities.delete(id);
      return send(204);
    }
    let raw = "";
    for await (const chunk of request) raw += chunk;
    const body = JSON.parse(raw);
    if (request.method === "POST" && !id) {
      if (entities.has(body.id)) return send(422);
      entities.set(body.id, body);
      return send(201);
    }
    if (["PATCH", "POST"].includes(request.method) && parts[3] === "attrs") {
      if (!current) return send(404);
      entities.set(id, { ...current, ...body });
      return send(204);
    }
    return send(400);
  } catch {
    return send(400);
  }
});
broker.listen(0, "127.0.0.1");
await once(broker, "listening");
const child = spawn(process.execPath, ["tests/requests.local.mjs"], {
  windowsHide: true,
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, ORION_URL: `http://127.0.0.1:${broker.address().port}`, ORION_BASE_URL: "http://127.0.0.1:1", CROSSINGS_SOURCE: "orion", ORION_CROSSING_TYPE: "Cruzamento", ORION_REQUEST_TYPE: "PedidoRevisao", ORION_CODE_ATTRIBUTE: "codigo", ORION_ADDRESS_ATTRIBUTE: "nome", ORION_WIDTH_ATTRIBUTE: "largura_m", ORION_TIME_ATTRIBUTE: "verde_atual_s", ADMIN_API_TOKEN: "isolated-request-test-token-32-characters", REQUEST_PROTOCOL_SECRET: "isolated-protocol-secret-for-tests-32-characters", ORION_FIWARE_SERVICE: "farolamigo", ORION_FIWARE_SERVICEPATH: "/", ORION_AUTH_TOKEN: "" },
});
let output = "";
child.stdout.on("data", (chunk) => { output += chunk; });
child.stderr.on("data", (chunk) => { output += chunk; });
try {
  const [code] = await once(child, "exit");
  assert.equal(code, 0, output);
  assert.deepEqual([...methods].sort(), ["DELETE", "GET", "PATCH", "POST"]);
  assert.equal(entities.size, 0, "O roteiro deve remover somente seus próprios registros temporários.");
  const probe = createServer();
  probe.listen(0, "127.0.0.1");
  await once(probe, "listening");
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  // Destino reservado .invalid: mesmo um defeito no bloqueio não tocaria a Azure.
  const readonly = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    windowsHide: true, stdio: "ignore",
    env: { ...process.env, CROSSINGS_SOURCE: "orion", ORION_URL: "http://shared-orion.invalid:1026", ADMIN_API_TOKEN: "isolated-readonly-token-32-characters" },
  });
  try {
    const base = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      try { if ((await fetch(`${base}/pedidos`)).ok) { ready = true; break; } } catch { /* Aguarda o Next isolado. */ }
      if (readonly.exitCode !== null) throw new Error("Servidor isolado de somente leitura encerrou.");
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    assert.ok(ready);
    const headers = { Authorization: "Bearer isolated-readonly-token-32-characters", "Content-Type": "application/json" };
    for (const [method, path, body] of [
      ["POST", "/api/admin/cruzamentos", { code: "C01", address: "Teste", width: 30, currentSeconds: 20 }],
      ["PATCH", "/api/admin/cruzamentos/C01", { currentSeconds: 40 }],
      ["DELETE", "/api/admin/cruzamentos/C01", undefined],
    ]) {
      const response = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
      assert.equal(response.status, 403, `Cruzamentos remotos não podem receber ${method}.`);
    }
  } finally {
    readonly.kill();
    if (readonly.exitCode === null) await once(readonly, "exit");
  }
  console.log("OK: CRUD de pedidos no broker simulado; listagem administrativa, validação, idempotência, status e confirmação de exclusão. Nenhuma escrita na Azure.");
} finally {
  if (child.exitCode === null) child.kill();
  broker.closeAllConnections();
  await new Promise((resolve) => broker.close(resolve));
}
