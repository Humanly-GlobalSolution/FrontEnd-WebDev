import type { Crossing } from "../types/crossing";
import { getCrossingMetadata } from "@/data/crossingCatalog";

export type OrionAttributeMapping = { code: string; address: string; width: string; time: string };

function attribute(entity: Record<string, unknown>, key: string) {
  const value = entity[key];
  if (value && typeof value === "object" && "value" in value) return value.value;
  return value;
}

export function parseOrionCrossing(value: unknown, mapping: OrionAttributeMapping): Crossing {
  if (!value || typeof value !== "object") throw new Error("Entidade inválida.");
  const entity = value as Record<string, unknown>;
  const code = attribute(entity, mapping.code);
  const address = attribute(entity, mapping.address);
  const width = attribute(entity, mapping.width);
  const currentSeconds = attribute(entity, mapping.time);
  if (typeof entity.id !== "string" || !entity.id.trim()
    || typeof code !== "string" || !/^[a-zA-Z0-9_-]{1,40}$/.test(code)
    || typeof address !== "string" || !address.trim()
    || typeof width !== "number" || !Number.isFinite(width) || width <= 0
    || typeof currentSeconds !== "number" || !Number.isFinite(currentSeconds) || currentSeconds <= 0) {
    throw new Error("A entidade não corresponde ao contrato de cruzamento.");
  }
  const crossing = { id: entity.id, code, address: address.trim(), width, currentSeconds, simulated: entity.simulated === true || code.toUpperCase() !== "C01" };
  const metadata = getCrossingMetadata(crossing);
  return metadata ? { ...crossing, metadata } : crossing;
}
