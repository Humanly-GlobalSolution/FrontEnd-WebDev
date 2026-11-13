import { apiError, readJsonBody } from "@/services/http.server";
import { createReviewRequest } from "@/services/reviewRequests.server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Envie o pedido pelo próprio site." }, { status: 403 });
    const result = await createReviewRequest(await readJsonBody(request), request.headers.get("idempotency-key"));
    return Response.json(result, { status: result.replayed ? 200 : 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
