export type Crossing = {
  id: string;
  code: string;
  address: string;
  width: number;
  currentSeconds: number;
};

export type CrossingsSource = "demo" | "orion";
export type CrossingsResponse = { source: CrossingsSource; crossings: Crossing[] };
