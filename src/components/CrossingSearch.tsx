"use client";

import { Button } from "@/components/Button";
import { CrossingCard } from "@/components/CrossingCard";
import { TextField } from "@/components/TextField";
import { useCruzamentos } from "@/hooks/useCruzamentos";

export function CrossingSearch() {
  const { crossings, query, setQuery, loading, error, retry } = useCruzamentos();

  return (
    <section className="site-width crossing-search" aria-labelledby="search-title">
      <TextField label="Onde fica o farol?" type="search" placeholder="Rua ou código do poste" hint="Ex.: Paulista ou C01. A busca não usa sua localização." value={query} onChange={(event) => setQuery(event.target.value)} aria-controls="crossing-results" />
      <h2 id="search-title">{query.trim() ? "Resultado da busca" : "Cruzamentos de exemplo"}</h2>
      <p className="demo-notice">Demonstração: códigos, larguras e tempos simulados. Não são dados ao vivo da CET.</p>
      <p className="search-feedback" role="status">
        {loading ? "Carregando cruzamentos…" : error ? "Não foi possível carregar a lista." : `${crossings.length} ${crossings.length === 1 ? "cruzamento encontrado" : "cruzamentos encontrados"}.`}
      </p>
      <div id="crossing-results" aria-busy={loading}>
        {error ? (
          <div className="search-error"><p role="alert">{error}</p><Button variant="secondary" onClick={retry}>Tentar novamente</Button></div>
        ) : !loading && crossings.length === 0 ? (
          <div className="empty-results"><h3>Nenhum cruzamento encontrado</h3><p>Tente outra rua ou um código como C01.</p><Button variant="secondary" onClick={() => setQuery("")}>Limpar busca</Button></div>
        ) : (
          <ul className="crossing-list">
            {crossings.map((crossing) => <li key={crossing.id}><CrossingCard {...crossing} href={`/cruzamentos/${crossing.code}`} /></li>)}
          </ul>
        )}
      </div>
      <p className="unavailable-notice">O envio e o acompanhamento de pedidos ainda não estão disponíveis.</p>
    </section>
  );
}
