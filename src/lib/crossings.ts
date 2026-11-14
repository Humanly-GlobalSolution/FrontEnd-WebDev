import type { Crossing } from "../types/crossing";

export const REFERENCE_WALKING_SPEED = 0.75;
export const EXTENSION_STEP_SECONDS = 3;
export const MAX_EXTENSION_SECONDS = 15;

export function calculateCrossingSeconds(width: number): number {
  if (!Number.isFinite(width) || width <= 0) {
    throw new RangeError("A largura da travessia deve ser um número positivo.");
  }
  return Math.ceil(width / REFERENCE_WALKING_SPEED);
}

export const WALKING_SPEEDS = { adult: 1.2, elderly: 0.75, reducedMobility: 0.6 } as const;
export type WalkingProfile = keyof typeof WALKING_SPEEDS;
export type CrossingActivation = "button" | "sensor" | "card";

export function compareCrossing(width: number, currentSeconds: number, extended: boolean, profile: WalkingProfile = "elderly", activation: CrossingActivation = "card", code?: string) {
  const referenceSeconds = calculateCrossingSeconds(width);
  if (!Number.isFinite(currentSeconds) || currentSeconds <= 0) {
    throw new RangeError("O tempo atual deve ser um número positivo.");
  }
  if (!Object.hasOwn(WALKING_SPEEDS, profile) || !["button", "sensor", "card"].includes(activation)) throw new RangeError("Perfil ou acionamento inválido.");
  const speed = WALKING_SPEEDS[profile];
  const requiredSeconds = width / speed;
  // Os três acionamentos usam a mesma base, conforme ajuste solicitado pela equipe.
  // No piloto C01, os perfis idoso/PcD partem de uma garantia acessível.
  // Essa garantia não integra o teto de 15 s da extensão por presença.
  const accessiblePilot = code?.toUpperCase() === "C01" && profile !== "adult";
  const guaranteedSeconds = accessiblePilot ? Math.max(currentSeconds, referenceSeconds) : currentSeconds;
  const missingSeconds = Math.max(0, requiredSeconds - guaranteedSeconds);
  const extraSeconds = Math.min(MAX_EXTENSION_SECONDS, Math.ceil(missingSeconds / EXTENSION_STEP_SECONDS) * EXTENSION_STEP_SECONDS);
  const proposedSeconds = guaranteedSeconds + extraSeconds;
  const seconds = extended ? proposedSeconds : currentSeconds;
  const adultDistance = Math.min(width, seconds * 1.2);
  const referenceDistance = Math.min(width, seconds * speed);

  return {
    seconds,
    referenceSeconds,
    proposedSeconds,
    extraSeconds,
    speed,
    requiredSeconds,
    guaranteedSeconds,
    missingSeconds,
    alert: extended && proposedSeconds * speed < width - 0.000000001,
    adultDistance,
    referenceDistance,
    adultRemaining: Math.max(0, width - adultDistance),
    referenceRemaining: Math.max(0, width - referenceDistance),
    adultPercent: (adultDistance / width) * 100,
    referencePercent: (referenceDistance / width) * 100,
  };
}

export function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").replace(/[^a-z0-9]+/g, " ").trim();
}

export function filterCrossings(crossings: Crossing[], query: string): Crossing[] {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  return crossings.filter((crossing) => {
    const searchable = normalizeSearch(`${crossing.code} ${crossing.address}`);
    return terms.every((term) => searchable.includes(term));
  });
}
