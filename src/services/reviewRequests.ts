import type { CreatedReviewRequest, ReviewRequestDetails, ReviewRequestDraft, ReviewRequestEdit } from "@/types/reviewRequest";

export async function sendReviewRequest(draft: ReviewRequestDraft, key: string): Promise<CreatedReviewRequest> {
  const response = await fetch("/api/pedidos", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key }, body: JSON.stringify(draft) });
  const result = await response.json();
  if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Não foi possível enviar. Tente novamente sem sair desta página.");
  if (typeof result.request?.protocol !== "string" || result.request.status !== "enviado") throw new Error("A confirmação não pôde ser lida. Tente novamente nesta página para recuperar seu protocolo.");
  return result.request as CreatedReviewRequest;
}

export async function editReviewRequest(protocol: string, changes: ReviewRequestEdit): Promise<ReviewRequestDetails> {
  const response = await fetch(`/api/pedidos/${encodeURIComponent(protocol)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) });
  const result = await response.json();
  if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Não foi possível salvar as alterações. Tente novamente.");
  if (typeof result.request?.protocol !== "string") throw new Error("Não foi possível ler a confirmação. Consulte o pedido novamente.");
  return result.request as ReviewRequestDetails;
}

export async function fetchReviewRequest(protocol: string): Promise<ReviewRequestDetails> {
  const response = await fetch(`/api/pedidos/${encodeURIComponent(protocol)}`, { cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Não foi possível consultar o pedido. Tente novamente.");
  if (typeof result.request?.protocol !== "string" || !["enviado", "em_analise", "respondido"].includes(result.request.status)) throw new Error("O pedido retornou uma resposta inválida.");
  return result.request as ReviewRequestDetails;
}
