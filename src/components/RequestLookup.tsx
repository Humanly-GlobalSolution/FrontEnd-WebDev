"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/Button";
import { RequestTimeline } from "@/components/RequestTimeline";
import { StatusBadge } from "@/components/StatusBadge";
import { TextField } from "@/components/TextField";
import { usePedido } from "@/hooks/usePedido";
import { normalizeProtocol, requestKeyFromProtocol, REVIEW_REASONS } from "@/lib/reviewRequests";

export function RequestLookup({ initialProtocol }: { initialProtocol: string }) {
  const [protocol, setProtocol] = useState(initialProtocol);
  const [validation, setValidation] = useState<string | undefined>();
  const { lookup, foundRequest, error, loading } = usePedido();
  const resultHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => { if (initialProtocol) void lookup(initialProtocol); }, [initialProtocol, lookup]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeProtocol(protocol);
    setProtocol(normalized);
    if (!requestKeyFromProtocol(normalized)) {
      setValidation("Copie o protocolo completo que começa com FA, incluindo os números e as letras.");
      return;
    }
    setValidation(undefined);
    const result = await lookup(normalized);
    if (result) requestAnimationFrame(() => resultHeading.current?.focus());
  }

  return (
    <div className="request-lookup">
      <h1>Seu pedido</h1>
      <form onSubmit={submit} className="protocol-search" noValidate>
        <TextField label="Número do protocolo" value={protocol} onChange={(event) => { setProtocol(event.target.value); setValidation(undefined); }} placeholder="FA-AAMM-…" hint="Cole o protocolo inteiro. Você não precisa informar seu nome." error={validation} disabled={loading} autoComplete="off" autoCapitalize="characters" spellCheck={false} required maxLength={40} />
        <Button type="submit" loading={loading}>Consultar pedido</Button>
      </form>
      {loading ? <p role="status" className="lookup-feedback">Consultando o pedido…</p> : null}
      {error && !validation ? <p role="alert" className="field-error lookup-feedback">{error}</p> : null}
      {foundRequest && !loading && !validation ? (
        <div className="lookup-result">
          <h2 ref={resultHeading} tabIndex={-1}>Pedido encontrado</h2>
          <p className="lookup-protocol">{foundRequest.protocol}</p>
          <StatusBadge status={{ enviado: "sent", em_analise: "reviewing", respondido: "answered" }[foundRequest.status] as "sent" | "reviewing" | "answered"} />
          <RequestTimeline request={foundRequest} />
          <section className="request-section" aria-labelledby="request-details-title">
            <h2 id="request-details-title">Detalhes do pedido</h2>
            <dl className="request-details">
              <div><dt>Cruzamento</dt><dd>{foundRequest.crossingCode} · {foundRequest.address}</dd></div>
              <div><dt>O que acontece</dt><dd>{REVIEW_REASONS.find((item) => item.value === foundRequest.reason)?.label}</dd></div>
              <div><dt>Seu comentário</dt><dd>{foundRequest.comment || "Nenhum comentário informado."}</dd></div>
            </dl>
          </section>
          {foundRequest.status === "respondido" ? <section className="request-section" aria-labelledby="response-title"><h2 id="response-title">Resposta</h2><p className="request-response">{foundRequest.response || "O pedido está marcado como respondido, mas o texto da resposta ainda não foi informado no Orion."}</p></section> : null}
          <Button variant="secondary" onClick={() => void lookup(foundRequest.protocol)}>Atualizar andamento</Button>
          <p className="field-hint">Edição e cancelamento serão disponibilizados nas próximas etapas.</p>
        </div>
      ) : null}
      <p className="request-draft-notice">Guarde seu protocolo com cuidado: ele permite acessar o pedido. Este projeto acadêmico não representa atendimento real da CET.</p>
    </div>
  );
}
