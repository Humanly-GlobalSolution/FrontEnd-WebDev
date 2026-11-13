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
