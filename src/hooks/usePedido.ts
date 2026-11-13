"use client";

import { useRef, useState } from "react";
import { sendReviewRequest } from "@/services/reviewRequests";
import type { CreatedReviewRequest, ReviewRequestDraft } from "@/types/reviewRequest";

export function usePedido() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdRequest, setCreatedRequest] = useState<CreatedReviewRequest | null>(null);
  const pending = useRef(false);
  const key = useRef<string | null>(null);

  async function create(draft: ReviewRequestDraft) {
    if (pending.current) return null;
    pending.current = true;
    setLoading(true);
    setError(null);
    try {
      key.current ??= crypto.randomUUID();
      const result = await sendReviewRequest(draft, key.current);
      setCreatedRequest(result);
      return result;
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível enviar. Tente novamente nesta página.");
      return null;
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }

  function resetDraft() {
    key.current = null;
    setError(null);
  }

  return { create, resetDraft, loading, error, createdRequest };
}
