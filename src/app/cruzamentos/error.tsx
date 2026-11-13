"use client";

import Link from "next/link";
import { Button } from "@/components/Button";

export default function CrossingsError({ reset }: { reset: () => void }) {
  return (
    <main id="conteudo" tabIndex={-1} className="site-width crossing-detail">
      <h1>Não foi possível consultar o cruzamento</h1>
      <p className="preview-description">O serviço de dados pode estar indisponível ou precisar de configuração. Tente novamente em instantes.</p>
      <div className="preview-row"><Button onClick={reset}>Tentar novamente</Button><Link href="/" className="button button-secondary">Voltar ao início</Link></div>
    </main>
  );
}
