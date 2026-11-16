import { CrossingSearch } from "@/components/CrossingSearch";
import { PedestrianGlyph } from "@/components/PedestrianGlyph";

export default function Home() {
  return (
    <main id="conteudo" tabIndex={-1}>
      <section className="intro" aria-labelledby="intro-title">
        <div className="site-width intro-content">
          <h1 id="intro-title">Achou o tempo<br className="desktop-break" /> do farol curto?</h1>
          <p>Escolha o cruzamento e peça a revisão do tempo. Você não precisa dizer seu nome.</p>
          <div className="crosswalk" aria-hidden="true">
            {Array.from({ length: 13 }, (_, index) => (
              <span key={index} className={index > 8 ? "extra-time" : undefined} />
            ))}
            <div className="crosswalk-traveler">
              <svg className="crosswalk-pedestrian" viewBox="0 0 48 48" fill="none">
                <PedestrianGlyph />
              </svg>
            </div>
          </div>
        </div>
      </section>
      <CrossingSearch />
    </main>
  );
}
