import { apiError } from "@/services/http.server";
import { findReviewRequest } from "@/services/reviewRequests.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ protocol: string }> }) {
  try {
    const { protocol } = await params;
    return Response.json({ request: await findReviewRequest(protocol) }, { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  } catch (error) { return apiError(error); }
}
