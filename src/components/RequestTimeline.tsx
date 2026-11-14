import type { ReviewRequestDetails } from "@/types/reviewRequest";

const steps = [
  { value: "enviado", label: "Enviado" },
  { value: "em_analise", label: "Em análise" },
  { value: "respondido", label: "Respondido" },
] as const;

export function RequestTimeline({ request }: { request: ReviewRequestDetails }) {
  const current = steps.findIndex((step) => step.value === request.status);
  return (
    <section className="request-section" aria-labelledby="timeline-title">
      <h2 id="timeline-title">Andamento</h2>
      <ol className="request-timeline">
        {steps.map((step, index) => {
          const date = index === 0 ? request.createdAt : undefined;
          return (
          <li key={step.value} className={index <= current ? "timeline-reached" : undefined} aria-current={index === current ? "step" : undefined}>
            <span className="timeline-step-mark" aria-hidden="true">{index + 1}</span>
            <div><h3>{step.label}{index === current ? <span className="sr-only"> — status atual</span> : null}</h3>
              {index <= current && date ? <time dateTime={date}>{new Date(date).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })}</time> : <p>{index === current ? "Status informado pelo Orion." : index < current ? "Etapa anterior ao status atual." : "Ainda não informado."}</p>}
            </div>
          </li>
          );
        })}
      </ol>
    </section>
  );
}
