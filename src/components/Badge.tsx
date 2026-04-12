import { JobCard } from '../types';
import { formatFlag } from '../utils/calculations';

export function StatusBadge({ status }: { status: JobCard['status'] }) {
  return <span className={`badge status-${status.toLowerCase().replace(/ /g, '-')}`}>{status}</span>;
}

export function FlagBadge({ value }: { value: boolean }) {
  return <span className={value ? 'badge badge-fsc' : 'badge badge-muted'}>{formatFlag(value)}</span>;
}
