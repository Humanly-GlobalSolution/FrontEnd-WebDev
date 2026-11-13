import Link from "next/link";
import type { Ref } from "react";
import type { CreatedReviewRequest } from "@/types/reviewRequest";

export function RequestConfirmation({ request, headingRef }: { request: CreatedReviewRequest; headingRef: Ref<HTMLHeadingElement> }) {
  return (
    <section aria-labelledby="confirmation-title" className="request-confirmation">
      <div className="confirmation-banner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <h1 id="confirmation-title" ref={headingRef} tabIndex={-1}>Pedido enviado</h1>
        <p>Seu pedido para o farol {request.crossingCode} foi registrado no Farol Amigo. Obrigado por avisar.</p>
      </div>
      <div className="protocol-block">
        <h2>Número do protocolo</h2>
        <p className="protocol-value">{request.protocol}</p>
        <p>Anote ou tire um print. Guarde este número para encontrar seu pedido sem informar dados pessoais.</p>
      </div>
      <Link href={`/pedidos?protocolo=${encodeURIComponent(request.protocol)}`} className="button button-primary request-action" referrerPolicy="no-referrer">Acompanhar pedido</Link>
      <p className="field-hint">Este projeto acadêmico não envia solicitações aos sistemas reais da CET.</p>
      <Link href="/" className="button button-secondary request-action">Voltar ao início</Link>
    </section>
  );
}
