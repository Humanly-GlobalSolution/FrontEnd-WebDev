import type { Crossing } from "@/types/crossing";

// Endereços de referência; códigos, larguras e tempos são dados acadêmicos simulados.
export const demoCrossings: readonly Crossing[] = [
  { id: "demo-c01", code: "C01", address: "Av. Paulista × Al. Joaquim Eugênio de Lima", width: 30, currentSeconds: 20 },
  { id: "demo-c02", code: "C02", address: "Av. Paulista × R. Pamplona", width: 28, currentSeconds: 20 },
  { id: "demo-c03", code: "C03", address: "Av. Paulista × R. Augusta", width: 30, currentSeconds: 22 },
  { id: "demo-c04", code: "C04", address: "R. Vergueiro × R. do Paraíso", width: 18, currentSeconds: 15 },
  { id: "demo-c05", code: "C05", address: "R. da Consolação × R. Maria Antônia", width: 16, currentSeconds: 14 },
];
