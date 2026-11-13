import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";

// Executar após npm run build. Usa somente um Orion simulado local e processos próprios.
let scenario = "valid";
const calls = [];
const entity = (index) => ({ id: `urn:ngsi-ld:Cruzamento:${index}`, type: "Cruzamento", codigo: `C${index}`, endereco: `Rua de teste ${index}`, largura: 30, tempoAtual: 20 });
const broker = createServer((request, response) => {
  const url = new URL(request.url, "http://localhost");
  calls.push({ path: url.pathname, query: url.searchParams, headers: request.headers });
  response.setHeader("Content-Type", "application/json");
  if (scenario === "slow_headers") return;
  if (scenario === "slow_body") { response.write("["); return; }
  if (scenario === "unavailable") { response.writeHead(503); response.end('{"error":"private upstream detail"}'); return; }
  if (scenario === "malformed") { response.end("not json"); return; }
  if (scenario === "invalid") { response.end(JSON.stringify([{ ...entity(1), largura: 0 }])); return; }
  if (scenario === "duplicate") { response.end(JSON.stringify([entity(1), entity(1)])); return; }
  if (scenario === "empty") { response.end("[]"); return; }
  if (scenario === "paginated") {
    const offset = Number(url.searchParams.get("offset"));
    response.end(JSON.stringify(Array.from({ length: offset === 0 ? 100 : 1 }, (_, index) => entity(offset + index + 1))));
    return;
  }
  response.end(JSON.stringify([entity(1)]));
});
broker.listen(0, "127.0.0.1");
await once(broker, "listening");

// Reserva uma porta disponível para o Next de teste, separado do servidor do usuário.
const portProbe = createServer();
portProbe.listen(0, "127.0.0.1");
await once(portProbe, "listening");
const port = portProbe.address().port;
await new Promise((resolve) => portProbe.close(resolve));
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd: process.cwd(), windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, CROSSINGS_SOURCE: "orion", ORION_BASE_URL: `http://127.0.0.1:${broker.address().port}`, ORION_CROSSING_TYPE: "Cruzamento", ORION_CODE_ATTRIBUTE: "codigo", ORION_ADDRESS_ATTRIBUTE: "endereco", ORION_WIDTH_ATTRIBUTE: "largura", ORION_TIME_ATTRIBUTE: "tempoAtual", ORION_FIWARE_SERVICE: "test-service", ORION_FIWARE_SERVICEPATH: "/test", ORION_AUTH_TOKEN: "test-only-token" },
});
let output = "";
child.stdout.on("data", (chunk) => { output += chunk; });
child.stderr.on("data", (chunk) => { output += chunk; });

try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(`${base}/api/cruzamentos`)).ok) { ready = true; break; } } catch { /* Aguarda inicialização. */ }
    if (child.exitCode !== null) throw new Error(`Next encerrou antes do teste: ${output}`);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(ready, "Servidor de teste deve iniciar.");
  const valid = await fetch(`${base}/api/cruzamentos`);
  const payload = await valid.json();
  assert.equal(payload.source, "orion");
  assert.equal(payload.crossings[0].code, "C1");
  assert.equal(payload.crossings[0].width, 30);
  assert.equal(valid.headers.get("cache-control"), "no-store");
  assert.equal(calls[0].path, "/v2/entities");
  assert.equal(calls[0].query.get("type"), "Cruzamento");
  assert.equal(calls[0].query.get("options"), "keyValues");
  assert.equal(calls[0].headers["fiware-service"], "test-service");
  assert.equal(calls[0].headers["fiware-servicepath"], "/test");
  assert.equal(calls[0].headers.authorization, "Bearer test-only-token");
  assert.ok(!JSON.stringify(payload).includes("test-only-token"));

  const detail = await fetch(`${base}/cruzamentos/C1`);
  assert.equal(detail.status, 200);
  assert.ok((await detail.text()).includes("Rua de teste 1"));
  assert.equal((await fetch(`${base}/cruzamentos/INEXISTENTE`)).status, 404);

  scenario = "paginated";
  const paginated = await (await fetch(`${base}/api/cruzamentos`)).json();
  assert.equal(paginated.crossings.length, 101);
  assert.ok(calls.some((call) => call.query.get("offset") === "100"));

  scenario = "empty";
  const empty = await (await fetch(`${base}/api/cruzamentos`)).json();
  assert.deepEqual(empty, { source: "orion", crossings: [] });

  for (scenario of ["unavailable", "malformed", "invalid", "duplicate"]) {
    const failure = await fetch(`${base}/api/cruzamentos`);
    assert.equal(failure.status, 502, scenario);
    const body = await failure.json();
    assert.equal(typeof body.error, "string");
    assert.ok(!("crossings" in body), "Falha nunca deve retornar dados demo.");
    assert.ok(!JSON.stringify(body).includes("private upstream detail"));
  }
  for (scenario of ["slow_headers", "slow_body"]) {
    const timeout = await fetch(`${base}/api/cruzamentos`);
    assert.equal(timeout.status, 504, scenario);
    const body = await timeout.json();
    assert.match(body.error, /demorou/);
    assert.ok(!("crossings" in body));
  }
  console.log("OK: contrato, headers, detalhe, paginação, lista vazia, quatro falhas e timeout de cabeçalhos/corpo sem fallback.");
} finally {
  child.kill();
  broker.closeAllConnections();
  await new Promise((resolve) => broker.close(resolve));
  if (child.exitCode === null) await once(child, "exit");
}
