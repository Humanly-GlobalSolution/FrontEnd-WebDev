import "server-only";
import { OrionError } from "@/services/orion.server";
import { validAdminBearer, validOperatorSession } from "@/services/operatorSession.server";

export function requireAdmin(request: Request) {
  if (!validAdminBearer(request) && !validOperatorSession(request)) throw new OrionError("Acesso administrativo não autorizado. Entre novamente no painel.", 401);
}
