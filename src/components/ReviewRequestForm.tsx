"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/Button";
import { ReasonOption } from "@/components/ReasonOption";
import { RequestProgress } from "@/components/RequestProgress";
import { MAX_COMMENT_LENGTH, REVIEW_REASONS, validateReviewDraft, type ReviewReason } from "@/lib/reviewRequests";

export function ReviewRequestForm({ code, address }: { code: string; address: string }) {
  const [reason, setReason] = useState<ReviewReason | "">("");
  const [comment, setComment] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const reasonGroup = useRef<HTMLFieldSetElement>(null);
  const commentInput = useRef<HTMLTextAreaElement>(null);
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  const formHeading = useRef<HTMLHeadingElement>(null);
  const errors = validateReviewDraft(reason, comment);

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    if (errors.reason) {
      reasonGroup.current?.querySelector("input")?.focus();
      return;
    }
    if (errors.comment) {
      commentInput.current?.focus();
      return;
    }
    setStep(2);
    requestAnimationFrame(() => reviewHeading.current?.focus());
  }

  function edit() {
    setStep(1);
    requestAnimationFrame(() => formHeading.current?.focus());
  }

  return (
    <div className="request-form">
      <RequestProgress step={step} />
      <p className="request-location">Poste {code} · {address}</p>
      {step === 1 ? (
        <form onSubmit={review} noValidate>
          <h1 ref={formHeading} tabIndex={-1}>O que acontece neste farol?</h1>
          <fieldset ref={reasonGroup} className="reason-group" role="radiogroup" aria-invalid={attempted && Boolean(errors.reason) || undefined} aria-describedby={attempted && errors.reason ? "reason-error" : undefined}>
            <legend>Escolha um motivo (obrigatório)</legend>
            <div className="reason-options">
              {REVIEW_REASONS.map((item) => <ReasonOption key={item.value} {...item} checked={reason === item.value} onChange={setReason} invalid={attempted && Boolean(errors.reason)} />)}
            </div>
            {attempted && errors.reason ? <p id="reason-error" className="field-error" role="alert">{errors.reason}</p> : null}
          </fieldset>
          <div className="field comment-field">
            <label htmlFor="comentario">Quer contar mais? (opcional)</label>
            <textarea ref={commentInput} id="comentario" name="comentario" className="text-input" rows={4} value={comment} onChange={(event) => setComment(event.target.value)} maxLength={MAX_COMMENT_LENGTH} placeholder="Ex.: de manhã a faixa fica cheia" aria-invalid={attempted && Boolean(errors.comment) || undefined} aria-describedby={`comment-hint comment-count${attempted && errors.comment ? " comment-error" : ""}`} />
            <p id="comment-hint" className="field-hint">Não escreva nome, telefone, documento ou outros dados pessoais.</p>
            <p id="comment-count" className="field-hint">{comment.length} de {MAX_COMMENT_LENGTH} caracteres</p>
            {attempted && errors.comment ? <p id="comment-error" className="field-error" role="alert">{errors.comment}</p> : null}
          </div>
          <Button type="submit" className="request-action">Conferir pedido</Button>
        </form>
      ) : (
        <section aria-labelledby="review-title">
          <h1 ref={reviewHeading} tabIndex={-1} id="review-title">Confira seu pedido</h1>
          <dl className="request-review">
            <div><dt>Cruzamento</dt><dd>{code} · {address}</dd></div>
            <div><dt>O que acontece</dt><dd>{REVIEW_REASONS.find((item) => item.value === reason)?.label}</dd></div>
            <div><dt>Seu comentário</dt><dd>{comment.trim() || "Nenhum comentário informado."}</dd></div>
          </dl>
          <p className="demo-notice">Seu pedido ainda não foi enviado. O envio será habilitado quando a integração com o FIWARE Orion estiver pronta.</p>
          <div className="request-actions">
            <Button variant="secondary" onClick={edit}>Alterar informações</Button>
            <Button disabled>Enviar pedido</Button>
          </div>
        </section>
      )}
      <p className="request-draft-notice">Demonstração do formulário. As informações ficam apenas nesta página e são descartadas ao sair ou recarregar. Nenhum protocolo é gerado nesta etapa.</p>
    </div>
  );
}
