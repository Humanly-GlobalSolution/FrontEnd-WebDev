export const REVIEW_REASONS = [
  { value: "tempo_curto", label: "O tempo acaba antes de eu terminar de atravessar" },
  { value: "falta_som", label: "Não sei quando posso atravessar: falta som" },
  { value: "botao_cartao", label: "O botão ou o leitor de cartão não funciona" },
  { value: "outro", label: "Outro motivo" },
] as const;

export type ReviewReason = (typeof REVIEW_REASONS)[number]["value"];
export const MAX_COMMENT_LENGTH = 280;
export const PROTOCOL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizeProtocol(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidProtocol(value: string): boolean {
  return /^FA-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(normalizeProtocol(value));
}

export function validateReviewDraft(reason: string, comment: string) {
  return {
    reason: REVIEW_REASONS.some((item) => item.value === reason)
      ? null
      : "Escolha o que acontece neste farol.",
    comment: comment.length > MAX_COMMENT_LENGTH
      ? `Escreva um comentário com até ${MAX_COMMENT_LENGTH} caracteres.`
      : /[<>"'=;()]/.test(comment) ? "O comentário não pode ter estes símbolos: < > \" ' = ; ( )" : null,
  };
}
