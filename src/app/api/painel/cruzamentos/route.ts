import { requireAdmin } from "@/services/admin.server";
import { apiError } from "@/services/http.server";
import { listOperatorCrossings } from "@/services/operator.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    return Response.json({ crossings: await listOperatorCrossings() }, { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", Vary: "Cookie, Authorization" } });
  } catch (error) { return apiError(error); }
}
