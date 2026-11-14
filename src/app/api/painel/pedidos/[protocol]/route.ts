import { requireAdmin } from "@/services/admin.server";
import { apiError, readJsonBody } from "@/services/http.server";
import { requireSameOrigin } from "@/services/operatorSession.server";
import { answerReviewRequest } from "@/services/reviewRequests.server";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ protocol: string }> }) {
  try {
    requireAdmin(request);
    requireSameOrigin(request);
    const { protocol } = await params;
    return Response.json({ request: await answerReviewRequest(protocol, await readJsonBody(request)) }, { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", Vary: "Cookie, Authorization" } });
  } catch (error) { return apiError(error); }
}
