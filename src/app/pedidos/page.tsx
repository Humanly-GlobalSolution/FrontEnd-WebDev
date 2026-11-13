import Link from "next/link";
import type { Metadata } from "next";
import { RequestLookup } from "@/components/RequestLookup";

export const metadata: Metadata = { title: "Seu pedido | Farol Amigo", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ protocolo?: string | string[] }> }) {
  const { protocolo } = await searchParams;
  return (
    <main id="conteudo" tabIndex={-1} className="site-width review-page">
      <Link href="/" className="back-link">Voltar ao início</Link>
      <RequestLookup initialProtocol={typeof protocolo === "string" ? protocolo.slice(0, 100) : ""} />
    </main>
  );
}
