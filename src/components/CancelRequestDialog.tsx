"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/Button";

type CancelRequestDialogProps = {
  protocol: string;
  loading: boolean;
  error: string | null;
  onKeep: () => void;
  onConfirm: () => Promise<void>;
};

export function CancelRequestDialog({ protocol, loading, error, onKeep, onConfirm }: CancelRequestDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    dialog.querySelector("button")?.focus();
    return () => dialog.close();
  }, []);

  return (
    <dialog ref={ref} className="cancel-dialog" aria-labelledby="cancel-title" aria-describedby="cancel-description" onCancel={(event) => { event.preventDefault(); if (!loading) onKeep(); }}>
      <h2 id="cancel-title">Cancelar este pedido?</h2>
      <p className="lookup-protocol">{protocol}</p>
      <p id="cancel-description">O pedido será excluído do Farol Amigo. Essa ação não pode ser desfeita. Se mudar de ideia depois, será necessário fazer um novo pedido.</p>
      {error ? <p className="field-error request-error" role="alert">{error} O cancelamento não foi confirmado.</p> : null}
      <div className="cancel-dialog-actions">
        <Button variant="secondary" disabled={loading} onClick={onKeep}>Manter pedido</Button>
        <Button variant="danger" loading={loading} onClick={onConfirm}>Cancelar pedido</Button>
      </div>
    </dialog>
  );
}
