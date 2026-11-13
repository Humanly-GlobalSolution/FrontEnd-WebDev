import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const template = await readFile(new URL("../.env.example", import.meta.url), "utf8");
const target = new URL("../.env.local", import.meta.url);
try {
  await writeFile(target, template.replace(/^ADMIN_API_TOKEN=$/m, `ADMIN_API_TOKEN=${randomBytes(32).toString("hex")}`), { flag: "wx", mode: 0o600 });
  console.log(".env.local criado para Orion local. Token administrativo gerado sem exibição. Reinicie o Next.js se já estiver aberto.");
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  console.log(".env.local já existe e foi preservado. Confira a configuração local sem publicar o token.");
}
