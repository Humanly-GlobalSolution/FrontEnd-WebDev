import Link from "next/link";

type CrossingCardProps = {
  code: string;
  address: string;
  width: number;
  currentSeconds: number;
  href: string;
};

export function CrossingCard({ code, address, width, currentSeconds, href }: CrossingCardProps) {
  return (
    <Link href={href} className="crossing-card">
      <span className="crossing-time"><strong>{currentSeconds}</strong><span>seg</span></span>
      <span className="crossing-description">
        <strong>{address}</strong>
        <span>Poste {code} · Travessia de {width} m</span>
      </span>
      <svg className="crossing-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
