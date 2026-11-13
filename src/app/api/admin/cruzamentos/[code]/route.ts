import { requireAdmin } from "@/services/admin.server";
import { apiError, readJsonBody } from "@/services/http.server";
import { deleteCrossing, findCrossing, updateCrossing } from "@/services/crossings.server";
import { OrionError } from "@/services/orion.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Context = { params: Promise<{ code: string }> };

export async function GET(request: Request, { params }: Context) {
  try {
    requireAdmin(request);
    const { code } = await params;
    const result = await findCrossing(code);
    if (!result.crossing) throw new OrionError("Cruzamento não encontrado.", 404);
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request, { params }: Context) {
  try { requireAdmin(request); const { code } = await params; return Response.json({ crossing: await updateCrossing(code, await readJsonBody(request)) }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return apiError(error); }
}

export async function DELETE(request: Request, { params }: Context) {
  try { requireAdmin(request); const { code } = await params; await deleteCrossing(code); return new Response(null, { status: 204 }); }
  catch (error) { return apiError(error); }
}
