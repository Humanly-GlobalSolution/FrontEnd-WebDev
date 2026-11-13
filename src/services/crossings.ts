import { demoCrossings } from "@/data/demoCrossings";
import type { Crossing } from "@/types/crossing";

// Fonte provisória explícita. A integração com Orion substituirá este acesso.
export async function listCrossings(signal?: AbortSignal): Promise<Crossing[]> {
  signal?.throwIfAborted();
  return demoCrossings.map((crossing) => ({ ...crossing }));
}

export async function findCrossing(code: string): Promise<Crossing | undefined> {
  const crossings = await listCrossings();
  return crossings.find((crossing) => crossing.code.toUpperCase() === code.toUpperCase());
}
