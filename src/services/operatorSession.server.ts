import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { OrionError } from "@/services/orion.server";
import { isSameOriginRequest } from "@/lib/requestOrigin";

const COOKIE = "farol_operator_session";
const SESSION_SECONDS = 8 * 60 * 60;

function adminToken() {
  const token = process.env.ADMIN_API_TOKEN;
  if (!token || token.length < 32) throw new OrionError("Configure o código do operador em ADMIN_API_TOKEN no servidor, com pelo menos 32 caracteres.", 503);
  return token;
}

function constantEqual(expected: string, received: string) {
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function validOperatorCode(code: string) { return constantEqual(adminToken(), code); }
export function validAdminBearer(request: Request) { return constantEqual(`Bearer ${adminToken()}`, request.headers.get("authorization") ?? ""); }

function signature(payload: string) {
  return createHmac("sha256", adminToken()).update(`farol-amigo/operator-session/v1:${payload}`).digest("base64url");
}

export function validOperatorSession(request: Request) {
  const item = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`));
  if (!item) return false;
  const value = item.slice(COOKIE.length + 1);
  const match = /^(\d{10})\.([a-f0-9]{32})\.([A-Za-z0-9_-]{43})$/.exec(value);
  if (!match) return false;
  const now = Math.floor(Date.now() / 1000);
  const expires = Number(match[1]);
  if (expires <= now || expires > now + SESSION_SECONDS) return false;
  return constantEqual(signature(`${match[1]}.${match[2]}`), match[3]);
}

function cookie(value: string, maxAge: number) {
  return `${COOKIE}=${value}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${maxAge}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export function createOperatorCookie() {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `${expires}.${randomBytes(16).toString("hex")}`;
  return cookie(`${payload}.${signature(payload)}`, SESSION_SECONDS);
}

export function clearOperatorCookie() { return cookie("", 0); }

export function requireSameOrigin(request: Request) {
  if (!isSameOriginRequest(request)) throw new OrionError("Use esta ação pelo próprio site.", 403);
}

// Limite local por instância; não substitui controle de tentativas no gateway.
const attempts = new Map<string, { count: number; expires: number }>();
export function checkLoginAttempts(request: Request, success?: boolean) {
  const key = (request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local").slice(0, 100);
  const now = Date.now();
  const current = attempts.get(key);
  if (current && current.expires > now && current.count >= 10) throw new OrionError("Muitas tentativas. Aguarde cinco minutos antes de tentar novamente.", 429);
  if (success === true) { attempts.delete(key); return; }
  if (success === false) {
    if (attempts.size >= 1000) for (const [id, entry] of attempts) if (entry.expires <= now) attempts.delete(id);
    if (attempts.size >= 1000) attempts.delete(attempts.keys().next().value!);
    attempts.set(key, { count: current && current.expires > now ? current.count + 1 : 1, expires: current && current.expires > now ? current.expires : now + 300000 });
  }
}
