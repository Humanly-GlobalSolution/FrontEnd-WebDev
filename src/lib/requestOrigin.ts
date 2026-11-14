// O Host representa o endereço solicitado pelo navegador; request.url pode
// usar o hostname interno com que o servidor Next foi iniciado.
export function isSameOriginRequest(request: Request): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true; // Mantém clientes HTTP sem Origin, sujeitos à autenticação.
  try {
    const url = new URL(request.url);
    const host = request.headers.get("host");
    if (host !== null && (!host || /[\s\\/?#@,]/.test(host))) return false;
    const expected = host === null ? url : new URL(`${url.protocol}//${host}`);
    const received = new URL(origin);
    if (!["http:", "https:"].includes(received.protocol) || received.username || received.password
      || received.pathname !== "/" || received.search || received.hash) return false;
    // Não confiar em X-Forwarded-Host recebido arbitrariamente do cliente.
    return received.origin === expected.origin;
  } catch {
    return false;
  }
}
