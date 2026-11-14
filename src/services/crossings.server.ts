import "server-only";
import { demoCrossings } from "@/data/demoCrossings";
import { parseOrionCrossing } from "@/lib/orionCrossings";
import { OrionError, orionRequest } from "@/services/orion.server";
import type { Crossing, CrossingsResponse, CrossingsSource } from "@/types/crossing";
import { validateCrossingInput } from "@/lib/crossingInput";

function crossingMapping() {
  const mapping = {
    code: process.env.ORION_CODE_ATTRIBUTE || "codigo",
    address: process.env.ORION_ADDRESS_ATTRIBUTE || "nome",
    width: process.env.ORION_WIDTH_ATTRIBUTE || "largura_m",
    time: process.env.ORION_TIME_ATTRIBUTE || "verde_atual_s",
  };
  if (new Set(Object.values(mapping)).size !== 4 || Object.values(mapping).some((name) => !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name) || ["id", "type", "__proto__", "constructor", "prototype"].includes(name))) throw new OrionError("O mapeamento dos atributos do Orion é inválido.", 503);
  return mapping;
}

export function getCrossingsSource(): CrossingsSource {
  const source = process.env.CROSSINGS_SOURCE ?? "demo";
  if (source !== "demo" && source !== "orion") throw new OrionError("A fonte de cruzamentos não foi configurada corretamente.", 503);
  return source;
}

export async function listCrossingsServer(): Promise<CrossingsResponse> {
  const source = getCrossingsSource();
  if (source === "demo") return { source, crossings: demoCrossings.map((crossing) => ({ ...crossing, simulated: true })) };

  return { source, crossings: (await listCrossingEntitiesServer()).map((item) => item.crossing) };
}

export async function listCrossingEntitiesServer() {
  const mapping = crossingMapping();
  const records: { crossing: Crossing; entity: Record<string, unknown> }[] = [];
  const codes = new Set<string>();
  for (let offset = 0; offset < 10000; offset += 100) {
    const query = new URLSearchParams({ type: process.env.ORION_CROSSING_TYPE || "Cruzamento", options: "keyValues", limit: "100", offset: String(offset), orderBy: "id" });
    const data = await orionRequest("v2/entities", query);
    if (!Array.isArray(data)) throw new OrionError("O Orion retornou uma lista de cruzamentos inválida.");
    try {
      for (const entity of data) {
        const crossing = parseOrionCrossing(entity, mapping);
        const normalizedCode = crossing.code.toUpperCase();
        if (codes.has(normalizedCode)) throw new Error("Código duplicado.");
        codes.add(normalizedCode);
        records.push({ crossing, entity: entity as Record<string, unknown> });
      }
    } catch {
      throw new OrionError("Os dados do Orion não correspondem ao contrato de cruzamentos. Verifique a configuração com o responsável pelo serviço.");
    }
    if (data.length < 100) return records;
  }
  throw new OrionError("A lista de cruzamentos excedeu o limite de consulta.");
}

export async function findCrossing(code: string) {
  const { source, crossings } = await listCrossingsServer();
  return { source, crossing: crossings.find((crossing) => crossing.code.toUpperCase() === code.toUpperCase()) };
}

function requireOrion() {
  if (getCrossingsSource() !== "orion") throw new OrionError("Ative CROSSINGS_SOURCE=orion para administrar cruzamentos persistidos.", 503);
  const base = process.env.ORION_URL ?? process.env.ORION_BASE_URL;
  let hostname: string;
  try { hostname = new URL(base ?? "").hostname; } catch { throw new OrionError("Configure o endereço do Orion.", 503); }
  if (!["localhost", "127.0.0.1", "[::1]"].includes(hostname)) throw new OrionError("Cruzamentos são somente leitura no servidor compartilhado. O cadastro e os atributos do farol pertencem ao Edge.", 403);
}

function validatedInput(value: unknown) {
  try { return validateCrossingInput(value); }
  catch (error) { throw new OrionError(error instanceof Error ? error.message : "Dados inválidos.", 400); }
}

function entityAttributes(input: ReturnType<typeof validateCrossingInput>) {
  const mapping = crossingMapping();
  return {
    [mapping.code]: { type: "Text", value: input.code },
    [mapping.address]: { type: "Text", value: input.address },
    [mapping.width]: { type: "Number", value: input.width },
    [mapping.time]: { type: "Number", value: input.currentSeconds },
  };
}

export async function createCrossing(value: unknown): Promise<Crossing> {
  requireOrion();
  const input = validatedInput(value);
  if ((await findCrossing(input.code)).crossing) throw new OrionError("Já existe um cruzamento com este código.", 409);
  const type = process.env.ORION_CROSSING_TYPE || "Cruzamento";
  const id = `urn:ngsi-ld:${type}:${input.code}`;
  await orionRequest("v2/entities", new URLSearchParams(), { method: "POST", body: { id, type, ...entityAttributes(input) } });
  return { id, ...input };
}

export async function updateCrossing(code: string, value: unknown): Promise<Crossing> {
  requireOrion();
  const existing = (await findCrossing(code)).crossing;
  if (!existing) throw new OrionError("Cruzamento não encontrado.", 404);
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length === 0) throw new OrionError("Informe ao menos um campo para atualizar.", 400);
  const input = validatedInput({ code: existing.code, address: existing.address, width: existing.width, currentSeconds: existing.currentSeconds, ...value });
  if (input.code !== existing.code.toUpperCase()) throw new OrionError("O código não pode ser alterado. Use o código do cruzamento consultado.", 400);
  await orionRequest(`v2/entities/${encodeURIComponent(existing.id)}/attrs`, new URLSearchParams({ type: process.env.ORION_CROSSING_TYPE || "Cruzamento" }), { method: "PATCH", body: entityAttributes(input) });
  return { id: existing.id, ...input };
}

export async function deleteCrossing(code: string) {
  requireOrion();
  const existing = (await findCrossing(code)).crossing;
  if (!existing) throw new OrionError("Cruzamento não encontrado.", 404);
  await orionRequest(`v2/entities/${encodeURIComponent(existing.id)}`, new URLSearchParams({ type: process.env.ORION_CROSSING_TYPE || "Cruzamento" }), { method: "DELETE" });
}
