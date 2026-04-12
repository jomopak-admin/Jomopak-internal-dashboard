interface StatCardProps {
  label: string;
  value: string;
  helper?: string;
}

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="card stat-card">
      <p className="stat-label">{label}</p>
      <h3>{value}</h3>
      {helper ? <p className="muted">{helper}</p> : null}
    </div>
  );
}
