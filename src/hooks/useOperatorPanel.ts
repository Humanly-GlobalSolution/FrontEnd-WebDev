"use client";

import { useEffect, useState } from "react";
import { HttpClientError } from "@/lib/httpClient";
import { loadOperatorSnapshot } from "@/services/operator";

export function useOperatorPanel(offset: number, onExpired: () => void) {
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof loadOperatorSnapshot>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    async function load() {
      if (pending || controller.signal.aborted) return;
      pending = true;
      setRefreshing(true);
      try {
        const result = await loadOperatorSnapshot(offset, controller.signal);
        if (!controller.signal.aborted) { setSnapshot(result); setError(null); }
      } catch (failure) {
        if (!controller.signal.aborted) {
          if (failure instanceof HttpClientError && failure.status === 401) onExpired();
          else setError(failure instanceof Error ? failure.message : "Não foi possível atualizar o painel.");
        }
      } finally {
        pending = false;
        if (!controller.signal.aborted) setRefreshing(false);
      }
    }
    void load();
    const timer = setInterval(() => { if (document.visibilityState !== "hidden") void load(); }, 5000);
    const resume = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", resume);
    return () => { controller.abort(); clearInterval(timer); document.removeEventListener("visibilitychange", resume); };
  }, [offset, attempt, onExpired]);
  return { snapshot, error, refreshing, refresh: () => setAttempt((value) => value + 1) };
}
