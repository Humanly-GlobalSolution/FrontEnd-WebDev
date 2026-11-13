import "server-only";
import { validateReviewDraft, type ReviewReason } from "@/lib/reviewRequests";
import { findCrossing, getCrossingsSource } from "@/services/crossings.server";
import { OrionError, orionRequest } from "@/services/orion.server";
import type { CreatedReviewRequest, ReviewRequestDraft } from "@/types/reviewRequest";

function parseDraft(value: unknown): ReviewRequestDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new OrionError("Informe os dados do pedido.", 400);
  const data = value as Record<string, unknown>;
  if (Object.keys(data).some((key) => !["crossingCode", "reason", "comment"].includes(key))) throw new OrionError("O pedido contém campos desconhecidos.", 400);
  if (typeof data.crossingCode !== "string" || !/^[a-zA-Z0-9_-]{1,40}$/.test(data.crossingCode) || typeof data.reason !== "string" || typeof data.comment !== "string") throw new OrionError("Os dados do pedido são inválidos.", 400);
  const errors = validateReviewDraft(data.reason, data.comment);
  if (errors.reason || errors.comment || data.comment.length > 500) throw new OrionError(errors.reason || errors.comment || "O comentário deve ter até 500 caracteres.", 400);
  return { crossingCode: data.crossingCode.toUpperCase(), reason: data.reason as ReviewReason, comment: data.comment.trim() };
}

export async function createReviewRequest(value: unknown, requestKey: string | null) {
  if (getCrossingsSource() !== "orion") throw new OrionError("O envio exige a conexão com o Orion. O modo demonstração não grava pedidos.", 503);
  if (!requestKey || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey)) throw new OrionError("A chave do pedido é inválida. Recarregue a página e tente novamente.", 400);
  const draft = parseDraft(value);
  const { crossing } = await findCrossing(draft.crossingCode);
  if (!crossing) throw new OrionError("O cruzamento não foi encontrado. Volte ao início e escolha um cruzamento disponível.", 404);
  const type = process.env.ORION_REQUEST_TYPE || "PedidoRevisao";
  const id = `urn:ngsi-ld:${type}:${requestKey.toLowerCase()}`;
  const now = new Date();
  const month = `${now.getUTCFullYear().toString().slice(-2)}${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const created: CreatedReviewRequest = { protocol: `FA-${month}-${requestKey.replaceAll("-", "").toUpperCase()}`, crossingCode: crossing.code, status: "enviado", createdAt: now.toISOString() };
  try {
    await orionRequest("v2/entities", new URLSearchParams(), { method: "POST", body: {
      id, type,
      protocolo: { type: "Text", value: created.protocol },
      cruzamento: { type: "Relationship", value: crossing.id },
      codigoCruzamento: { type: "Text", value: crossing.code },
      endereco: { type: "Text", value: crossing.address },
      motivo: { type: "Text", value: draft.reason },
      comentario: { type: "Text", value: draft.comment },
      status: { type: "Text", value: created.status },
      data: { type: "DateTime", value: created.createdAt },
    } });
    return { request: created, replayed: false };
  } catch (error) {
    if (!(error instanceof OrionError) || error.status !== 409) throw error;
    const stored = await orionRequest(`v2/entities/${encodeURIComponent(id)}`, new URLSearchParams({ type, options: "keyValues" })) as Record<string, unknown>;
    if (!stored || stored.cruzamento !== crossing.id || stored.motivo !== draft.reason || stored.comentario !== draft.comment) throw new OrionError("Esta chave já foi usada para outro pedido. Altere as informações antes de enviar novamente.", 409);
    if (typeof stored.protocolo !== "string" || typeof stored.data !== "string") throw new OrionError("O pedido existente retornou dados inválidos.");
    return { request: { protocol: stored.protocolo, crossingCode: crossing.code, status: "enviado", createdAt: stored.data } satisfies CreatedReviewRequest, replayed: true };
  }
}
