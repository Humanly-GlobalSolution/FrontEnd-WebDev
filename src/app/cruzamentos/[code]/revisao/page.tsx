import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewRequestForm } from "@/components/ReviewRequestForm";
import { findCrossing } from "@/services/crossings.server";

export default async function ReviewPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { crossing } = await findCrossing(code);
  if (!crossing) notFound();

  return (
    <main id="conteudo" tabIndex={-1} className="site-width review-page">
      <Link href={`/cruzamentos/${crossing.code}`} className="back-link">Voltar ao cruzamento</Link>
      <ReviewRequestForm code={crossing.code} address={crossing.address} />
    </main>
  );
}
