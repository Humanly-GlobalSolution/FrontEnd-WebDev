export const CARTOES = {
  senior: { perfil: "idoso", ritmo: 0.75, rotulo: "Bilhete Único Sênior", publico: "Pessoa idosa" },
  especial: { perfil: "pcd", ritmo: 0.6, rotulo: "Bilhete Único Especial", publico: "Pessoa com deficiência" },
} as const;
export const PASSO_EXTENSAO_S = 3;
export const TETO_EXTENSAO_S = 15;
export const ESPERA_MAXIMA_S = 90;
export type Perfil = "idoso" | "pcd" | "outro";
export const PERFIS = { idoso: CARTOES.senior.publico, pcd: CARTOES.especial.publico, outro: "Prefiro não dizer" } as const;
export function perfilValido(value: unknown): value is Perfil {
  return typeof value === "string" && Object.hasOwn(PERFIS, value);
}
export function tempoNecessario(largura: number, ritmo: number): number {
  if (!Number.isFinite(largura) || largura <= 0 || !Number.isFinite(ritmo) || ritmo <= 0) throw new RangeError("Largura e ritmo devem ser positivos.");
  // Evita que 27,6/0,6 = 46,00000000000001 seja arredondado para 47.
  return Math.ceil(Number((largura / ritmo).toFixed(6)));
}
export function tempoGarantido(largura: number, verdeAtual: number, tipo: keyof typeof CARTOES): number {
  return Math.max(verdeAtual, tempoNecessario(largura, CARTOES[tipo].ritmo));
}
export function tempoFalhaSensor(largura: number, verdeAtual: number): number {
  return tempoGarantido(largura, verdeAtual, "especial");
}
export function ondeParaNoFimDoVerde(largura: number, verdeAtual: number, ritmo: number): number {
  return Math.min(largura, ritmo * verdeAtual);
}
