"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { CrossingIllustration } from "@/components/CrossingIllustration";
import { compareCrossing } from "@/lib/crossings";

const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

function distanceDescription(distance: number, remaining: number) {
  return remaining === 0
    ? "chega ao outro lado."
    : `chega a ${decimal.format(distance)} m; faltam ${decimal.format(remaining)} m.`;
}

export function CrossingComparison({ width, currentSeconds }: { width: number; currentSeconds: number }) {
  const [extended, setExtended] = useState(false);
  const comparison = compareCrossing(width, currentSeconds, extended);
  const normalRatio = (currentSeconds / comparison.proposedSeconds) * 100;

  return (
    <div className="comparison">
      <div className="comparison-summary" aria-live="polite" aria-atomic="true">
        <strong>{comparison.seconds} <span>s</span></strong>
        <p>{extended ? "na proposta do Farol Amigo" : "de verde no exemplo atual"}<br /><b>para atravessar {width} m</b></p>
      </div>

      <div className="comparison-switch" role="group" aria-label="Comparar tempo de travessia">
        <button type="button" aria-pressed={!extended} aria-controls="comparison-content" onClick={() => setExtended(false)}>Hoje</button>
        <button type="button" aria-pressed={extended} aria-controls="comparison-content" onClick={() => setExtended(true)}>Com o Farol Amigo</button>
      </div>

      <section id="comparison-content" className="comparison-panel" aria-labelledby="comparison-title">
        <h2 id="comparison-title">{extended ? "Com mais tempo, a travessia muda" : "Onde cada pessoa está quando o verde acaba"}</h2>
        <CrossingIllustration width={width} adultPercent={comparison.adultPercent} referencePercent={comparison.referencePercent} />
        <div className="comparison-timeline" aria-hidden="true">
          <span style={{ width: `${normalRatio}%` }} className="timeline-normal" />
          {comparison.extraSeconds > 0 ? <span className={extended ? "timeline-extra" : "timeline-shortfall"} /> : null}
        </div>
        <div className="timeline-labels">
          <span>0 a {currentSeconds} s: tempo atual</span>
          {comparison.extraSeconds > 0 ? <span>{currentSeconds} a {comparison.proposedSeconds} s: {extended ? "tempo adicional proposto" : "tempo que falta no exemplo"}</span> : null}
        </div>
        <ul className="comparison-legend">
          <li><span className="legend-letter adult-marker" aria-hidden="true">A</span><span>Adulto a 1,2 m/s: {distanceDescription(comparison.adultDistance, comparison.adultRemaining)}</span></li>
          <li><span className="legend-letter reference-marker" aria-hidden="true">I</span><span>Idoso na referência de 0,75 m/s: {distanceDescription(comparison.referenceDistance, comparison.referenceRemaining)}</span></li>
        </ul>
      </section>

      <aside className="comparison-explanation">
        <h2>{extended ? "Tempo para atravessar no seu ritmo" : "Por que o tempo faz diferença?"}</h2>
        <p>{extended
          ? `Neste modelo, a proposta considera ${comparison.proposedSeconds} s, sem reduzir o tempo atual. O cálculo usa a largura da via e a velocidade de referência de 0,75 m/s.`
          : "Pessoas diferentes caminham em ritmos diferentes. O Farol Amigo propõe tempo adequado com o Bilhete Único Sênior ou Especial e sensores para identificar quem ainda está atravessando."}</p>
      </aside>
      <p className="comparison-disclaimer">Simulação educativa, sem informação do sinal ao vivo. Ao atravessar, observe a sinalização da via. A velocidade de cada pessoa pode variar.</p>
      <Button className="review-placeholder" disabled>Pedir revisão do tempo</Button>
      <p className="field-hint">O formulário de revisão será disponibilizado na próxima etapa.</p>
    </div>
  );
}
