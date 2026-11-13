export const REVIEW_REASONS = [
  { value: "tempo_curto", label: "O tempo acaba antes de eu terminar de atravessar" },
  { value: "falta_som", label: "Não sei quando posso atravessar: falta som" },
  { value: "equipamento", label: "O botão ou o leitor de cartão não funciona" },
  { value: "outro", label: "Outro motivo" },
] as const;

export type ReviewReason = (typeof REVIEW_REASONS)[number]["value"];
export const MAX_COMMENT_LENGTH = 500;

export function normalizeProtocol(value: string): string {
  return value.trim().toUpperCase();
}

export function requestKeyFromProtocol(value: string): string | null {
  const match = /^FA-\d{2}(?:0[1-9]|1[0-2])-([A-F0-9]{32})$/.exec(normalizeProtocol(value));
  if (!match) return null;
  const hex = match[1].toLowerCase();
  const key = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(key) ? key : null;
}

export function validateReviewDraft(reason: string, comment: string) {
  return {
    reason: REVIEW_REASONS.some((item) => item.value === reason)
      ? null
      : "Escolha o que acontece neste farol.",
    comment: comment.trim().length > MAX_COMMENT_LENGTH
      ? `Escreva um comentário com até ${MAX_COMMENT_LENGTH} caracteres.`
      : null,
  };
}
