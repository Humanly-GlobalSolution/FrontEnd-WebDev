export type CrossingInput = { code: string; address: string; width: number; currentSeconds: number };

export function validateCrossingInput(value: unknown): CrossingInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Envie um objeto JSON com code, address, width e currentSeconds.");
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => !["code", "address", "width", "currentSeconds"].includes(key))) throw new Error("O corpo contém campos desconhecidos.");
  if (typeof input.code !== "string" || !/^[a-zA-Z0-9_-]{1,40}$/.test(input.code)) throw new Error("O código deve conter até 40 letras, números, hífens ou sublinhados.");
  if (typeof input.address !== "string" || !input.address.trim() || input.address.trim().length > 300) throw new Error("Informe um endereço com até 300 caracteres.");
  if (typeof input.width !== "number" || !Number.isFinite(input.width) || input.width <= 0 || input.width > 1000) throw new Error("A largura deve ser um número maior que zero e até 1000 metros.");
  if (typeof input.currentSeconds !== "number" || !Number.isFinite(input.currentSeconds) || input.currentSeconds <= 0 || input.currentSeconds > 3600) throw new Error("O tempo deve ser um número maior que zero e até 3600 segundos.");
  return { code: input.code.toUpperCase(), address: input.address.trim(), width: input.width, currentSeconds: input.currentSeconds };
}
