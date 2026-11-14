import { tempoFalhaSensor, TETO_EXTENSAO_S } from "@/lib/regras";
import { SIGNAL_LABELS } from "@/lib/operator";
import type { OperatorCrossing } from "@/types/operator";

export function crossingAlerts(crossing: OperatorCrossing) {
  const alerts: string[] = [];
  if (!crossing.signalState) return alerts;
  if (crossing.signalState === "FALHA") alerts.push(`Sensor com leitura impossível. Ciclo fixo de ${tempoFalhaSensor(crossing.width, crossing.currentSeconds)} s ativo.`);
  if (crossing.validReading === false) alerts.push("Leitura do sensor inválida");
  if (crossing.extensionSeconds === TETO_EXTENSAO_S) alerts.push(`Tempo extra chegou ao teto de ${TETO_EXTENSAO_S} s.`);
  if (crossing.telemetryIssue) alerts.push("Atributos de telemetria fora do contrato");
  return alerts;
}

export function OperatorCrossings({ crossings }: { crossings: OperatorCrossing[] }) {
  return <section id="operator-crossings" className="operator-section" aria-labelledby="crossings-heading">
    <div className="operator-section-heading"><h2 id="crossings-heading">Estado dos cruzamentos</h2><p>Último estado disponível no Orion · somente leitura</p></div>
    {crossings.length === 0 ? <p className="operator-empty">Nenhum cruzamento está disponível no contexto FIWARE configurado.</p> : <ul className="operator-crossings">
      {crossings.map((crossing) => {
        const danger = crossing.signalState === "FALHA" || crossing.telemetryIssue || crossing.validReading === false;
        const warning = crossing.extensionSeconds === 15 || crossing.signalState === "TEMPO_ESTENDIDO";
        return <li key={crossing.id} className="operator-crossing">
          <div className="operator-crossing-name"><h3>{crossing.code} · {crossing.address}</h3><p>{crossing.metadata ? "Largura: Google Earth · Tempos estimados" : crossing.simulated ? "Dados simulados" : "Cruzamento-piloto"} · {crossing.width} m · tempo total atual {crossing.currentSeconds} s</p></div>
          <span className={`signal-state signal-${danger ? "danger" : warning ? "warning" : crossing.signalState ? "normal" : "muted"}`}>{crossing.signalState ? SIGNAL_LABELS[crossing.signalState] : "Sem farol conectado"}</span>
          {crossing.signalState ? <dl className="operator-crossing-values">
            <div><dt>Extensão atual</dt><dd>{crossing.extensionSeconds === null ? "Não informada" : `${crossing.extensionSeconds} s`}</dd></div>
            <div><dt>Leitura do sensor</dt><dd>{crossing.validReading === null ? "Não informada" : crossing.validReading ? "Válida" : "Inválida"}</dd></div>
          </dl> : null}
        </li>;
      })}
    </ul>}
    <p className="field-hint operator-footnote">Atualizar a consulta não comprova que o dispositivo está online. Valores ausentes não são substituídos por estados simulados.</p>
  </section>;
}

export function OperatorAlerts({ crossings }: { crossings: OperatorCrossing[] }) {
  const alerts = crossings.flatMap((crossing) => crossingAlerts(crossing).map((text) => ({ code: crossing.code, text })));
  return <section id="operator-alerts" className="operator-section" aria-labelledby="alerts-heading">
    <div className="operator-section-heading"><h2 id="alerts-heading">Alertas atuais</h2><p>Falha, leitura inválida ou extensão no teto</p></div>
    {alerts.length ? <ul className="operator-alerts">{alerts.map((alert) => <li key={`${alert.code}-${alert.text}`}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5m0 3v1"/></svg><strong>{alert.code}</strong><span>{alert.text}</span></li>)}</ul> : <p className="operator-empty">Nenhuma condição de alerta nos dados recebidos. Cruzamentos sem telemetria continuam identificados na lista acima.</p>}
  </section>;
}
