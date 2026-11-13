"use client";

import { useCallback, useRef, useState } from "react";
import { editReviewRequest, fetchReviewRequest, sendReviewRequest } from "@/services/reviewRequests";
import type { CreatedReviewRequest, ReviewRequestDetails, ReviewRequestDraft, ReviewRequestEdit } from "@/types/reviewRequest";

export function usePedido() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdRequest, setCreatedRequest] = useState<CreatedReviewRequest | null>(null);
  const [foundRequest, setFoundRequest] = useState<ReviewRequestDetails | null>(null);
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

  const lookup = useCallback(async (protocol: string) => {
    if (pending.current) return null;
    pending.current = true;
    setLoading(true);
    setError(null);
    setFoundRequest(null);
    try {
      const result = await fetchReviewRequest(protocol);
      setFoundRequest(result);
      return result;
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível consultar o pedido. Tente novamente.");
      return null;
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }, []);

  async function update(protocol: string, changes: ReviewRequestEdit) {
    if (pending.current) return null;
    pending.current = true;
    setLoading(true);
    setError(null);
    try {
      const result = await editReviewRequest(protocol, changes);
      setFoundRequest(result);
      return result;
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível salvar as alterações. Tente novamente.");
      return null;
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }

  return { create, resetDraft, lookup, update, clearError: () => setError(null), loading, error, createdRequest, foundRequest };
}
