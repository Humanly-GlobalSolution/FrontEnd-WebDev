import Link from "next/link";
import { PedestrianGlyph } from "@/components/PedestrianGlyph";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Farol Amigo — início">
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className="brand-symbol">
        <circle cx="24" cy="24" r="20" stroke="var(--color-signal)" strokeWidth="4" strokeDasharray="96 30" strokeLinecap="round" transform="rotate(-90 24 24)" />
        <path d="M6 18a20 20 0 0 1 10-12" stroke="var(--color-road)" strokeWidth="4" strokeLinecap="round" />
        <PedestrianGlyph />
      </svg>
      <span>Farol Amigo</span>
    </Link>
  );
}
