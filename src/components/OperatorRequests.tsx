"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { StatusBadge } from "@/components/StatusBadge";
import { HttpClientError } from "@/lib/httpClient";
import { normalizeSearch } from "@/lib/crossings";
import { MAX_RESPONSE_LENGTH, validateOperatorResponse } from "@/lib/operator";
import { REVIEW_REASONS } from "@/lib/reviewRequests";
import { answerOperatorRequest } from "@/services/operator";
import type { ReviewRequestDetails } from "@/types/reviewRequest";

type Props = { requests: ReviewRequestDetails[]; offset: number; nextOffset: number | null; refreshing: boolean; onPage: (offset: number) => void; onRefresh: () => void; onExpired: () => void };
const badges = { enviado: "sent", em_analise: "reviewing", respondido: "answered" } as const;

export function OperatorRequests({ requests, offset, nextOffset, refreshing, onPage, onRefresh, onExpired }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("todos");
  const [selected, setSelected] = useState<ReviewRequestDetails | null>(null);
  const [response, setResponse] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const pending = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const returnTo = useRef<HTMLButtonElement | null>(null);
  const responseError = validateOperatorResponse(response);
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  const filtered = requests.filter((item) => (filter === "todos" || item.status === filter) && terms.every((term) => normalizeSearch(`${item.protocol} ${item.crossingCode} ${item.address}`).includes(term)));

  async function act(request: ReviewRequestDetails, status: "em_analise" | "respondido", text = "") {
    if (pending.current) return;
    pending.current = true; setSaving(request.protocol); setError(null); setNotice(null);
    try {
      await answerOperatorRequest(request.protocol, status, text);
      setSelected(null); setResponse("");
      setNotice(status === "respondido" ? `Resposta registrada para ${request.protocol}. Ela já pode ser consultada pelo cidadão.` : `${request.protocol} está em análise.`);
      onRefresh();
      requestAnimationFrame(() => returnTo.current?.focus());
    } catch (failure) {
      if (failure instanceof HttpClientError && failure.status === 401) onExpired();
      else setError(failure instanceof Error ? failure.message : "Não foi possível confirmar o atendimento.");
    } finally { pending.current = false; setSaving(null); }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setAttempted(true);
    if (responseError) { textarea.current?.focus(); return; }
    if (selected) void act(selected, "respondido", response);
  }

  return <section id="operator-requests" className="operator-section" aria-labelledby="requests-heading">
    <div className="operator-section-heading"><h2 id="requests-heading">Pedidos dos cidadãos</h2><p>Inicie a análise ou registre uma resposta para o protocolo</p></div>
    <div className="operator-filters">
      <TextField label="Buscar nesta página" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Protocolo, código ou rua" autoComplete="off" />
      <div className="field"><label htmlFor="operator-status">Status nesta página</label><select id="operator-status" className="text-input" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="todos">Todos os status</option><option value="enviado">Enviado</option><option value="em_analise">Em análise</option><option value="respondido">Respondido</option></select></div>
    </div>
    {notice ? <p className="operator-success" role="status">{notice}</p> : null}
    {error ? <p className="field-error operator-notice" role="alert">{error} {selected ? "Sua resposta continua no formulário." : "Atualize a consulta para conferir o estado do pedido."}</p> : null}
    {filtered.length === 0 ? <p className="operator-empty">{requests.length === 0 ? "Nenhum pedido nesta página. Os pedidos enviados pelo site aparecerão aqui." : "Nenhum pedido corresponde aos filtros nesta página."}</p> : <ul className="operator-orders">{filtered.map((item) => <li key={item.protocol}>
      <article>
        <div className="operator-order-heading"><h3>{item.protocol}</h3><StatusBadge status={badges[item.status]} /></div>
        <p><strong>{item.crossingCode}</strong> · {item.address}</p>
        <p className="operator-order-reason">{REVIEW_REASONS.find((reason) => reason.value === item.reason)?.label}</p>
        {item.comment ? <p className="operator-order-text">{item.comment}</p> : <p className="field-hint">Sem comentário adicional.</p>}
        {item.response ? <div className="operator-recorded-answer"><strong>Resposta registrada</strong><p className="operator-order-text">{item.response}</p></div> : null}
        <p className="field-hint">Atualizado em <time dateTime={item.updatedAt}>{new Date(item.updatedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })}</time></p>
        {item.status !== "respondido" ? <div className="operator-order-actions">
          {item.status === "enviado" ? <Button variant="secondary" disabled={Boolean(saving || selected)} loading={saving === item.protocol} onClick={(event) => { returnTo.current = event.currentTarget; void act(item, "em_analise"); }}>Iniciar análise</Button> : null}
          <Button disabled={Boolean(saving || selected)} onClick={(event) => { returnTo.current = event.currentTarget; setSelected(item); setResponse(""); setAttempted(false); setError(null); setNotice(null); requestAnimationFrame(() => heading.current?.focus()); }}>Responder pedido</Button>
        </div> : null}
      </article>
    </li>)}</ul>}
    {selected ? <form onSubmit={submit} className="operator-answer" aria-busy={Boolean(saving)} noValidate>
      <h3 ref={heading} tabIndex={-1}>Responder {selected.protocol}</h3>
      <p>A resposta ficará disponível ao cidadão. Ao concluir, o pedido não poderá mais ser editado ou cancelado.</p>
      <div className="field"><label htmlFor="operator-response">Resposta ao pedido (obrigatória)</label><textarea ref={textarea} id="operator-response" name="resposta" className="text-input" rows={5} value={response} maxLength={MAX_RESPONSE_LENGTH} disabled={Boolean(saving)} onChange={(event) => setResponse(event.target.value)} aria-describedby={`operator-response-hint${attempted && responseError ? " operator-response-error" : ""}`} aria-invalid={attempted && Boolean(responseError) || undefined} /><p id="operator-response-hint" className="field-hint">{response.length} de {MAX_RESPONSE_LENGTH} caracteres. Não inclua dados pessoais.</p>{attempted && responseError ? <p id="operator-response-error" className="field-error" role="alert">{responseError}</p> : null}</div>
      <div className="operator-order-actions"><Button type="submit" loading={Boolean(saving)}>Registrar resposta</Button><Button variant="secondary" disabled={Boolean(saving)} onClick={() => { setSelected(null); setError(null); requestAnimationFrame(() => returnTo.current?.focus()); }}>Voltar sem responder</Button></div>
    </form> : null}
    <nav className="operator-pagination" aria-label="Páginas dos pedidos"><Button variant="secondary" disabled={offset === 0 || Boolean(selected || saving) || refreshing} onClick={() => onPage(Math.max(0, offset - 20))}>Página anterior</Button><span>Página {Math.floor(offset / 20) + 1}</span><Button variant="secondary" disabled={nextOffset === null || Boolean(selected || saving) || refreshing} onClick={() => { if (nextOffset !== null) onPage(nextOffset); }}>Próxima página</Button></nav>
  </section>;
}
