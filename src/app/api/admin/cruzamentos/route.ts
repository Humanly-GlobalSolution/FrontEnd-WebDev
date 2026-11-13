import { requireAdmin } from "@/services/admin.server";
import { apiError, readJsonBody } from "@/services/http.server";
import { createCrossing, listCrossingsServer } from "@/services/crossings.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try { requireAdmin(request); return Response.json(await listCrossingsServer(), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    requireAdmin(request);
    const crossing = await createCrossing(await readJsonBody(request));
    return Response.json({ crossing }, { status: 201, headers: { Location: `/api/admin/cruzamentos/${crossing.code}`, "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
