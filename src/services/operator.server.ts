import "server-only";
import { getCrossingsSource, listCrossingEntitiesServer } from "@/services/crossings.server";
import { OrionError } from "@/services/orion.server";
import { SIGNAL_LABELS } from "@/lib/operator";
import type { OperatorCrossing, SignalState } from "@/types/operator";

export async function listOperatorCrossings(): Promise<OperatorCrossing[]> {
  if (getCrossingsSource() !== "orion") throw new OrionError("O painel exige dados do Orion. O modo de demonstração do cidadão não fornece telemetria.", 503);
  const records = await listCrossingEntitiesServer();
  return records.map(({ crossing, entity }) => {
    const state = entity.estado;
    const extension = entity.extensao_s;
    const valid = entity.leitura_valida;
    const validState = typeof state === "string" && Object.hasOwn(SIGNAL_LABELS, state);
    const validExtension = typeof extension === "number" && Number.isInteger(extension) && extension >= 0 && extension <= 15 && extension % 3 === 0;
    return {
      ...crossing,
      signalState: validState ? state as SignalState : null,
      extensionSeconds: validExtension ? extension : null,
      validReading: typeof valid === "boolean" ? valid : null,
      telemetryIssue: (state !== undefined && state !== null && !validState) || (extension !== undefined && extension !== null && !validExtension) || (valid !== undefined && valid !== null && typeof valid !== "boolean"),
    };
  });
}
