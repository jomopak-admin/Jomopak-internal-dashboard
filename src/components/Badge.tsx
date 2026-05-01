import { Client, JobCard } from '../types';
import { formatFlag } from '../utils/calculations';

export function StatusBadge({ status }: { status: JobCard['status'] }) {
  return <span className={`badge status-${status.toLowerCase().replace(/ /g, '-')}`}>{status}</span>;
}

export function FlagBadge({ value }: { value: boolean }) {
  return <span className={value ? 'badge badge-fsc' : 'badge badge-muted'}>{formatFlag(value)}</span>;
}

export function isClientOverCredit(client: Pick<Client, 'creditLimit' | 'currentBalance'>): boolean {
  return client.creditLimit > 0 && client.currentBalance > client.creditLimit;
}

export function isClientAtRisk(client: Pick<Client, 'creditLimit' | 'currentBalance' | 'accountHold'>): boolean {
  return client.accountHold || isClientOverCredit(client);
}

export function CommercialFlags({ client }: { client: Pick<Client, 'creditLimit' | 'currentBalance' | 'accountHold'> }) {
  const overCredit = isClientOverCredit(client);
  if (!client.accountHold && !overCredit) return null;
  return (
    <span className="commercial-flags">
      {client.accountHold ? <span className="badge badge-warn">On hold</span> : null}
      {overCredit ? <span className="badge badge-alert">Over credit</span> : null}
    </span>
  );
}
