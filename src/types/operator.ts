import type { Crossing } from "@/types/crossing";

export type SignalState = "VERDE_CARROS" | "PEDIDO" | "VERDE_PEDESTRE" | "TEMPO_ESTENDIDO" | "FALHA";
export type OperatorCrossing = Crossing & {
  signalState: SignalState | null;
  extensionSeconds: number | null;
  validReading: boolean | null;
  telemetryIssue: boolean;
};
