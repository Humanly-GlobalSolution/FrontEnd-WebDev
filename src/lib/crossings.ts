import type { Crossing } from "../types/crossing";

export const REFERENCE_WALKING_SPEED = 0.75;

export function calculateCrossingSeconds(width: number): number {
  if (!Number.isFinite(width) || width <= 0) {
    throw new RangeError("A largura da travessia deve ser um número positivo.");
  }
  return Math.ceil(width / REFERENCE_WALKING_SPEED);
}

function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").replace(/[^a-z0-9]+/g, " ").trim();
}

export function filterCrossings(crossings: Crossing[], query: string): Crossing[] {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  return crossings.filter((crossing) => {
    const searchable = normalizeSearch(`${crossing.code} ${crossing.address}`);
    return terms.every((term) => searchable.includes(term));
  });
}
