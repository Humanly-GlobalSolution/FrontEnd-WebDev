import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";

// Destino fixo loopback: este roteiro nunca usa o endereço de .env.local.
const env = {
  ...process.env, CROSSINGS_SOURCE: "orion", ORION_URL: "http://127.0.0.1:1026", ORION_BASE_URL: "http://127.0.0.1:1026",
  ORION_FIWARE_SERVICE: "farolamigo", ORION_FIWARE_SERVICEPATH: "/", ORION_AUTH_TOKEN: "",
  ORION_CROSSING_TYPE: "Cruzamento", ORION_REQUEST_TYPE: "PedidoRevisao", ORION_CODE_ATTRIBUTE: "codigo", ORION_ADDRESS_ATTRIBUTE: "nome", ORION_WIDTH_ATTRIBUTE: "largura_m", ORION_TIME_ATTRIBUTE: "verde_atual_s",
  ADMIN_API_TOKEN: randomBytes(32).toString("hex"), REQUEST_PROTOCOL_SECRET: randomBytes(32).toString("hex"),
};
const headers = { "Fiware-Service": "farolamigo", "Fiware-ServicePath": "/" };
async function snapshot() {
  const records = [];
  for (const type of ["Cruzamento", "PedidoRevisao"]) {
    for (let offset = 0; ; offset += 100) {
      const response = await fetch(`${env.ORION_URL}/v2/entities?type=${type}&limit=100&offset=${offset}&orderBy=id`, { headers, signal: AbortSignal.timeout(8000) });
      assert.equal(response.status, 200, "Inicie o Orion local do Docker na porta 1026.");
      const page = await response.json();
      records.push(...page);
      if (page.length < 100) break;
    }
  }
  return records;
}
const before = await snapshot();
try {
  for (const script of ["tests/requests.local.mjs", "tests/orion.local.mjs"]) {
    const child = spawn(process.execPath, [script], { env, windowsHide: true, stdio: "inherit" });
    const [code] = await once(child, "exit");
    assert.equal(code, 0, `${script} deve passar.`);
  }
} finally {
  assert.deepEqual(await snapshot(), before, "Os registros preexistentes precisam permanecer intactos e os temporários devem ser removidos.");
}
console.log("OK: 2 roteiros contra Orion real Docker; autenticação do painel, perfil e CRUD; registros preexistentes preservados, temporários removidos.");
