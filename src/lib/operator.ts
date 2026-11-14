export const SIGNAL_LABELS = {
  VERDE_CARROS: "Verde para carros",
  PEDIDO: "Travessia solicitada",
  VERDE_PEDESTRE: "Verde para pedestres",
  TEMPO_ESTENDIDO: "Tempo estendido",
  FALHA: "Falha no sensor",
} as const;

export const MAX_RESPONSE_LENGTH = 2000;

export function validateOperatorResponse(value: string) {
  if (!value.trim()) return "Escreva uma resposta antes de concluir o atendimento.";
  if (value.length > MAX_RESPONSE_LENGTH) return `A resposta pode ter até ${MAX_RESPONSE_LENGTH} caracteres.`;
  if (/[<>"'=;()]/.test(value)) return "Retire < > aspas simples ou duplas, = ; ( ) da resposta. O Orion não aceita esses símbolos.";
  return null;
}
