import type { CrossingsResponse } from "@/types/crossing";
import { requestJson } from "@/lib/httpClient";
import { parseOrionCrossing } from "@/lib/orionCrossings";

export async function listCrossings(signal?: AbortSignal): Promise<CrossingsResponse> {
  const data = await requestJson("/api/cruzamentos", { signal, cache: "no-store" }, { fallbackMessage: "Não foi possível ler a lista de cruzamentos. Tente novamente." });
  if (!Array.isArray(data.crossings) || (data.source !== "demo" && data.source !== "orion")) throw new Error("A consulta retornou uma resposta inválida. Tente novamente.");
  try {
    const crossings = data.crossings.map((value) => parseOrionCrossing(value, { code: "code", address: "address", width: "width", time: "currentSeconds" }));
    return { source: data.source, crossings };
  } catch { throw new Error("A lista contém dados de travessia inválidos. Tente novamente mais tarde."); }
}
