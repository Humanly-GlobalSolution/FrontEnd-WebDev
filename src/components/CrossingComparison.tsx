"use client";
import { useState } from "react";
import Link from "next/link";
import { CrossingIllustration } from "@/components/CrossingIllustration";
import { compareCrossing, type WalkingProfile, type CrossingActivation } from "@/lib/crossings";
import type { CrossingMetadata } from "@/types/crossing";
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const profiles = { adult: "Adulto", elderly: "Pessoa idosa", reducedMobility: "Pessoa com deficiência ou mobilidade reduzida" };
export function CrossingComparison({ code, width, currentSeconds, metadata }: { code: string; width: number; currentSeconds: number; metadata?: CrossingMetadata }) {
  const [extended, setExtended] = useState(false);
  const [profile, setProfile] = useState<WalkingProfile>("elderly");
  const [activation, setActivation] = useState<CrossingActivation>("card");
  const comparison = compareCrossing(width, currentSeconds, extended, profile, activation, code);
  const accessiblePilot = code.toUpperCase() === "C01" && profile !== "adult";
  return <div className="comparison">
    <div className="comparison-summary" aria-live="polite" aria-atomic="true">
      <strong>{comparison.seconds} <span>s</span></strong>
      <p>{extended ? "com o Farol Amigo" : "sem o Farol Amigo"}<br /><b>para atravessar {decimal.format(width)} m</b></p>
    </div>
    {metadata ? <p className="field-hint">Tempo estimado: {metadata.greenSeconds} s de verde + {metadata.flashingSeconds} s de vermelho piscante = {currentSeconds} s totais. Não são tempos oficiais da CET.</p> : null}
    <div className="field comparison-extension">
      <label htmlFor={`profile-${code}`}>Quem atravessa?</label>
      <select className="text-input" id={`profile-${code}`} value={profile} onChange={(event) => setProfile(event.target.value as WalkingProfile)}>
        {Object.entries(profiles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </div>
    <div className="field comparison-extension">
      <label htmlFor={`activation-${code}`}>Como a travessia é solicitada?</label>
      <select className="text-input" id={`activation-${code}`} value={activation} onChange={(event) => setActivation(event.target.value as CrossingActivation)} aria-describedby={`activation-hint-${code}`}>
        <option value="button">Botão</option><option value="sensor">Sensor</option><option value="card">Cartão Especial/Sênior</option>
      </select>
      <p className="field-hint" id={`activation-hint-${code}`}>Botão, sensor e cartão usam o mesmo tempo para o perfil selecionado. A forma de solicitar não muda o cálculo.</p>
    </div>
    <div className="comparison-switch" role="group" aria-label="Comparar tempo de travessia">
      <button type="button" aria-pressed={!extended} aria-controls="comparison-content" onClick={() => setExtended(false)}>Sem o Farol Amigo</button>
      <button type="button" aria-pressed={extended} aria-controls="comparison-content" onClick={() => setExtended(true)}>Com o Farol Amigo</button>
    </div>
    <section id="comparison-content" className="comparison-panel" aria-labelledby="comparison-title" aria-live="polite" aria-atomic="true">
      <h2 id="comparison-title">Onde a pessoa está ao fim do tempo disponível</h2>
      <CrossingIllustration width={width} adultPercent={comparison.adultPercent} referencePercent={comparison.referencePercent} measured={Boolean(metadata)} referenceLabel="P" />
      <div className="comparison-timeline" aria-hidden="true">
        <span style={{ width: `${currentSeconds / comparison.proposedSeconds * 100}%` }} className="timeline-normal" />
        {comparison.proposedSeconds > currentSeconds ? <span className="timeline-extra" /> : null}
      </div>
      <div className="timeline-labels"><span>Atual: {currentSeconds} s</span><span>Garantia: {comparison.guaranteedSeconds} s + extensão: {comparison.extraSeconds} s = {comparison.proposedSeconds} s</span></div>
      <ul className="comparison-legend">
        <li><span className="legend-letter adult-marker" aria-hidden="true">A</span><span>Referência adulta a 1,2 m/s no mesmo tempo: {decimal.format(comparison.adultDistance)} m de {decimal.format(width)} m.</span></li>
        <li><span className="legend-letter reference-marker" aria-hidden="true">P</span><span>{profiles[profile]} a {decimal.format(comparison.speed)} m/s: {decimal.format(comparison.referenceDistance)} m; {comparison.referenceRemaining < 0.000000001 ? "conclui a travessia." : `faltam ${decimal.format(comparison.referenceRemaining)} m.`}</span></li>
      </ul>
      {comparison.alert ? <p className="error-message" role="status">Alerta simulado ao operador: a extensão de 15 s não basta para concluir a travessia neste perfil. Não é uma autorização para liberar veículos.</p> : null}
    </section>
    <aside className="comparison-explanation">
      <h2>Como calculamos o tempo</h2>
      <p>Este perfil precisa de {decimal.format(comparison.requiredSeconds)} s. Pelo {activation === "card" ? "cartão" : activation === "sensor" ? "sensor" : "botão"}, a garantia é {comparison.guaranteedSeconds} s. A falta é {decimal.format(comparison.missingSeconds)} s; a extensão calculada é {comparison.extraSeconds} s, em blocos de 3 s até 15 s. Sem falta, não há extensão.</p>
      <p>{accessiblePilot ? `No piloto C01, os perfis idoso e PcD recebem uma garantia de ${comparison.guaranteedSeconds} s, calculada a 0,75 m/s e nunca menor que o tempo atual. A PcD pode receber extensão adicional, em blocos de 3 s até 15 s. Essa garantia acessível é separada do teto da extensão.` : "Nos três acionamentos, a base é o tempo atual cadastrado. O acréscimo depende da largura e do perfil selecionado, em blocos de 3 s até 15 s."} O sensor é representado pela distância restante no modelo; o site não mede a velocidade de pessoas reais.</p>
    </aside>
    <p className="comparison-disclaimer">O tempo atual já inclui verde e vermelho piscante. Simulação educativa, sem sinal ao vivo, comandos ao semáforo, gravação de extensões ou envio real de alertas. As velocidades são hipóteses do modelo e variam entre pessoas. Ao atravessar, observe a sinalização da via.</p>
    <Link className="button button-primary review-placeholder" href={`/cruzamentos/${code}/revisao`}>Pedir revisão do tempo</Link>
    <p className="field-hint">Preencha e confira o formulário antes de enviar. Não é necessário informar seu nome.</p>
  </div>;
}
