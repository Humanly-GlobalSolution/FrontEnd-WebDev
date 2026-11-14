import { apiError, readJsonBody } from "@/services/http.server";
import { checkLoginAttempts, clearOperatorCookie, createOperatorCookie, requireSameOrigin, validOperatorCode, validOperatorSession } from "@/services/operatorSession.server";
import { OrionError } from "@/services/orion.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", Vary: "Cookie" };

export async function GET(request: Request) {
  try { return Response.json({ authenticated: validOperatorSession(request) }, { headers }); }
  catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    checkLoginAttempts(request);
    const body = await readJsonBody(request);
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => key !== "code") || !("code" in body) || typeof body.code !== "string" || body.code.length > 512) throw new OrionError("Informe o código de acesso do operador.", 400);
    const success = validOperatorCode(body.code.trim());
    checkLoginAttempts(request, success);
    if (!success) throw new OrionError("Código de acesso incorreto. Confira com a equipe responsável.", 401);
    return Response.json({ authenticated: true }, { headers: { ...headers, "Set-Cookie": createOperatorCookie() } });
  } catch (error) {
    const response = apiError(error);
    if (error instanceof OrionError && error.status === 429) response.headers.set("Retry-After", "300");
    return response;
  }
}

export async function DELETE(request: Request) {
  try {
    requireSameOrigin(request);
    return Response.json({ authenticated: false }, { headers: { ...headers, "Set-Cookie": clearOperatorCookie() } });
  } catch (error) { return apiError(error); }
}
