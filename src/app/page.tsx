export default function Home() {
  return (
    <main id="conteudo" tabIndex={-1}>
      <section className="intro" aria-labelledby="intro-title">
        <div className="site-width intro-content">
          <h1 id="intro-title">Achou o tempo<br className="desktop-break" /> do farol curto?</h1>
          <p>Escolha o cruzamento e avise a CET. Você não precisa dizer seu nome.</p>
          <div className="crosswalk" aria-hidden="true">
            {Array.from({ length: 13 }, (_, index) => (
              <span key={index} className={index > 8 ? "extra-time" : undefined} />
            ))}
          </div>
        </div>
      </section>
      <section className="site-width development-notice" aria-labelledby="development-title">
        <h2 id="development-title">Estamos preparando o site para você</h2>
        <p>Em breve, você poderá consultar os tempos de travessia e criar, acompanhar, editar ou cancelar um pedido de revisão.</p>
        <p>O envio de pedidos ainda não está disponível neste protótipo.</p>
      </section>
    </main>
  );
}
