import type { CrossingsResponse } from "@/types/crossing";

export async function listCrossings(signal?: AbortSignal): Promise<CrossingsResponse> {
  const response = await fetch("/api/cruzamentos", { signal, cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Não foi possível consultar os cruzamentos.");
  if (!Array.isArray(data.crossings) || !["demo", "orion"].includes(data.source)) throw new Error("A consulta retornou uma resposta inválida.");
  return data as CrossingsResponse;
}
