import { apiError, readJsonBody } from "@/services/http.server";
import { cancelReviewRequest, findReviewRequest, updateReviewRequest } from "@/services/reviewRequests.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ protocol: string }> }) {
  try {
    const { protocol } = await params;
    return Response.json({ request: await findReviewRequest(protocol) }, { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ protocol: string }> }) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Cancele o pedido pelo próprio site." }, { status: 403 });
    if (request.headers.get("x-confirm-cancel") !== "true") return Response.json({ error: "Confirme o cancelamento antes de excluir o pedido." }, { status: 400 });
    const { protocol } = await params;
    await cancelReviewRequest(protocol);
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ protocol: string }> }) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Edite o pedido pelo próprio site." }, { status: 403 });
    const { protocol } = await params;
    return Response.json({ request: await updateReviewRequest(protocol, await readJsonBody(request)) }, { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  } catch (error) { return apiError(error); }
}
