export const SIGNAL_LABELS = {
  VERDE_CARROS: "Verde dos carros",
  PEDIDO: "Pedido",
  VERDE_PEDESTRE: "Verde do pedestre",
  TEMPO_ESTENDIDO: "Tempo estendido",
  FALHA: "Falha",
} as const;

export const MAX_RESPONSE_LENGTH = 2000;

export function validateOperatorResponse(value: string) {
  if (!value.trim()) return "Escreva uma resposta antes de concluir o atendimento.";
  if (value.length > MAX_RESPONSE_LENGTH) return `A resposta pode ter até ${MAX_RESPONSE_LENGTH} caracteres.`;
  if (/[<>"'=;()]/.test(value)) return "Retire < > aspas simples ou duplas, = ; ( ) da resposta. O Orion não aceita esses símbolos.";
  return null;
}
