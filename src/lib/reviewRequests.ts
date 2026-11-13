export const REVIEW_REASONS = [
  { value: "tempo_curto", label: "O tempo acaba antes de eu terminar de atravessar" },
  { value: "falta_som", label: "Não sei quando posso atravessar: falta som" },
  { value: "equipamento", label: "O botão ou o leitor de cartão não funciona" },
  { value: "outro", label: "Outro motivo" },
] as const;

export type ReviewReason = (typeof REVIEW_REASONS)[number]["value"];
export const MAX_COMMENT_LENGTH = 500;

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
