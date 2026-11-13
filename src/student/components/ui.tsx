import { CalendarDays } from 'lucide-react';
import { CancellationRequest } from '../../supabase';

export function StatusBadge({ status }: { status: CancellationRequest['status'] }) {
  const labels = { pending: 'Aguardando', approved: 'Aprovado', rejected: 'Recusado' };
  return <span className={`request-status ${status}`}>{labels[status]}</span>;
}

export function EmptyPortal({ icon: Icon, title, text }: { icon: typeof CalendarDays; title: string; text: string }) {
  return <div className="empty-state small"><Icon size={30} /><h3>{title}</h3><p>{text}</p></div>;
}
