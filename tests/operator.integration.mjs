import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";
import { crossingCatalog } from "../src/data/crossingCatalog.ts";

const token = "isolated-operator-test-token-with-32-characters";
const protocol = "FA-ABCD-2345";
const field = (value, type = "Text") => ({ type, value });
const crossing = (code) => {
  const updated = crossingCatalog[code];
  return { id: `urn:ngsi-ld:Cruzamento:${code}`, type: "Cruzamento", codigo: field(code), nome: field(updated?.address ?? `Cruzamento ${code}`), largura_m: field(updated?.width ?? 30, "Number"), verde_atual_s: field(updated?.currentSeconds ?? 20, "Number") };
};
const first = { ...crossing("C01"), estado: field("FALHA"), extensao_s: field(15, "Number"), leitura_valida: field(false, "Boolean") };
const request = { id: `urn:ngsi-ld:PedidoRevisao:${protocol}`, type: "PedidoRevisao", protocolo: field(protocol), cruzamento_id: field("C01"), motivo: field("tempo_curto"), comentario: field("Travessia curta."), status: field("enviado"), resposta: field(""), criado_em: field("2026-11-13T12:00:00.000Z", "DateTime"), atualizado_em: field("2026-11-13T12:00:00.000Z", "DateTime") };
const records = [first, crossing("C02"), { ...crossing("C03"), estado: field("INVALIDO"), extensao_s: field(99, "Number") }, request];
const writes = [];
const broker = createServer(async (req, res) => {
  const send = (status, body) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(body === undefined ? undefined : JSON.stringify(body)); };
  try {
    assert.equal(req.headers["fiware-service"], "farolamigo");
    assert.equal(req.headers["fiware-servicepath"], "/");
    assert.equal(req.headers.cookie, undefined, "A sessão do operador não deve ser encaminhada ao Orion.");
    const url = new URL(req.url, "http://127.0.0.1");
    const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    const entity = records.find((item) => item.id === parts[2]);
    if (req.method === "GET") {
      assert.equal(url.searchParams.get("options"), "keyValues");
      const values = (parts[2] ? (entity ? [entity] : []) : records.filter((item) => item.type === url.searchParams.get("type"))).map((item) => Object.fromEntries(Object.entries(item).map(([key, value]) => [key, ["id", "type"].includes(key) ? value : value.value])));
      if (parts[2]) return send(entity ? 200 : 404, values[0]);
      const offset = Number(url.searchParams.get("offset") || 0);
      return send(200, values.slice(offset, offset + Number(url.searchParams.get("limit") || 100)));
    }
    assert.equal(req.method, "PATCH");
    assert.equal(entity?.id, request.id, "O operador não pode escrever na telemetria dos cruzamentos.");
    assert.equal(req.headers["content-type"], "application/json");
    let raw = ""; for await (const chunk of req) raw += chunk;
    const body = JSON.parse(raw);
    writes.push(body); Object.assign(entity, body);
    return send(204);
  } catch (error) { return send(500, { error: error.message }); }
});
broker.listen(0, "127.0.0.1"); await once(broker, "listening");
const probe = createServer(); probe.listen(0, "127.0.0.1"); await once(probe, "listening");
const port = probe.address().port; await new Promise((resolve) => probe.close(resolve));
const base = `http://127.0.0.1:${port}`;
const next = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, CROSSINGS_SOURCE: "orion", ORION_URL: `http://127.0.0.1:${broker.address().port}`, ORION_CROSSING_TYPE: "Cruzamento", ORION_REQUEST_TYPE: "PedidoRevisao", ORION_CODE_ATTRIBUTE: "codigo", ORION_ADDRESS_ATTRIBUTE: "nome", ORION_WIDTH_ATTRIBUTE: "largura_m", ORION_TIME_ATTRIBUTE: "verde_atual_s", ORION_FIWARE_SERVICE: "farolamigo", ORION_FIWARE_SERVICEPATH: "/", ORION_AUTH_TOKEN: "", ADMIN_API_TOKEN: token },
});
let output = ""; next.stdout.on("data", (data) => { output += data; }); next.stderr.on("data", (data) => { output += data; });
const json = { "Content-Type": "application/json" };
const login = (body, headers = {}) => fetch(`${base}/api/painel/sessao`, { method: "POST", headers: { ...json, ...headers }, body: JSON.stringify(body) });
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(`${base}/painel`)).ok) { ready = true; break; } } catch { /* Aguarda Next isolado. */ }
    if (next.exitCode !== null) throw new Error(output);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(ready, output);
  const html = await (await fetch(`${base}/painel`)).text();
  assert.ok(html.includes("Painel do operador")); assert.ok(html.includes("noindex"));
  assert.ok(!html.includes(token)); assert.ok(!html.includes(protocol));
  assert.equal((await (await fetch(`${base}/api/painel/sessao`)).json()).authenticated, false);
  assert.equal((await fetch(`${base}/api/painel/cruzamentos`)).status, 401);
  assert.equal((await fetch(`${base}/api/pedidos`)).status, 401);
  assert.equal((await fetch(`${base}/api/painel/pedidos/${protocol}`, { method: "PATCH", headers: json, body: JSON.stringify({ status: "em_analise" }) })).status, 401);
  assert.equal(writes.length, 0);
  assert.equal((await login({ code: "incorreto" })).status, 401);
  assert.equal((await login({ code: token }, { Origin: "https://outro.example" })).status, 403);
  assert.equal((await login({ code: token, role: "admin" })).status, 400);
  const authenticated = await login({ code: token }, { Origin: base });
  assert.equal(authenticated.status, 200);
  const localhostBase = `http://localhost:${port}`;
  assert.equal((await fetch(`${localhostBase}/api/painel/sessao`, { method: "POST", headers: { ...json, Origin: localhostBase }, body: JSON.stringify({ code: token }) })).status, 200);
  assert.equal((await login({ code: token }, { Origin: "https://outro.example", "X-Forwarded-Host": "outro.example" })).status, 403);
  assert.equal((await login({ code: token }, { Origin: base, "Sec-Fetch-Site": "cross-site" })).status, 403);
  const setCookie = authenticated.headers.get("set-cookie");
  for (const flag of ["HttpOnly", "SameSite=Strict", "Secure", "Max-Age=28800"]) assert.ok(setCookie.includes(flag));
  assert.ok(!setCookie.includes(token));
  const cookie = setCookie.split(";")[0];
  const headers = { ...json, Cookie: cookie, Origin: base };
  assert.equal((await (await fetch(`${base}/api/painel/sessao`, { headers })).json()).authenticated, true);
  const invalidCookie = cookie.slice(0, -1) + (cookie.endsWith("A") ? "B" : "A");
  assert.equal((await fetch(`${base}/api/painel/cruzamentos`, { headers: { Cookie: invalidCookie } })).status, 401);
  const expired = `${Math.floor(Date.now() / 1000) - 1}.${"a".repeat(32)}`;
  const expiredSignature = createHmac("sha256", token).update(`farol-amigo/operator-session/v1:${expired}`).digest("base64url");
  assert.equal((await fetch(`${base}/api/painel/cruzamentos`, { headers: { Cookie: `farol_operator_session=${expired}.${expiredSignature}` } })).status, 401);
  const telemetry = await (await fetch(`${base}/api/painel/cruzamentos`, { headers })).json();
  assert.equal(telemetry.crossings[0].signalState, "FALHA");
  assert.equal(telemetry.crossings[0].extensionSeconds, 15);
  assert.equal(telemetry.crossings[0].validReading, false);
  assert.equal(telemetry.crossings[1].signalState, null);
  assert.equal(telemetry.crossings[1].extensionSeconds, null);
  assert.equal(telemetry.crossings[2].telemetryIssue, true);
  first.estado = field("TEMPO_ESTENDIDO"); first.extensao_s = field(6, "Number"); first.leitura_valida = field(true, "Boolean");
  const changedTelemetry = await (await fetch(`${base}/api/painel/cruzamentos`, { headers })).json();
  assert.equal(changedTelemetry.crossings[0].signalState, "TEMPO_ESTENDIDO");
  assert.equal(changedTelemetry.crossings[0].extensionSeconds, 6);
  const listed = await fetch(`${base}/api/pedidos?limit=20&offset=0`, { headers });
  assert.equal(listed.status, 200); assert.equal((await listed.json()).requests[0].protocol, protocol);
  const patch = (body, extra = {}) => fetch(`${base}/api/painel/pedidos/${protocol}`, { method: "PATCH", headers: { ...headers, ...extra }, body: JSON.stringify(body) });
  assert.equal((await patch({ status: "em_analise" })).status, 200);
  assert.deepEqual(Object.keys(writes[0]).sort(), ["atualizado_em", "status"]);
  assert.equal(request.status.value, "em_analise");
  assert.equal((await fetch(`${base}/api/pedidos/${protocol}`, { method: "PATCH", headers, body: JSON.stringify({ status: "respondido", response: "Atalho indevido" }) })).status, 400);
  for (const body of [{ status: "enviado" }, { status: ["em_analise"] }, { status: "respondido", response: [] }, { status: "respondido", id: "outro", response: "Texto" }, { status: "respondido", response: "" }, { status: "respondido", response: "a".repeat(2001) }, { status: "em_analise", response: "Resposta antecipada" }]) assert.equal((await patch(body)).status, 400);
  for (const symbol of ['<', '>', '"', "'", '=', ';', '(', ')']) assert.equal((await patch({ status: "respondido", response: symbol })).status, 400);
  assert.equal((await patch({ status: "respondido", response: "Resposta" }, { Origin: "https://outro.example" })).status, 403);
  assert.equal(writes.length, 1);
  assert.equal((await patch({ status: "respondido", response: "Tempo recebido para avaliacao da equipe." })).status, 200);
  assert.deepEqual(Object.keys(writes[1]).sort(), ["atualizado_em", "resposta", "status"]);
  const citizen = await fetch(`${base}/api/pedidos/${protocol}`);
  const result = (await citizen.json()).request;
  assert.equal(citizen.status, 200, "O cidadão continua consultando sem cookie nem login.");
  assert.equal(result.status, "respondido"); assert.equal(result.response, "Tempo recebido para avaliacao da equipe.");
  assert.equal(result.reason, "tempo_curto"); assert.equal(result.comment, "Travessia curta.");
  assert.equal((await fetch(`${base}/api/pedidos/${protocol}`, { method: "PATCH", headers: json, body: JSON.stringify({ comment: "Alteracao" }) })).status, 409);
  assert.equal((await fetch(`${base}/api/pedidos/${protocol}`, { method: "DELETE", headers: { "X-Confirm-Cancel": "true" } })).status, 409);
  assert.equal((await patch({ status: "em_analise" })).status, 409);
  assert.equal(writes.length, 2);
  for (let index = 0; index < 10; index++) assert.equal((await login({ code: "incorreto" }, { "x-forwarded-for": "198.51.100.9" })).status, 401);
  const limited = await login({ code: "incorreto" }, { "x-forwarded-for": "198.51.100.9" });
  assert.equal(limited.status, 429); assert.equal(limited.headers.get("retry-after"), "300");
  const logout = await fetch(`${base}/api/painel/sessao`, { method: "DELETE", headers });
  assert.equal(logout.status, 200); assert.ok(logout.headers.get("set-cookie").includes("Max-Age=0"));
  assert.equal((await (await fetch(`${base}/api/painel/sessao`)).json()).authenticated, false);
  console.log("OK: acesso protegido, cookie assinado/expirado/adulterado, tentativas limitadas, telemetria, atendimento e resposta ao cidadão. Broker em memória; nenhuma escrita na Azure.");
} finally {
  next.kill(); if (next.exitCode === null) await once(next, "exit");
  broker.closeAllConnections(); await new Promise((resolve) => broker.close(resolve));
}
