import "server-only";
import { normalizeProtocol, requestKeyFromProtocol, validateReviewDraft, type ReviewReason } from "@/lib/reviewRequests";
import { findCrossing, getCrossingsSource } from "@/services/crossings.server";
import { OrionError, orionRequest } from "@/services/orion.server";
import type { CreatedReviewRequest, ReviewRequestDetails, ReviewRequestDraft } from "@/types/reviewRequest";

export async function findReviewRequest(protocol: string): Promise<ReviewRequestDetails> {
  if (getCrossingsSource() !== "orion") throw new OrionError("A consulta de pedidos exige a conexão com o Orion.", 503);
  const normalized = normalizeProtocol(protocol);
  const key = requestKeyFromProtocol(normalized);
  if (!key) throw new OrionError("Confira o protocolo completo, incluindo FA, os números e as letras.", 400);
  const type = process.env.ORION_REQUEST_TYPE || "PedidoRevisao";
  let entity: Record<string, unknown>;
  try {
    entity = await orionRequest(`v2/entities/${encodeURIComponent(`urn:ngsi-ld:${type}:${key}`)}`, new URLSearchParams({ type, options: "keyValues" })) as Record<string, unknown>;
  } catch (error) {
    if (error instanceof OrionError && error.status === 404) throw new OrionError("Não encontramos um pedido com esse protocolo. Confira o número e tente novamente.", 404);
    throw error;
  }
  if (!entity || typeof entity !== "object" || Array.isArray(entity)) throw new OrionError("O serviço retornou um pedido inválido. Tente novamente mais tarde.");
  if (entity.protocolo !== normalized) throw new OrionError("Não encontramos um pedido com esse protocolo.", 404);
  const status = entity.status;
  if (!["enviado", "em_analise", "respondido"].includes(String(status))
    || typeof entity.codigoCruzamento !== "string" || typeof entity.endereco !== "string"
    || typeof entity.motivo !== "string" || typeof entity.comentario !== "string"
    || validateReviewDraft(entity.motivo, entity.comentario).reason
    || typeof entity.data !== "string" || Number.isNaN(Date.parse(entity.data))) throw new OrionError("O pedido retornou dados inválidos. Tente novamente mais tarde.");

  function optionalText(key: string) {
    const value = entity[key];
    if (value === undefined || value === null || value === "") return undefined;
    if (typeof value !== "string") throw new OrionError("O pedido retornou dados de andamento inválidos.");
    return value;
  }
  function optionalDate(key: string) {
    const value = optionalText(key);
    if (value && Number.isNaN(Date.parse(value))) throw new OrionError("O pedido retornou uma data de andamento inválida.");
    return value;
  }
  return {
    protocol: normalized, crossingCode: entity.codigoCruzamento, address: entity.endereco,
    reason: entity.motivo as ReviewReason, comment: entity.comentario,
    status: status as ReviewRequestDetails["status"], createdAt: entity.data,
    response: optionalText("resposta"), reviewedAt: optionalDate("dataAnalise"), answeredAt: optionalDate("dataResposta"),
  };
}

function parseDraft(value: unknown): ReviewRequestDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new OrionError("Informe os dados do pedido.", 400);
  const data = value as Record<string, unknown>;
  if (Object.keys(data).some((key) => !["crossingCode", "reason", "comment"].includes(key))) throw new OrionError("O pedido contém campos desconhecidos.", 400);
  if (typeof data.crossingCode !== "string" || !/^[a-zA-Z0-9_-]{1,40}$/.test(data.crossingCode) || typeof data.reason !== "string" || typeof data.comment !== "string") throw new OrionError("Os dados do pedido são inválidos.", 400);
  const errors = validateReviewDraft(data.reason, data.comment);
  if (errors.reason || errors.comment || data.comment.length > 500) throw new OrionError(errors.reason || errors.comment || "O comentário deve ter até 500 caracteres.", 400);
  return { crossingCode: data.crossingCode.toUpperCase(), reason: data.reason as ReviewReason, comment: data.comment.trim() };
}

export async function updateReviewRequest(protocol: string, value: unknown): Promise<ReviewRequestDetails> {
  const existing = await findReviewRequest(protocol);
  if (existing.status === "respondido") throw new OrionError("Este pedido já foi respondido e não pode mais ser editado.", 409);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new OrionError("Informe o motivo ou o comentário para editar.", 400);
  const fields = value as Record<string, unknown>;
  if (!Object.keys(fields).length || Object.keys(fields).some((key) => !["reason", "comment"].includes(key))) throw new OrionError("Somente motivo e comentário podem ser editados.", 400);
  const reason = fields.reason === undefined ? existing.reason : fields.reason;
  const comment = fields.comment === undefined ? existing.comment : fields.comment;
  if (typeof reason !== "string" || typeof comment !== "string") throw new OrionError("O motivo e o comentário devem ser textos.", 400);
  const errors = validateReviewDraft(reason, comment);
  if (errors.reason || errors.comment || comment.length > 500) throw new OrionError(errors.reason || errors.comment || "O comentário deve ter até 500 caracteres.", 400);
  const type = process.env.ORION_REQUEST_TYPE || "PedidoRevisao";
  const id = `urn:ngsi-ld:${type}:${requestKeyFromProtocol(existing.protocol)}`;
  await orionRequest(`v2/entities/${encodeURIComponent(id)}/attrs`, new URLSearchParams({ type }), { method: "PATCH", body: {
    motivo: { type: "Text", value: reason },
    comentario: { type: "Text", value: comment.trim() },
  } });
  return findReviewRequest(existing.protocol);
}

export async function cancelReviewRequest(protocol: string) {
  const existing = await findReviewRequest(protocol);
  if (existing.status === "respondido") throw new OrionError("Este pedido já foi respondido e não pode mais ser cancelado.", 409);
  const type = process.env.ORION_REQUEST_TYPE || "PedidoRevisao";
  const id = `urn:ngsi-ld:${type}:${requestKeyFromProtocol(existing.protocol)}`;
  await orionRequest(`v2/entities/${encodeURIComponent(id)}`, new URLSearchParams({ type }), { method: "DELETE" });
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
    const persisted = await findReviewRequest(created.protocol);
    return { request: { ...created, createdAt: persisted.createdAt }, replayed: false };
  } catch (error) {
    if (!(error instanceof OrionError) || error.status !== 409) throw error;
    const stored = await orionRequest(`v2/entities/${encodeURIComponent(id)}`, new URLSearchParams({ type, options: "keyValues" })) as Record<string, unknown>;
    if (!stored || stored.cruzamento !== crossing.id || stored.motivo !== draft.reason || stored.comentario !== draft.comment) throw new OrionError("Esta chave já foi usada para outro pedido. Altere as informações antes de enviar novamente.", 409);
    if (typeof stored.protocolo !== "string" || typeof stored.data !== "string") throw new OrionError("O pedido existente retornou dados inválidos.");
    return { request: { protocol: stored.protocolo, crossingCode: crossing.code, status: "enviado", createdAt: stored.data } satisfies CreatedReviewRequest, replayed: true };
  }
}
