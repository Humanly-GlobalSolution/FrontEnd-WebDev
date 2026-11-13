type CrossingIllustrationProps = {
  width: number;
  adultPercent: number;
  referencePercent: number;
};

export function CrossingIllustration({ width, adultPercent, referencePercent }: CrossingIllustrationProps) {
  return (
    <div className="crossing-illustration" aria-hidden="true">
      <div className="crossing-road">
        <div className="zebra-stripes">
          {Array.from({ length: 19 }, (_, index) => <span key={index} />)}
        </div>
        <div className="crossing-midpoint" />
        <div className="pedestrian-lane adult-lane"><span className="pedestrian-marker adult-marker" style={{ left: `${adultPercent}%` }}>A</span></div>
        <div className="pedestrian-lane reference-lane"><span className="pedestrian-marker reference-marker" style={{ left: `${referencePercent}%` }}>I</span></div>
      </div>
      <div className="distance-labels"><span>0 m</span><span>Metade: {width / 2} m</span><span>{width} m</span></div>
    </div>
  );
}
