const statusLabels = {
  normal: "Normal",
  extended: "Estendido",
  alert: "Alerta",
  maintenance: "Em manutenção",
  sent: "Enviado",
  reviewing: "Em análise",
  answered: "Respondido",
} as const;

export function StatusBadge({ status }: { status: keyof typeof statusLabels }) {
  return (
    <span className={`status-badge status-${status}`}>
      <span className="status-dot" aria-hidden="true" />
      {statusLabels[status]}
    </span>
  );
}
