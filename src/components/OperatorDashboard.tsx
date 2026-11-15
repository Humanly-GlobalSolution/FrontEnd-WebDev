"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { OperatorCrossings, OperatorAlerts, crossingAlerts } from "@/components/OperatorCrossings";
import { OperatorRequests } from "@/components/OperatorRequests";
import { OperatorNavigation } from "@/components/OperatorNavigation";
import { useOperatorPanel } from "@/hooks/useOperatorPanel";
import { requestJson } from "@/lib/httpClient";

export function OperatorDashboard({ onExpired, onLogout }: { onExpired: () => void; onLogout: () => void }) {
  const [offset, setOffset] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const { snapshot, error, refreshing, refresh } = useOperatorPanel(offset, onExpired);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  async function logout() {
    setLeaving(true); setLogoutError(null);
    try { await requestJson("/api/painel/sessao", { method: "DELETE" }, { fallbackMessage: "Não foi possível encerrar a sessão. Tente sair novamente." }); onLogout(); }
    catch (failure) { setLogoutError(failure instanceof Error ? failure.message : "Não foi possível sair."); }
    finally { setLeaving(false); }
  }
  const alerts = snapshot?.crossings.flatMap(crossingAlerts) ?? [];
  return <div className="operator-shell">
    <OperatorNavigation />
    <div className="operator-content">
      <header id="operator-overview" className="operator-heading"><div><h1 ref={heading} tabIndex={-1}>Painel do operador</h1><p>Monitoramento e atendimento · Farol Amigo</p></div><Button variant="secondary" onClick={logout} loading={leaving}>Sair do painel</Button></header>
      {logoutError ? <p className="field-error" role="alert">{logoutError}</p> : null}
      <div className="operator-sync"><div><strong className={error ? "operator-offline" : ""}>{error ? "Consulta indisponível" : snapshot ? "Conectado ao Orion" : "Consultando o Orion…"}</strong><p>{snapshot ? <>Última consulta: <time dateTime={snapshot.receivedAt}>{new Date(snapshot.receivedAt).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time> · atualização automática a cada 5 s</> : "Os dados aparecerão após a primeira resposta do serviço."}</p></div><Button variant="secondary" onClick={refresh} loading={refreshing}>Atualizar agora</Button></div>
      {error ? <div className="operator-error" role="alert"><strong>Não foi possível atualizar o painel.</strong><p>{error} {snapshot ? "Os dados abaixo são da última consulta bem-sucedida e podem estar desatualizados." : "Confira a conexão e tente atualizar novamente."}</p></div> : null}
      {!snapshot && refreshing ? <><p className="sr-only" role="status">Carregando cruzamentos e pedidos.</p><div className="operator-skeleton" aria-hidden="true"><span /><span /><span /></div></> : null}
      {snapshot ? <>
        <dl className="operator-summary"><div><dt>Cruzamentos</dt><dd>{snapshot.crossings.length}</dd></div><div><dt>Com estado informado</dt><dd>{snapshot.crossings.filter((crossing) => crossing.signalState !== null).length}</dd></div><div><dt>Condições de alerta</dt><dd>{alerts.length}</dd></div><div><dt>Pedidos nesta página</dt><dd>{snapshot.requests.length}</dd></div></dl>
        <OperatorCrossings crossings={snapshot.crossings} />
        <OperatorAlerts crossings={snapshot.crossings} />
        <OperatorRequests requests={snapshot.requests} offset={snapshot.offset} nextOffset={snapshot.nextOffset} refreshing={refreshing} onPage={setOffset} onRefresh={refresh} onExpired={onExpired} />
      </> : null}
    </div>
  </div>;
}
