import "server-only";

export class OrionError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
    this.name = "OrionError";
  }
}

export async function orionRequest(path: string, query: URLSearchParams = new URLSearchParams(), init: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown } = {}): Promise<unknown> {
  const base = process.env.ORION_BASE_URL;
  if (!base) throw new OrionError("O endereço do Orion ainda não foi configurado no servidor.", 503);

  let url: URL;
  try {
    url = new URL(`${base.replace(/\/$/, "")}/${path}`);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error();
    url.search = query.toString();
  } catch {
    throw new OrionError("A configuração do endereço do Orion é inválida.", 503);
  }

  const headers = new Headers({ Accept: "application/json" });
  if (init.body !== undefined) headers.set("Content-Type", "application/json");
  if (process.env.ORION_FIWARE_SERVICE) headers.set("Fiware-Service", process.env.ORION_FIWARE_SERVICE);
  if (process.env.ORION_FIWARE_SERVICEPATH) headers.set("Fiware-ServicePath", process.env.ORION_FIWARE_SERVICEPATH);
  if (process.env.ORION_AUTH_TOKEN) headers.set("Authorization", `Bearer ${process.env.ORION_AUTH_TOKEN}`);

  let response: Response;
  try {
    response = await fetch(url, { method: init.method ?? "GET", body: init.body === undefined ? undefined : JSON.stringify(init.body), headers, cache: "no-store", signal: AbortSignal.timeout(8000), redirect: "error" });
  } catch {
    throw new OrionError("Não foi possível conectar ao Orion. Tente novamente em instantes.");
  }
  if (!response.ok) {
    if (response.status === 404) throw new OrionError("Cruzamento não encontrado.", 404);
    if (response.status === 409 || response.status === 422) throw new OrionError("Já existe um cruzamento com este identificador ou a operação conflita com os dados existentes.", 409);
    throw new OrionError("O Orion não conseguiu atender à operação. Verifique o serviço e suas credenciais.");
  }
  if (response.status === 204 || response.headers.get("content-length") === "0") return null;
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new OrionError("O Orion retornou uma resposta inválida.");
  }
}
