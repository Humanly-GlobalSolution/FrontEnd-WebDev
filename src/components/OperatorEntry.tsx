"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { requestJson } from "@/lib/httpClient";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { OperatorDashboard } from "@/components/OperatorDashboard";

export function OperatorEntry() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const expired = useCallback(() => { setAuthenticated(false); setError("Sua sessão terminou. Informe o código para entrar novamente."); }, []);
  useEffect(() => {
    const controller = new AbortController();
    requestJson("/api/painel/sessao", { signal: controller.signal, cache: "no-store" }, { fallbackMessage: "Não foi possível verificar seu acesso. Tente entrar novamente." })
      .then((result) => { if (!controller.signal.aborted) setAuthenticated(result.authenticated === true); })
      .catch((failure) => { if (!controller.signal.aborted) setError(failure.message); })
      .finally(() => { if (!controller.signal.aborted) setChecking(false); });
    return () => controller.abort();
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    if (!code.trim()) { setError("Informe o código de acesso do operador."); input.current?.focus(); return; }
    setLoading(true); setError(null);
    try {
      const result = await requestJson("/api/painel/sessao", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) }, { fallbackMessage: "Não foi possível confirmar o acesso. Tente novamente." });
      if (result.authenticated !== true) throw new Error("Não foi possível confirmar o acesso.");
      setCode(""); setAuthenticated(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível entrar.");
      input.current?.focus();
    } finally { setLoading(false); }
  }

  if (authenticated) return <OperatorDashboard onExpired={expired} onLogout={() => { setAuthenticated(false); setError(null); }} />;
  return (
    <section className="operator-access" aria-labelledby="operator-title">
      <h1 id="operator-title">Painel do operador</h1>
      <p>Acompanhe os cruzamentos e atenda os pedidos de revisão do Farol Amigo.</p>
      {checking ? <p role="status">Verificando acesso…</p> : <form onSubmit={login} aria-busy={loading}>
        <TextField inputRef={input} label="Código de acesso" name="codigo-operador" type="password" value={code} onChange={(event) => setCode(event.target.value)} disabled={loading} autoComplete="current-password" maxLength={512} hint="Acesso reservado à equipe responsável. O cidadão não precisa de código para fazer um pedido." />
        {error ? <p className="field-error" role="alert">{error}</p> : null}
        <Button type="submit" loading={loading}>Entrar no painel</Button>
      </form>}
      <p className="field-hint">A sessão é encerrada após oito horas. Use “Sair” ao terminar em um computador compartilhado.</p>
    </section>
  );
}
