import "server-only";
import { timingSafeEqual } from "node:crypto";
import { OrionError } from "@/services/orion.server";

export function requireAdmin(request: Request) {
  const token = process.env.ADMIN_API_TOKEN;
  if (!token || token.length < 32) throw new OrionError("A API administrativa precisa de um token de pelo menos 32 caracteres no servidor.", 503);
  const expected = Buffer.from(`Bearer ${token}`);
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) throw new OrionError("Acesso administrativo não autorizado.", 401);
}

export async function readCrossingBody(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new OrionError("Use Content-Type: application/json.", 415);
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
