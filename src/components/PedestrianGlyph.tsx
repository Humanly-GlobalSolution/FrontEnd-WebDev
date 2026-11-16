/** Shared geometry keeps the crossing pedestrian identical to the brand. */
export function PedestrianGlyph() {
  return (
    <g className="pedestrian-body">
      <circle cx="26" cy="12" r="3" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path className="pedestrian-arm-front" d="m22 19 5 5 7 1" />
        <path className="pedestrian-arm-back" d="m23 18-5 7-5 2" />
        <path d="m24 18-3 12" />
        <path className="pedestrian-leg-front" d="m21 30 7 9" />
        <path className="pedestrian-leg-back" d="m21 30-5 9" />
      </g>
    </g>
  );
}
