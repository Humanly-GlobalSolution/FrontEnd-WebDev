type CrossingIllustrationProps = {
  width: number;
  adultPercent: number;
  referencePercent: number;
  measured?: boolean;
  referenceLabel?: string;
};

export function CrossingIllustration({ width, adultPercent, referencePercent, measured, referenceLabel = "I" }: CrossingIllustrationProps) {
  const distance = (value: number) => measured ? value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value;
  return (
    <div className="crossing-illustration" aria-hidden="true">
      <div className="crossing-road">
        <div className="zebra-stripes">
          {Array.from({ length: 19 }, (_, index) => <span key={index} />)}
        </div>
        <div className="crossing-midpoint" />
        <div className="pedestrian-lane adult-lane"><span className="pedestrian-marker adult-marker" style={{ left: `${adultPercent}%` }}>A</span></div>
        <div className="pedestrian-lane reference-lane"><span className="pedestrian-marker reference-marker" style={{ left: `${referencePercent}%` }}>{referenceLabel}</span></div>
      </div>
      <div className="distance-labels"><span>0 m</span><span>Metade: {distance(width / 2)} m</span><span>{distance(width)} m</span></div>
    </div>
  );
}
