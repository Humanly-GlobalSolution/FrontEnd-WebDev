export class HttpClientError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "HttpClientError";
    this.status = status;
  }
}

type RequestOptions = { fallbackMessage: string; timeoutMs?: number; expectedStatus?: number };

export async function requestJson(url: string, init: RequestInit, { fallbackMessage, timeoutMs = 20000, expectedStatus }: RequestOptions): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const externalSignal = init.signal;
  const abort = () => controller.abort();
  if (externalSignal?.aborted) controller.abort();
  externalSignal?.addEventListener("abort", abort, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (expectedStatus === 204 && response.status === 204) return {};
    const text = await response.text();
    let data: unknown;
    try { data = JSON.parse(text); }
    catch { throw new HttpClientError(fallbackMessage, response.status); }
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new HttpClientError(fallbackMessage, response.status);
    const result = data as Record<string, unknown>;
    if (!response.ok) throw new HttpClientError(typeof result.error === "string" && result.error.trim() && result.error.length <= 500 ? result.error : fallbackMessage, response.status);
    if (expectedStatus !== undefined && response.status !== expectedStatus) throw new HttpClientError(fallbackMessage, response.status);
    return result;
  } catch (error) {
    if (externalSignal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (timedOut) throw new HttpClientError("A operação demorou mais que o esperado. Tente novamente nesta página; se estava alterando ou cancelando um pedido, consulte o protocolo para conferir o resultado.");
    if (error instanceof HttpClientError) throw error;
    throw new HttpClientError("Não foi possível conectar ao site. Confira sua conexão e tente novamente sem sair desta página.");
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener("abort", abort);
  }
}
