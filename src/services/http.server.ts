import "server-only";
import { OrionError } from "@/services/orion.server";

export async function readJsonBody(request: Request): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new OrionError("Use Content-Type: application/json.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new OrionError("Envie um corpo JSON.", 400);
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 8192) { await reader.cancel(); throw new OrionError("O corpo da requisição excede 8 KB.", 413); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new OrionError("JSON inválido.", 400); }
}

export function apiError(error: unknown) {
  return Response.json({ error: error instanceof OrionError ? error.message : "Não foi possível concluir a operação." }, {
    status: error instanceof OrionError ? error.status : 500,
    headers: { "Cache-Control": "no-store", ...(error instanceof OrionError && error.status === 401 ? { "WWW-Authenticate": "Bearer" } : {}) },
  });
}
