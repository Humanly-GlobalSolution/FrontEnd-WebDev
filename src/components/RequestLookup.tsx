"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/Button";
import { RequestTimeline } from "@/components/RequestTimeline";
import { StatusBadge } from "@/components/StatusBadge";
import { TextField } from "@/components/TextField";
import { RequestEditForm } from "@/components/RequestEditForm";
import type { ReviewRequestEdit } from "@/types/reviewRequest";
import { usePedido } from "@/hooks/usePedido";
import { normalizeProtocol, requestKeyFromProtocol, REVIEW_REASONS } from "@/lib/reviewRequests";

export function RequestLookup({ initialProtocol }: { initialProtocol: string }) {
  const [protocol, setProtocol] = useState(initialProtocol);
  const [validation, setValidation] = useState<string | undefined>();
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const { lookup, update, clearError, foundRequest, error, loading } = usePedido();
  const resultHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => { if (initialProtocol) void lookup(initialProtocol); }, [initialProtocol, lookup]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
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

  async function save(changes: ReviewRequestEdit) {
    if (!foundRequest) return;
    const result = await update(foundRequest.protocol, changes);
    if (result) {
      setEditing(false);
      setNotice("Alterações salvas. Seu protocolo continua o mesmo.");
      requestAnimationFrame(() => resultHeading.current?.focus());
    }
  }

  function cancelEdit() {
    setEditing(false);
    clearError();
    requestAnimationFrame(() => resultHeading.current?.focus());
  }

  return (
    <div className="request-lookup">
      <h1>Seu pedido</h1>
      <form onSubmit={submit} className="protocol-search" noValidate>
        <TextField label="Número do protocolo" value={protocol} onChange={(event) => { setProtocol(event.target.value); setValidation(undefined); }} placeholder="FA-AAMM-…" hint="Cole o protocolo inteiro. Você não precisa informar seu nome." error={validation} disabled={loading || editing} autoComplete="off" autoCapitalize="characters" spellCheck={false} required maxLength={40} />
        <Button type="submit" loading={loading && !editing} disabled={editing}>Consultar pedido</Button>
      </form>
      {loading && !editing ? <p role="status" className="lookup-feedback">Consultando o pedido…</p> : null}
      {notice ? <p role="status" className="lookup-feedback">{notice}</p> : null}
      {error && !validation && !editing ? <p role="alert" className="field-error lookup-feedback">{error}</p> : null}
      {foundRequest && (!loading || editing) && !validation ? (
        <div className="lookup-result">
          <h2 ref={resultHeading} tabIndex={-1}>{editing ? "Editando seu pedido" : "Pedido encontrado"}</h2>
          <p className="lookup-protocol">{foundRequest.protocol}</p>
          {editing ? <RequestEditForm request={foundRequest} loading={loading} error={error} onSave={save} onCancel={cancelEdit} /> : <>
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
          <div className="request-actions">
            {foundRequest.status !== "respondido" ? <Button variant="secondary" onClick={() => { setEditing(true); setNotice(null); clearError(); }}>Editar pedido</Button> : null}
            <Button variant="secondary" onClick={() => { setNotice(null); void lookup(foundRequest.protocol); }}>Atualizar andamento</Button>
          </div>
          <p className="field-hint">{foundRequest.status === "respondido" ? "Pedidos respondidos não podem ser editados." : "O cancelamento será disponibilizado na próxima etapa."}</p>
          </>}
        </div>
      ) : null}
      <p className="request-draft-notice">Guarde seu protocolo com cuidado: ele permite acessar o pedido. Este projeto acadêmico não representa atendimento real da CET.</p>
    </div>
  );
}
