import assert from "node:assert/strict";
import { test } from "node:test";
import { HttpClientError, requestJson } from "../src/lib/httpClient.ts";

const fallbackMessage = "Não foi possível ler a resposta. Tente novamente.";
async function withFetch(mock, verify) {
  const original = globalThis.fetch;
  globalThis.fetch = mock;
  try { await verify(); } finally { globalThis.fetch = original; }
}

test("lê objeto JSON válido", async () => withFetch(async () => Response.json({ ok: true }), async () => {
  assert.deepEqual(await requestJson("/test", {}, { fallbackMessage }), { ok: true });
}));

test("HTML, JSON inválido, null e array não viram erro técnico visível", async () => {
  for (const payload of ["<html>private server details</html>", "invalid-json", "null", "[]"]) {
    await withFetch(async () => new Response(payload), async () => {
      await assert.rejects(requestJson("/test", {}, { fallbackMessage }), (error) => error instanceof HttpClientError && error.message === fallbackMessage);
    });
  }
});

test("preserva mensagem de erro controlada da API", async () => withFetch(async () => Response.json({ error: "Pedido já respondido." }, { status: 409 }), async () => {
  await assert.rejects(requestJson("/test", {}, { fallbackMessage }), (error) => error.status === 409 && error.message === "Pedido já respondido.");
}));

test("falha de rede é traduzida", async () => withFetch(async () => { throw new TypeError("Failed to fetch"); }, async () => {
  await assert.rejects(requestJson("/test", {}, { fallbackMessage }), (error) => error.message.includes("Confira sua conexão") && !error.message.includes("Failed to fetch"));
}));

test("timeout cancela a requisição sem nova tentativa automática", async () => {
  let calls = 0;
  await withFetch(async (_url, { signal }) => {
    calls++;
    return new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true }));
  }, async () => {
    await assert.rejects(requestJson("/test", {}, { fallbackMessage, timeoutMs: 10 }), /demorou mais que o esperado/);
    assert.equal(calls, 1);
  });
});

test("timeout cobre também a leitura do corpo da resposta", async () => withFetch(async (_url, { signal }) => ({
  status: 200, ok: true,
  text: () => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true })),
}), async () => {
  await assert.rejects(requestJson("/test", {}, { fallbackMessage, timeoutMs: 10 }), /demorou mais que o esperado/);
}));

test("cancelamento externo é preservado", async () => withFetch(async (_url, { signal }) => {
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  return Response.json({});
}, async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(requestJson("/test", { signal: controller.signal }, { fallbackMessage }), (error) => error.name === "AbortError");
}));

test("só confirma exclusão com 204", async () => {
  await withFetch(async () => new Response(null, { status: 204 }), async () => {
    assert.deepEqual(await requestJson("/test", { method: "DELETE" }, { fallbackMessage, expectedStatus: 204 }), {});
  });
  await withFetch(async () => Response.json({ ok: true }), async () => {
    await assert.rejects(requestJson("/test", { method: "DELETE" }, { fallbackMessage, expectedStatus: 204 }), HttpClientError);
  });
});
