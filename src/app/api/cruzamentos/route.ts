import { listCrossingsServer } from "@/services/crossings.server";
import { OrionError } from "@/services/orion.server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await listCrossingsServer(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof OrionError ? error.message : "Não foi possível consultar os cruzamentos.";
    return Response.json({ error: message }, { status: error instanceof OrionError ? error.status : 500, headers: { "Cache-Control": "no-store" } });
  }
}
