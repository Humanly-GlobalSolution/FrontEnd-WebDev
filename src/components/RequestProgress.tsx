export function RequestProgress({ step }: { step: 1 | 2 }) {
  return (
    <div className="request-progress">
      <p id="request-progress-label">Passo {step} de 2 · {step === 1 ? "Conte o que acontece" : "Confira seu pedido"}</p>
      <progress aria-labelledby="request-progress-label" max={2} value={step} />
    </div>
  );
}
