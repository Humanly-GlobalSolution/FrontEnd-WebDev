export type CrossingMetadata = {
  widthSource: "Google Earth";
  timingSource: "estimated";
  greenSeconds: number;
  flashingSeconds: number;
  latitude: number;
  longitude: number;
  locationSource: string;
  locationNote?: string;
};

export type Crossing = {
  id: string;
  code: string;
  address: string;
  width: number;
  /** Tempo total informado para a travessia; não somar o piscante novamente. */
  currentSeconds: number;
  simulated?: boolean;
  metadata?: CrossingMetadata;
};

export type CrossingsSource = "demo" | "orion";
export type CrossingsResponse = { source: CrossingsSource; crossings: Crossing[] };
