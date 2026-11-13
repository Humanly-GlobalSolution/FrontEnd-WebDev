"use client";

import { useEffect, useState } from "react";
import { calculateCrossingSeconds, filterCrossings } from "@/lib/crossings";
import { listCrossings } from "@/services/crossings";
import type { Crossing } from "@/types/crossing";

export function useCruzamentos() {
  const [crossings, setCrossings] = useState<Crossing[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await listCrossings(controller.signal);
        if (!controller.signal.aborted) setCrossings(result);
      } catch {
        if (!controller.signal.aborted) setError("Não foi possível carregar os cruzamentos. Tente novamente.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [attempt]);

  return {
    crossings: filterCrossings(crossings, query).map((crossing) => ({
      ...crossing,
      referenceSeconds: calculateCrossingSeconds(crossing.width),
    })),
    query,
    setQuery,
    loading,
    error,
    retry: () => setAttempt((current) => current + 1),
  };
}
