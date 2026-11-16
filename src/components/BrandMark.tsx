import { PedestrianGlyph } from "@/components/PedestrianGlyph";

/** Official mark, shared by the header and the pre-loader's car display. */
export function BrandMark() {
  return (
    <g>
      <circle cx="24" cy="24" r="20" stroke="var(--color-signal)" strokeWidth="4" strokeDasharray="96 30" strokeLinecap="round" transform="rotate(-90 24 24)" />
      <path d="M6 18a20 20 0 0 1 10-12" stroke="var(--color-road)" strokeWidth="4" strokeLinecap="round" />
      <PedestrianGlyph />
    </g>
  );
}
