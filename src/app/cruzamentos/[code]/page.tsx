import Link from "next/link";
import { notFound } from "next/navigation";
import { CrossingComparison } from "@/components/CrossingComparison";
import { findCrossing } from "@/services/crossings";

export default async function CrossingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const crossing = await findCrossing(code);
  if (!crossing) notFound();

  return (
    <main id="conteudo" tabIndex={-1} className="site-width crossing-detail">
      <Link href="/" className="back-link">Voltar aos cruzamentos</Link>
      <p className="demo-notice">Demonstração com dados simulados. Sem conexão ao vivo com a CET.</p>
      <h1>{crossing.address}</h1>
      <p className="crossing-code">Poste {crossing.code}</p>
      <CrossingComparison code={crossing.code} width={crossing.width} currentSeconds={crossing.currentSeconds} />
    </main>
  );
}
