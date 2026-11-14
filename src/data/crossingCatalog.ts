import type { Crossing, CrossingMetadata, CrossingLocationData } from "@/types/crossing";

// Larguras fornecidas por Eduardo, medidas no Google Earth. Tempos estimados.
// Coordenadas de referência verificadas nos nós públicos do OpenStreetMap.
export const crossingCatalog = {
  C02: {
    id: "urn:ngsi-ld:Cruzamento:C02", code: "C02",
    address: "Av. Paulista x Rua da Consolação", width: 27.4, currentSeconds: 35, simulated: true,
    metadata: {
      widthSource: "Google Earth", timingSource: "estimated", greenSeconds: 5, flashingSeconds: 30,
      latitude: -23.5556572, longitude: -46.6627851,
      locationSource: "https://www.openstreetmap.org/node/1421376041",
    },
  },
  C03: {
    id: "urn:ngsi-ld:Cruzamento:C03", code: "C03",
    address: "Av. Paulista x Av. Rebouças", width: 36.96, currentSeconds: 47, simulated: true,
    metadata: {
      widthSource: "Google Earth", timingSource: "estimated", greenSeconds: 5, flashingSeconds: 42,
      latitude: -23.55595, longitude: -46.6634004,
      locationSource: "https://www.openstreetmap.org/node/28149758",
      locationNote: "Referência no braço da Avenida Rebouças, junto ao entroncamento Paulista/Consolação.",
    },
  },
  C05: {
    id: "urn:ngsi-ld:Cruzamento:C05", code: "C05",
    address: "Av. Paulista x Av. Bernardino de Campos", width: 27.82, currentSeconds: 36, simulated: true,
    metadata: {
      widthSource: "Google Earth", timingSource: "estimated", greenSeconds: 5, flashingSeconds: 31,
      latitude: -23.5713665, longitude: -46.6443028,
      locationSource: "https://www.openstreetmap.org/node/60609866",
    },
  },
} satisfies Record<"C02" | "C03" | "C05", Crossing>;

function normalizedAddress(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replaceAll("×", "x").replace(/[^a-z0-9]+/g, " ").trim();
}

export function getCrossingMetadata(crossing: Crossing): CrossingMetadata | undefined {
  const code = crossing.code.toUpperCase();
  if (!Object.hasOwn(crossingCatalog, code)) return;
  const expected = crossingCatalog[code as keyof typeof crossingCatalog];
  // Não associar o mapa novo a um cadastro antigo enquanto o PATCH no Orion
  // aguarda autorização. Os valores do broker nunca são sobrescritos aqui.
  if (normalizedAddress(crossing.address) !== normalizedAddress(expected.address)
    || Math.abs(crossing.width - expected.width) > 0.000001
    || crossing.currentSeconds !== expected.currentSeconds) return;
  return { ...expected.metadata };
}


// Interseções confirmadas em 14/11/2026: ArcGIS, StreetInt, score 100.
// Localização independente das fontes de largura e tempo.
const additionalCrossingLocations = {
  C01: {
    "address": "Av. Paulista x Al. Joaquim Eugênio de Lima",
    "latitude": -23.56607709246,
    "longitude": -46.650806798903,
    "locationSource": "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine=Avenida+Paulista+%26+Alameda+Joaquim+Eug%C3%AAnio+de+Lima%2C+Bela+Vista%2C+S%C3%A3o+Paulo%2C+01310-100&f=pjson&outFields=Match_addr%2CAddr_type",
    "locationSourceLabel": "ArcGIS World Geocoding Service"
  },
  C04: {
    "address": "Av. Paulista x Av. Brigadeiro Luís Antônio",
    "latitude": -23.567577117853,
    "longitude": -46.648982058581,
    "locationSource": "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine=Avenida+Paulista+%26+Avenida+Brigadeiro+Lu%C3%ADs+Ant%C3%B4nio%2C+Bela+Vista%2C+S%C3%A3o+Paulo%2C+01310&f=pjson&outFields=Match_addr%2CAddr_type",
    "locationSourceLabel": "ArcGIS World Geocoding Service"
  }
} satisfies Record<"C01" | "C04", CrossingLocationData & { address: string }>;

export function getCrossingLocation(crossing: Crossing): CrossingLocationData | undefined {
  if (crossing.metadata) return crossing.metadata;
  const code = crossing.code.toUpperCase();
  if (!Object.hasOwn(additionalCrossingLocations, code)) return;
  const location = additionalCrossingLocations[code as keyof typeof additionalCrossingLocations];
  if (normalizedAddress(crossing.address) !== normalizedAddress(location.address)) return;
  return { ...location };
}
