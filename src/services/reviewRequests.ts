import type { CreatedReviewRequest, ReviewRequestDraft } from "@/types/reviewRequest";

export async function sendReviewRequest(draft: ReviewRequestDraft, key: string): Promise<CreatedReviewRequest> {
  const response = await fetch("/api/pedidos", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key }, body: JSON.stringify(draft) });
  const result = await response.json();
  if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Não foi possível enviar. Tente novamente sem sair desta página.");
  if (typeof result.request?.protocol !== "string" || result.request.status !== "enviado") throw new Error("A confirmação não pôde ser lida. Tente novamente nesta página para recuperar seu protocolo.");
  return result.request as CreatedReviewRequest;
}
