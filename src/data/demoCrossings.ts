import type { Crossing } from "@/types/crossing";
import { crossingCatalog } from "@/data/crossingCatalog";

// Os registros do catálogo distinguem as larguras medidas dos tempos estimados.
export const demoCrossings: readonly Crossing[] = [
  { id: "demo-c01", code: "C01", address: "Av. Paulista × Al. Joaquim Eugênio de Lima", width: 30, currentSeconds: 20 },
  { ...crossingCatalog.C02, id: "demo-c02" },
  { ...crossingCatalog.C03, id: "demo-c03" },
  { id: "demo-c04", code: "C04", address: "Av. Paulista × Av. Brigadeiro Luís Antônio", width: 19.5, currentSeconds: 24 },
  { ...crossingCatalog.C05, id: "demo-c05" },
];
