import Link from "next/link";
import type { CrossingMetadata } from "@/types/crossing";

type CrossingCardProps = {
  code: string;
  address: string;
  width: number;
  currentSeconds: number;
  referenceSeconds?: number;
  simulated?: boolean;
  metadata?: CrossingMetadata;
  href: string;
};

export function CrossingCard({ code, address, width, currentSeconds, referenceSeconds, simulated, metadata, href }: CrossingCardProps) {
  return (
    <Link href={href} className="crossing-card">
      <span className="crossing-time"><strong>{currentSeconds}</strong><span>seg</span></span>
      <span className="crossing-description">
        <strong>{address}</strong>
        <span>Poste {code} · Travessia de {metadata ? width.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : width} m</span>
        <span>Tempo total atual: {currentSeconds} s</span>
        {metadata ? <span>Largura: Google Earth · Tempos estimados</span> : simulated ? <span>Dados simulados</span> : null}
        {referenceSeconds !== undefined ? <span>Referência a 0,75 m/s: {referenceSeconds} s</span> : null}
      </span>
      <svg className="crossing-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
