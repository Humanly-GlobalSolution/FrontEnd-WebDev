import type { CrossingMetadata } from "@/types/crossing";

export function CrossingLocation({ address, metadata }: { address: string; metadata: CrossingMetadata }) {
  const { latitude, longitude } = metadata;
  const marker = `${latitude},${longitude}`;
  const query = new URLSearchParams({
    bbox: `${longitude - 0.0015},${latitude - 0.0009},${longitude + 0.0015},${latitude + 0.0009}`,
    layer: "mapnik", marker,
  });
  const mapUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=19/${latitude}/${longitude}`;

  return <section className="crossing-location" aria-labelledby="location-title">
    <h2 id="location-title">Localização do cruzamento</h2>
    <p>{address}</p>
    <iframe title={`Mapa de ${address}`} src={`https://www.openstreetmap.org/export/embed.html?${query}`} loading="lazy" referrerPolicy="no-referrer" />
    <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="button button-secondary">Abrir localização no mapa</a>
    <p className="field-hint">Referência cartográfica: <a href={metadata.locationSource} target="_blank" rel="noopener noreferrer">OpenStreetMap</a>. O marcador representa a localização do cruzamento, não uma medição da faixa.</p>
    {metadata.locationNote ? <p className="field-hint">{metadata.locationNote}</p> : null}
  </section>;
}
