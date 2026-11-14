import assert from "node:assert/strict";
import { test } from "node:test";
import { isSameOriginRequest } from "../src/lib/requestOrigin.ts";

const check = (headers, url = "http://localhost:3000/api/painel/sessao") => isSameOriginRequest(new Request(url, { method: "POST", headers }));

test("aceita o Host solicitado quando o Next usa hostname interno diferente", () => {
  assert.equal(check({ Host: "127.0.0.1:3000", Origin: "http://127.0.0.1:3000" }), true);
  assert.equal(check({ Host: "localhost:3000", Origin: "http://localhost:3000" }, "http://127.0.0.1:3000/api/painel/sessao"), true);
});
test("mantém comparação exata de host, porta e protocolo", () => {
  for (const Origin of ["http://outro.example", "http://localhost:4000", "https://localhost:3000", "http://127.0.0.1:3000"]) {
    assert.equal(check({ Host: "localhost:3000", Origin }), false);
  }
});
test("aceita origem HTTPS pública com hostname interno diferente", () => {
  assert.equal(check({ Host: "farol.example", Origin: "https://farol.example" }, "https://servidor-interno.example/api/painel/sessao"), true);
});
test("rejeita origem null, malformada ou com caminho e credenciais", () => {
  for (const Origin of ["null", "invalido", "http://localhost:3000/outro", "http://user:pass@localhost:3000", "http://localhost:3000?x=1"]) {
    assert.equal(check({ Origin }), false);
  }
});
test("não aceita X-Forwarded-Host forjado como autorização de origem", () => {
  assert.equal(check({ Host: "localhost:3000", Origin: "https://outro.example", "X-Forwarded-Host": "outro.example", "X-Forwarded-Proto": "https" }), false);
});
test("rejeita indicação cross-site mesmo com origem aparentemente correta", () => {
  assert.equal(check({ Origin: "http://localhost:3000", "Sec-Fetch-Site": "cross-site" }), false);
  assert.equal(check({ "Sec-Fetch-Site": "cross-site" }), false);
});
test("mantém chamadas HTTP sem Origin e fallback ao URL quando não há Host", () => {
  assert.equal(check({}), true);
  assert.equal(check({ Origin: "http://localhost:3000" }), true);
});
test("rejeita Host com múltiplos valores, caminho ou credenciais", () => {
  for (const Host of ["localhost:3000,outro.example", "localhost:3000/path", "user@localhost:3000", "localhost:3000?x=1"]) {
    assert.equal(check({ Host, Origin: "http://localhost:3000" }), false);
  }
});
