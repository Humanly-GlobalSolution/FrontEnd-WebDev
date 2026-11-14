import { requestJson } from "@/lib/httpClient";
import { SIGNAL_LABELS } from "@/lib/operator";
import { parseOrionCrossing } from "@/lib/orionCrossings";
import { readDetails } from "@/services/reviewRequests";
import type { OperatorCrossing, SignalState } from "@/types/operator";

function readCrossing(value: unknown): OperatorCrossing {
  const crossing = parseOrionCrossing(value, { code: "code", address: "address", width: "width", time: "currentSeconds" });
  const item = value as Record<string, unknown>;
  if ((item.signalState !== null && (typeof item.signalState !== "string" || !Object.hasOwn(SIGNAL_LABELS, item.signalState)))
    || (item.extensionSeconds !== null && (typeof item.extensionSeconds !== "number" || !Number.isInteger(item.extensionSeconds) || item.extensionSeconds < 0 || item.extensionSeconds > 15 || item.extensionSeconds % 3 !== 0))
    || (item.validReading !== null && typeof item.validReading !== "boolean") || typeof item.telemetryIssue !== "boolean") throw new Error("A telemetria retornou dados inválidos. Atualize a consulta.");
  return { ...crossing, signalState: item.signalState as SignalState | null, extensionSeconds: item.extensionSeconds as number | null, validReading: item.validReading as boolean | null, telemetryIssue: item.telemetryIssue };
}

export async function loadOperatorSnapshot(offset: number, signal: AbortSignal) {
  const [telemetry, orders] = await Promise.all([
    requestJson("/api/painel/cruzamentos", { signal, cache: "no-store" }, { fallbackMessage: "Não foi possível consultar o estado dos cruzamentos." }),
    requestJson(`/api/pedidos?limit=20&offset=${offset}`, { signal, cache: "no-store" }, { fallbackMessage: "Não foi possível consultar os pedidos dos cidadãos." }),
  ]);
  if (!Array.isArray(telemetry.crossings) || !Array.isArray(orders.requests) || !orders.pagination || typeof orders.pagination !== "object") throw new Error("O painel recebeu uma consulta incompleta. Tente novamente.");
  const pagination = orders.pagination as Record<string, unknown>;
  if (pagination.limit !== 20 || pagination.offset !== offset || (pagination.nextOffset !== null && (!Number.isInteger(pagination.nextOffset) || Number(pagination.nextOffset) !== offset + 20))) throw new Error("A paginação dos pedidos retornou dados inválidos.");
  return {
    crossings: telemetry.crossings.map(readCrossing), requests: orders.requests.map(readDetails),
    nextOffset: pagination.nextOffset as number | null, offset, receivedAt: new Date().toISOString(),
  };
}

export async function answerOperatorRequest(protocol: string, status: "em_analise" | "respondido", response = "") {
  const result = await requestJson(`/api/painel/pedidos/${encodeURIComponent(protocol)}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, response }),
  }, { fallbackMessage: "Não foi possível confirmar o atendimento. Atualize a consulta antes de tentar novamente." });
  return readDetails(result.request);
}
