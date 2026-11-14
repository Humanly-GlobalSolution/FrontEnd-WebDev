import { apiError, readJsonBody } from "@/services/http.server";
import { createReviewRequest, listReviewRequests } from "@/services/reviewRequests.server";
import { requireAdmin } from "@/services/admin.server";
import { OrionError } from "@/services/orion.server";
import { isSameOriginRequest } from "@/lib/requestOrigin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const query = new URL(request.url).searchParams;
    if ([...query.keys()].some((key) => !["limit", "offset"].includes(key)) || query.getAll("limit").length > 1 || query.getAll("offset").length > 1) throw new OrionError("Use somente limit e offset para paginar os pedidos.", 400);
    const limit = query.get("limit") ?? "20";
    const offset = query.get("offset") ?? "0";
    if (!/^\d+$/.test(limit) || !/^\d+$/.test(offset) || Number(limit) < 1 || Number(limit) > 100 || Number(offset) > 10000) throw new OrionError("Informe limit entre 1 e 100 e offset entre 0 e 10000.", 400);
    return Response.json(await listReviewRequests(Number(limit), Number(offset)), { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "Vary": "Authorization, Cookie" } });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) return Response.json({ error: "Envie o pedido pelo próprio site." }, { status: 403 });
    const result = await createReviewRequest(await readJsonBody(request), request.headers.get("idempotency-key"));
    return Response.json(result, { status: result.replayed ? 200 : 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
