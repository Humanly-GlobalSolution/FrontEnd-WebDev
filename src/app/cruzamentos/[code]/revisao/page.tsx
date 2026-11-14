import { perfilValido } from "@/lib/regras";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewRequestForm } from "@/components/ReviewRequestForm";
import { findCrossing } from "@/services/crossings.server";

export default async function ReviewPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ perfil?: string }> }) {
  const { code } = await params;
  const { perfil } = await searchParams;
  const { crossing, source } = await findCrossing(code);
  if (!crossing) notFound();

  return (
    <main id="conteudo" tabIndex={-1} className="site-width review-page">
      <Link href={`/cruzamentos/${crossing.code}`} className="back-link">Voltar ao cruzamento</Link>
      <ReviewRequestForm initialProfile={perfilValido(perfil) ? perfil : "idoso"} code={crossing.code} address={crossing.address} canSend={source === "orion"} />
    </main>
  );
}
