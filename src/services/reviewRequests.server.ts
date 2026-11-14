import "server-only";
import { createHmac } from "node:crypto";
import { isValidProtocol, normalizeProtocol, PROTOCOL_ALPHABET, validateReviewDraft, type ReviewReason } from "@/lib/reviewRequests";
import { findCrossing, getCrossingsSource, listCrossingsServer } from "@/services/crossings.server";
import { OrionError, orionRequest } from "@/services/orion.server";
import type { Crossing } from "@/types/crossing";
import type { CreatedReviewRequest, ReviewRequestDetails, ReviewRequestDraft } from "@/types/reviewRequest";
import { validateOperatorResponse } from "@/lib/operator";

function requireOrion() {
  if (getCrossingsSource() !== "orion") throw new OrionError("Os pedidos exigem a conexão com o Orion. O modo demonstração não grava pedidos.", 503);
}
function requestType() { return process.env.ORION_REQUEST_TYPE || "PedidoRevisao"; }
function requestId(protocol: string) { return `urn:ngsi-ld:${requestType()}:${protocol}`; }

function parseReviewEntity(value: unknown, crossings: readonly Crossing[] = []): ReviewRequestDetails {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new OrionError("O Orion retornou um pedido inválido.");
  const entity = value as Record<string, unknown>;
  if (typeof entity.protocolo !== "string" || !isValidProtocol(entity.protocolo)
    || entity.id !== requestId(entity.protocolo) || entity.type !== requestType()
    || typeof entity.cruzamento_id !== "string" || !/^[a-zA-Z0-9_-]{1,40}$/.test(entity.cruzamento_id)
    || typeof entity.motivo !== "string" || typeof entity.comentario !== "string"
    || validateReviewDraft(entity.motivo, entity.comentario).reason || validateReviewDraft(entity.motivo, entity.comentario).comment
    || typeof entity.status !== "string" || !["enviado", "em_analise", "respondido"].includes(entity.status)
    || typeof entity.resposta !== "string"
    || typeof entity.criado_em !== "string" || Number.isNaN(Date.parse(entity.criado_em))
    || typeof entity.atualizado_em !== "string" || Number.isNaN(Date.parse(entity.atualizado_em))) throw new OrionError("O pedido não corresponde ao contrato oficial do projeto.");
  return {
    protocol: entity.protocolo, crossingCode: entity.cruzamento_id,
    address: crossings.find((crossing) => crossing.code === entity.cruzamento_id)?.address ?? `Cruzamento ${entity.cruzamento_id} (endereço não disponível)`,
    reason: entity.motivo as ReviewReason, comment: entity.comentario,
    status: entity.status as ReviewRequestDetails["status"], response: entity.resposta,
    createdAt: entity.criado_em, updatedAt: entity.atualizado_em,
  };
}

async function findReviewEntity(protocol: string): Promise<Record<string, unknown>> {
  requireOrion();
  const normalized = normalizeProtocol(protocol);
  if (!isValidProtocol(normalized)) throw new OrionError("Confira o protocolo no formato FA-XXXX-XXXX.", 400);
  const entity = await orionRequest(`v2/entities/${encodeURIComponent(requestId(normalized))}`, new URLSearchParams({ type: requestType(), options: "keyValues" })) as Record<string, unknown>;
  const parsed = parseReviewEntity(entity);
  if (parsed.protocol !== normalized) throw new OrionError("Não encontramos um pedido com esse protocolo.", 404);
  return entity;
}

export async function findReviewRequest(protocol: string): Promise<ReviewRequestDetails> {
  const entity = await findReviewEntity(protocol);
  const { crossings } = await listCrossingsServer();
  return parseReviewEntity(entity, crossings);
}

export async function listReviewRequests(limit: number, offset: number) {
  requireOrion();
  const entities = await orionRequest("v2/entities", new URLSearchParams({ type: requestType(), options: "keyValues", limit: String(limit), offset: String(offset), orderBy: "id" }));
  if (!Array.isArray(entities)) throw new OrionError("O Orion retornou uma lista de pedidos inválida.");
  const { crossings } = await listCrossingsServer();
  return { requests: entities.map((entity) => parseReviewEntity(entity, crossings)), pagination: { limit, offset, nextOffset: entities.length === limit && offset + limit <= 10000 ? offset + limit : null } };
}

function parseDraft(value: unknown): ReviewRequestDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new OrionError("Informe os dados do pedido.", 400);
  const data = value as Record<string, unknown>;
  if (Object.keys(data).some((key) => !["crossingCode", "reason", "comment"].includes(key))) throw new OrionError("O pedido contém campos desconhecidos.", 400);
  const comment = data.comment === undefined ? "" : data.comment;
  if (typeof data.crossingCode !== "string" || !/^[a-zA-Z0-9_-]{1,40}$/.test(data.crossingCode) || typeof data.reason !== "string" || typeof comment !== "string") throw new OrionError("Os dados do pedido são inválidos.", 400);
  const errors = validateReviewDraft(data.reason, comment);
  if (errors.reason || errors.comment) throw new OrionError(errors.reason || errors.comment || "Dados inválidos.", 400);
  return { crossingCode: data.crossingCode.toUpperCase(), reason: data.reason as ReviewReason, comment: comment.trim() };
}

// O HMAC gera oito símbolos criptograficamente pseudoaleatórios no servidor.
// A mesma chave UUID de envio recupera o protocolo sem novos atributos no Orion.
function protocolForKey(key: string) {
  const secret = process.env.REQUEST_PROTOCOL_SECRET;
  if (!secret || secret.length < 32) throw new OrionError("Configure REQUEST_PROTOCOL_SECRET com pelo menos 32 caracteres no servidor.", 503);
  const bytes = createHmac("sha256", secret).update(`farol-amigo/protocolo/v1:${key.toLowerCase()}`).digest();
  const code = Array.from(bytes.subarray(0, 8), (byte) => PROTOCOL_ALPHABET[byte & 31]).join("");
  return `FA-${code.slice(0, 4)}-${code.slice(4)}`;
}

export async function createReviewRequest(value: unknown, requestKey: string | null) {
  requireOrion();
  if (!requestKey || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey)) throw new OrionError("A chave do pedido é inválida. Recarregue a página e tente novamente.", 400);
  const draft = parseDraft(value);
  const protocol = protocolForKey(requestKey);
  const { crossing } = await findCrossing(draft.crossingCode);
  if (!crossing) throw new OrionError("O cruzamento não foi encontrado. Volte ao início e escolha um cruzamento disponível.", 404);
  const now = new Date().toISOString();
  try {
    await orionRequest("v2/entities", new URLSearchParams(), { method: "POST", body: {
      id: requestId(protocol), type: requestType(), protocolo: { type: "Text", value: protocol },
      cruzamento_id: { type: "Text", value: crossing.code }, motivo: { type: "Text", value: draft.reason },
      comentario: { type: "Text", value: draft.comment }, status: { type: "Text", value: "enviado" }, resposta: { type: "Text", value: "" },
      criado_em: { type: "DateTime", value: now }, atualizado_em: { type: "DateTime", value: now },
    } });
  } catch (error) {
    if (!(error instanceof OrionError) || error.status !== 409) throw error;
    const existing = parseReviewEntity(await findReviewEntity(protocol));
    if (existing.crossingCode !== crossing.code || existing.reason !== draft.reason || existing.comment !== draft.comment || existing.status !== "enviado") throw new OrionError("Este envio já foi registrado com outros dados ou andamento. Consulte o protocolo; para um novo pedido, altere as informações.", 409);
    return { request: { protocol, crossingCode: existing.crossingCode, status: "enviado", createdAt: existing.createdAt } satisfies CreatedReviewRequest, replayed: true };
  }
  const persisted = parseReviewEntity(await findReviewEntity(protocol));
  return { request: { protocol, crossingCode: crossing.code, status: "enviado", createdAt: persisted.createdAt } satisfies CreatedReviewRequest, replayed: false };
}

export async function updateReviewRequest(protocol: string, value: unknown): Promise<ReviewRequestDetails> {
  const existing = parseReviewEntity(await findReviewEntity(protocol));
  if (existing.status === "respondido") throw new OrionError("Este pedido já foi respondido e não pode mais ser editado.", 409);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new OrionError("Informe o motivo ou o comentário para editar.", 400);
  const fields = value as Record<string, unknown>;
  if (!Object.keys(fields).length || Object.keys(fields).some((key) => !["reason", "comment"].includes(key))) throw new OrionError("Somente motivo e comentário podem ser editados.", 400);
  const reason = fields.reason === undefined ? existing.reason : fields.reason;
  const comment = fields.comment === undefined ? existing.comment : fields.comment;
  if (typeof reason !== "string" || typeof comment !== "string") throw new OrionError("O motivo e o comentário devem ser textos.", 400);
  const errors = validateReviewDraft(reason, comment);
  if (errors.reason || errors.comment) throw new OrionError(errors.reason || errors.comment || "Dados inválidos.", 400);
  await orionRequest(`v2/entities/${encodeURIComponent(requestId(existing.protocol))}/attrs`, new URLSearchParams({ type: requestType() }), { method: "PATCH", body: {
    motivo: { type: "Text", value: reason }, comentario: { type: "Text", value: comment.trim() }, atualizado_em: { type: "DateTime", value: new Date().toISOString() },
  } });
  return findReviewRequest(existing.protocol);
}

export async function cancelReviewRequest(protocol: string) {
  const existing = parseReviewEntity(await findReviewEntity(protocol));
  if (existing.status === "respondido") throw new OrionError("Este pedido já foi respondido e não pode mais ser cancelado.", 409);
  await orionRequest(`v2/entities/${encodeURIComponent(requestId(existing.protocol))}`, new URLSearchParams({ type: requestType() }), { method: "DELETE" });
}

export async function answerReviewRequest(protocol: string, value: unknown): Promise<ReviewRequestDetails> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new OrionError("Informe a ação de atendimento.", 400);
  const fields = value as Record<string, unknown>;
  if (Object.keys(fields).some((key) => !["status", "response"].includes(key)) || typeof fields.status !== "string" || !["em_analise", "respondido"].includes(fields.status)) throw new OrionError("O operador pode iniciar a análise ou registrar uma resposta.", 400);
  if (fields.response !== undefined && typeof fields.response !== "string") throw new OrionError("A resposta deve ser um texto.", 400);
  const response = (fields.response as string | undefined) ?? "";
  if (fields.status === "respondido") {
    const error = validateOperatorResponse(response);
    if (error) throw new OrionError(error, 400);
  } else if (response.trim()) throw new OrionError("Registre a resposta ao concluir o atendimento.", 400);
  const existing = parseReviewEntity(await findReviewEntity(protocol));
  if (existing.status === "respondido") throw new OrionError("O pedido já foi respondido. Atualize a lista para conferir o atendimento.", 409);
  await orionRequest(`v2/entities/${encodeURIComponent(requestId(existing.protocol))}/attrs`, new URLSearchParams({ type: requestType() }), { method: "PATCH", body: {
    status: { type: "Text", value: fields.status }, atualizado_em: { type: "DateTime", value: new Date().toISOString() },
    ...(fields.status === "respondido" ? { resposta: { type: "Text", value: response.trim() } } : {}),
  } });
  return findReviewRequest(existing.protocol);
}
