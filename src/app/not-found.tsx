import Link from "next/link";

export default function NotFound() {
  return (
    <main id="conteudo" tabIndex={-1} className="site-width crossing-detail">
      <h1>Não encontramos esta página</h1>
      <p className="preview-description">O endereço ou código do cruzamento pode estar incorreto.</p>
      <Link href="/" className="back-link">Voltar e buscar um cruzamento</Link>
    </main>
  );
}
