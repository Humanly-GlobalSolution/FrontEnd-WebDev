"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/Button";
import { ReasonOption } from "@/components/ReasonOption";
import { MAX_COMMENT_LENGTH, REVIEW_REASONS, validateReviewDraft } from "@/lib/reviewRequests";
import type { ReviewRequestDetails, ReviewRequestEdit } from "@/types/reviewRequest";

type RequestEditFormProps = {
  request: ReviewRequestDetails;
  loading: boolean;
  error: string | null;
  onSave: (changes: ReviewRequestEdit) => Promise<void>;
  onCancel: () => void;
};

export function RequestEditForm({ request, loading, error, onSave, onCancel }: RequestEditFormProps) {
  const [reason, setReason] = useState(request.reason);
  const [comment, setComment] = useState(request.comment);
  const [attempted, setAttempted] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const fieldset = useRef<HTMLFieldSetElement>(null);
  const commentInput = useRef<HTMLTextAreaElement>(null);
  const errors = validateReviewDraft(reason, comment);
  useEffect(() => { heading.current?.focus(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setAttempted(true);
    if (errors.reason) { fieldset.current?.querySelector("input")?.focus(); return; }
    if (errors.comment) { commentInput.current?.focus(); return; }
    await onSave({ reason, comment });
  }

  return (
    <form onSubmit={submit} className="request-edit-form" noValidate>
      <h2 ref={heading} tabIndex={-1}>O que acontece neste farol?</h2>
      <p className="preview-description">Você pode mudar o motivo e o comentário enquanto o pedido estiver enviado ou em análise.</p>
      <fieldset className="reason-group" ref={fieldset} disabled={loading} role="radiogroup" aria-invalid={attempted && Boolean(errors.reason) || undefined} aria-describedby={attempted && errors.reason ? "reason-error" : undefined}>
        <legend>Escolha um motivo (obrigatório)</legend>
        <div className="reason-options">{REVIEW_REASONS.map((item) => <ReasonOption key={item.value} {...item} checked={reason === item.value} onChange={setReason} invalid={attempted && Boolean(errors.reason)} />)}</div>
        {attempted && errors.reason ? <p id="reason-error" className="field-error" role="alert">{errors.reason}</p> : null}
      </fieldset>
      <div className="field comment-field">
        <label htmlFor="edit-comment">Quer contar mais? (opcional)</label>
        <textarea id="edit-comment" ref={commentInput} className="text-input" rows={4} value={comment} onChange={(event) => setComment(event.target.value)} disabled={loading} maxLength={MAX_COMMENT_LENGTH} aria-describedby={`edit-comment-hint edit-comment-count${attempted && errors.comment ? " edit-comment-error" : ""}`} aria-invalid={attempted && Boolean(errors.comment) || undefined} />
        <p id="edit-comment-hint" className="field-hint">Não escreva nome, telefone, documento ou outros dados pessoais.</p>
        <p id="edit-comment-count" className="field-hint">{comment.length} de {MAX_COMMENT_LENGTH} caracteres</p>
        {attempted && errors.comment ? <p id="edit-comment-error" className="field-error" role="alert">{errors.comment}</p> : null}
      </div>
      {error ? <p className="field-error" role="alert">{error} O preenchimento foi mantido para você tentar novamente.</p> : null}
      <div className="request-actions">
        <Button type="submit" loading={loading}>Salvar alterações</Button>
        <Button variant="secondary" disabled={loading} onClick={onCancel}>Voltar sem salvar</Button>
      </div>
    </form>
  );
}
