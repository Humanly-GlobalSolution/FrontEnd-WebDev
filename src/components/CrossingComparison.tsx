"use client";
import { useState } from "react";
import Link from "next/link";
import { ProfileChoice } from "@/components/ProfileChoice";
import { CrossingIllustration } from "@/components/CrossingIllustration";
import { CARTOES, tempoGarantido, ondeParaNoFimDoVerde, type Perfil } from "@/lib/regras";
import type { CrossingMetadata } from "@/types/crossing";
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
export function CrossingComparison({ code, width, currentSeconds, metadata }: { code: string; width: number; currentSeconds: number; metadata?: CrossingMetadata }) {
  const [perfil, setPerfil] = useState<Perfil>("idoso");
  const [comFarolAmigo, setComFarolAmigo] = useState(false);
  const tipo = perfil === "pcd" ? "especial" : "senior";
  const cartao = CARTOES[tipo];
  const tempo = tempoGarantido(width, currentSeconds, tipo);
  const tempoAcrescentado = tempo - currentSeconds;
  const tempoExibido = comFarolAmigo ? tempo : currentSeconds;
  const distancia = ondeParaNoFimDoVerde(width, tempoExibido, cartao.ritmo);
  return <div className="comparison">
    <ProfileChoice value={perfil} onChange={setPerfil} />
    <div id={`comparison-summary-${code}`} className="comparison-summary" aria-live="polite" aria-atomic="true"><strong>{tempoExibido} <span>s</span></strong><p>{comFarolAmigo ? `Com o ${cartao.rotulo}, você tem ${tempoExibido} s para atravessar.` : `Sem o Farol Amigo, o tempo de hoje é ${tempoExibido} s para atravessar.`}</p></div>
    <p>{comFarolAmigo ? "É só encostar o cartão no poste antes de atravessar." : "Selecione Com o Farol Amigo para ver o tempo ajustado para você."}</p>
    <div className="comparison-switch" role="group" aria-label="Comparar tempo de travessia">
      <button type="button" aria-pressed={!comFarolAmigo} aria-controls={`comparison-summary-${code} comparison-content-${code}`} onClick={() => setComFarolAmigo(false)}>Sem o Farol Amigo</button>
      <button type="button" aria-pressed={comFarolAmigo} aria-controls={`comparison-summary-${code} comparison-content-${code}`} onClick={() => setComFarolAmigo(true)}>Com o Farol Amigo</button>
    </div>
    <section id={`comparison-content-${code}`} className="comparison-panel" aria-labelledby={`comparison-title-${code}`} aria-live="polite" aria-atomic="true">
      <h2 id={`comparison-title-${code}`}>{comFarolAmigo ? "Com o Farol Amigo, você chega ao outro lado" : "Onde você está no fim do verde de hoje"}</h2>
      <p>{comFarolAmigo ? `Você tem ${tempoExibido} s para atravessar ${decimal.format(width)} m.` : `Hoje, o tempo cadastrado é de ${currentSeconds} s para atravessar ${decimal.format(width)} m.`}</p>
      {comFarolAmigo ? <>
        <p className="comparison-added">{tempoAcrescentado > 0 ? `${currentSeconds} s de hoje + ${tempoAcrescentado} s acrescentados = ${tempo} s para atravessar.` : "O tempo de hoje já é suficiente. Nenhum segundo precisa ser acrescentado."}</p>
        <div className="comparison-timeline" aria-hidden="true">
          <span className="timeline-normal" style={{ width: `${currentSeconds / tempo * 100}%` }} />
          {tempoAcrescentado > 0 ? <span className="timeline-extra" /> : null}
        </div>
        <div className="timeline-labels"><span>Tempo de hoje: {currentSeconds} s</span><span>Tempo acrescentado: +{tempoAcrescentado} s</span><span>Total: {tempo} s</span></div>
      </> : null}
      <CrossingIllustration width={width} adultPercent={ondeParaNoFimDoVerde(width, tempoExibido, 1.2) / width * 100} referencePercent={distancia / width * 100} measured={Boolean(metadata)} referenceLabel="P" />
      <p>A: referência adulta. P: pessoa com o cartão escolhido.</p>
      <p>{cartao.publico}: {decimal.format(distancia)} m de {decimal.format(width)} m. {distancia < width ? `Faltam ${decimal.format(width - distancia)} m para chegar ao outro lado.` : "Você chega ao outro lado."}</p>
    </section>
    <p className="comparison-disclaimer">Simulação educativa com o tempo cadastrado no cruzamento. A comparação não altera o semáforo real. Ao atravessar, observe a sinalização da via.</p>
    <Link className="button button-primary review-placeholder" href={`/cruzamentos/${code}/revisao?perfil=${cartao.perfil}`}>Pedir revisão do tempo</Link>
    <p className="field-hint">Preencha e confira o formulário antes de enviar. Não é necessário informar seu nome.</p>
  </div>;
}
