import Link from "next/link";
import { getCrossingLocation } from "@/data/crossingCatalog";
import { notFound } from "next/navigation";
import { CrossingComparison } from "@/components/CrossingComparison";
import { CrossingLocation } from "@/components/CrossingLocation";
import { findCrossing } from "@/services/crossings.server";

export default async function CrossingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { crossing, source } = await findCrossing(code);
  if (!crossing) notFound();
  const location = getCrossingLocation(crossing);

  return (
    <main id="conteudo" tabIndex={-1} className="site-width crossing-detail">
      <Link href="/" className="back-link">Voltar aos cruzamentos</Link>
      <p className="demo-notice">{crossing.metadata ? "Largura medida no Google Earth. Tempos estimados para simulação, não oficiais da CET." : source === "demo" || crossing.simulated ? "Demonstração com dados simulados. Sem conexão ao vivo com a CET." : "Informações do cadastro do Farol Amigo. A comparação é uma simulação educativa."}</p>
      <h1>{crossing.address}</h1>
      <p className="crossing-code">Poste {crossing.code}</p>
      <CrossingComparison code={crossing.code} width={crossing.width} currentSeconds={crossing.currentSeconds} metadata={crossing.metadata} />
      {location ? <CrossingLocation address={crossing.address} metadata={location} /> : null}
    </main>
  );
}
