import type { Metadata } from "next";
import Link from "next/link";
import { OperatorEntry } from "@/components/OperatorEntry";

export const metadata: Metadata = { title: "Painel do operador | Farol Amigo", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default function OperatorPage() {
  return <main id="conteudo" tabIndex={-1} className="site-width operator-page">
    <Link className="back-link" href="/">Voltar ao site do cidadão</Link>
    <OperatorEntry />
  </main>;
}
