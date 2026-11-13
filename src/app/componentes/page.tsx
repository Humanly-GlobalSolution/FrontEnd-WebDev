"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { CrossingCard } from "@/components/CrossingCard";
import { StatusBadge } from "@/components/StatusBadge";
import { TextField } from "@/components/TextField";

export default function ComponentsPage() {
  const [protocol, setProtocol] = useState("");
  const [feedback, setFeedback] = useState("");

  return (
    <main id="conteudo" tabIndex={-1} className="site-width component-preview">
      <h1>Componentes do Farol Amigo</h1>
      <p className="preview-description">Área de demonstração da interface. Os dados são exemplos e nenhum pedido será enviado.</p>

      <section aria-labelledby="buttons-title">
        <h2 id="buttons-title">Botões</h2>
        <div className="preview-row">
          <Button onClick={() => setFeedback("Botão acionado. Esta é apenas uma demonstração.")}>Enviar pedido</Button>
          <Button variant="secondary" onClick={() => setFeedback("Pedido de exemplo mantido.")}>Manter pedido</Button>
          <Button variant="danger" onClick={() => setFeedback("Nenhum registro foi excluído nesta demonstração.")}>Cancelar pedido</Button>
          <Button disabled>Indisponível</Button>
          <Button loading>Enviar pedido</Button>
        </div>
        <p className="preview-feedback" role="status">{feedback}</p>
      </section>

      <section aria-labelledby="fields-title">
        <h2 id="fields-title">Campos de texto</h2>
        <div className="preview-fields">
          <TextField label="Número do protocolo" placeholder="Ex.: FA-2611-0231" hint="Exemplo editável, sem consulta à API." value={protocol} onChange={(event) => setProtocol(event.target.value)} />
          <TextField label="Protocolo com erro de exemplo" defaultValue="FA" error="Confira o número completo do protocolo." />
        </div>
      </section>

      <section aria-labelledby="status-title">
        <h2 id="status-title">Status</h2>
        <div className="preview-row">
          <StatusBadge status="normal" /><StatusBadge status="extended" />
          <StatusBadge status="alert" /><StatusBadge status="maintenance" />
          <StatusBadge status="sent" /><StatusBadge status="reviewing" /><StatusBadge status="answered" />
        </div>
      </section>

      <section id="cruzamento-exemplo" aria-labelledby="crossing-title">
        <h2 id="crossing-title">Cartão de cruzamento</h2>
        <p className="preview-description">Dados simulados do protótipo. O cartão aponta para esta mesma seção enquanto o detalhe não está implementado.</p>
        <CrossingCard code="C01" address="Av. Paulista × Al. Joaquim Eugênio de Lima" width={30} currentSeconds={20} href="#cruzamento-exemplo" />
      </section>
    </main>
  );
}
