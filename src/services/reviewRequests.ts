import type { CreatedReviewRequest, ReviewRequestDetails, ReviewRequestDraft, ReviewRequestEdit } from "@/types/reviewRequest";
import { HttpClientError, requestJson } from "@/lib/httpClient";
import { requestKeyFromProtocol, validateReviewDraft } from "@/lib/reviewRequests";

function readDetails(value: unknown): ReviewRequestDetails {
  if (!value || typeof value !== "object") throw new Error("O pedido retornou uma resposta inválida. Consulte o protocolo novamente.");
  const item = value as Record<string, unknown>;
  if (typeof item.protocol !== "string" || !requestKeyFromProtocol(item.protocol)
    || typeof item.crossingCode !== "string" || typeof item.address !== "string"
    || typeof item.reason !== "string" || typeof item.comment !== "string" || validateReviewDraft(item.reason, item.comment).reason
    || !["enviado", "em_analise", "respondido"].includes(String(item.status))
    || typeof item.createdAt !== "string" || Number.isNaN(Date.parse(item.createdAt))
    || ["reviewedAt", "answeredAt"].some((key) => item[key] !== undefined && (typeof item[key] !== "string" || Number.isNaN(Date.parse(item[key] as string))))
    || (item.response !== undefined && typeof item.response !== "string")) throw new Error("O pedido retornou dados inválidos. Consulte o protocolo novamente.");
  return item as ReviewRequestDetails;
}

export async function sendReviewRequest(draft: ReviewRequestDraft, key: string): Promise<CreatedReviewRequest> {
  const result = await requestJson("/api/pedidos", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key }, body: JSON.stringify(draft) }, { fallbackMessage: "A confirmação do envio não pôde ser lida. Tente novamente nesta página para recuperar seu protocolo." });
  const item = result.request as CreatedReviewRequest | undefined;
  if (!item || typeof item.protocol !== "string" || !requestKeyFromProtocol(item.protocol) || item.status !== "enviado" || typeof item.crossingCode !== "string" || typeof item.createdAt !== "string" || Number.isNaN(Date.parse(item.createdAt))) throw new Error("A confirmação não pôde ser lida. Tente novamente nesta página para recuperar seu protocolo.");
  return item;
}

export async function editReviewRequest(protocol: string, changes: ReviewRequestEdit): Promise<ReviewRequestDetails> {
  const result = await requestJson(`/api/pedidos/${encodeURIComponent(protocol)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) }, { fallbackMessage: "Não foi possível confirmar a alteração. Consulte o protocolo antes de tentar novamente." });
  return readDetails(result.request);
}

export async function fetchReviewRequest(protocol: string): Promise<ReviewRequestDetails> {
  const result = await requestJson(`/api/pedidos/${encodeURIComponent(protocol)}`, { cache: "no-store" }, { fallbackMessage: "Não foi possível ler o pedido. Tente consultar o protocolo novamente." });
  return readDetails(result.request);
}

export async function deleteReviewRequest(protocol: string): Promise<void> {
  try {
    await requestJson(`/api/pedidos/${encodeURIComponent(protocol)}`, { method: "DELETE", headers: { "X-Confirm-Cancel": "true" } }, { expectedStatus: 204, fallbackMessage: "Não foi possível confirmar o cancelamento. Consulte o pedido antes de tentar novamente." });
  } catch (error) {
    if (error instanceof HttpClientError && error.status === 404) throw new Error("O pedido não foi encontrado. Ele pode já ter sido cancelado. Feche esta janela e consulte o protocolo para conferir.");
    throw error;
  }
}
