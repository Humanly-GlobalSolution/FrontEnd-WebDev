import Link from "next/link";
import { notFound } from "next/navigation";
import { calculateCrossingSeconds } from "@/lib/crossings";
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
      <dl className="crossing-facts">
        <div><dt>Largura da travessia</dt><dd>{crossing.width} m</dd></div>
        <div><dt>Tempo atual no exemplo</dt><dd>{crossing.currentSeconds} s</dd></div>
        <div><dt>Tempo de referência a 0,75 m/s</dt><dd>{calculateCrossingSeconds(crossing.width)} s</dd></div>
      </dl>
      <p className="unavailable-notice">A comparação visual e o pedido de revisão serão adicionados nas próximas etapas.</p>
    </main>
  );
}
