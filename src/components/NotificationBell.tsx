import { useEffect, useRef, useState } from 'react';
import { Ban, Bell, CalendarDays, Check, ChevronRight, CircleDollarSign, ClipboardList, FileQuestion, Target, type LucideIcon } from 'lucide-react';

export type BellNotification = {
  id: string;
  kind: string;
  title: string;
  description: string;
  dateLabel: string;
  unread: boolean;
  urgent?: boolean;
};

const icons: Record<string, LucideIcon> = {
  lesson: CalendarDays, assignment: ClipboardList, quiz: FileQuestion, payment: CircleDollarSign,
  mission: Target, cancellation: Ban, system: Bell,
};
const PREVIEW_LIMIT = 6;

/**
 * Bell button with a notification popover (latest items, mark all as read, link to the full page).
 * Shared by the teacher and student top bars; each app maps its own notification type to BellNotification.
 */
export function NotificationBell({ items, unreadCount, onOpen, onMarkAll, onViewAll, className = '' }: {
  items: BellNotification[];
  unreadCount: number;
  onOpen: (id: string) => void;
  onMarkAll: () => void;
  onViewAll: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | TouchEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('touchstart', close); document.removeEventListener('keydown', escape); };
  }, [open]);
  const preview = items.slice(0, PREVIEW_LIMIT);

  return <div className="notification-bell" ref={rootRef}>
    <button type="button" className={`notification-button ${className}`} aria-label="Abrir notificações" aria-haspopup="dialog" aria-expanded={open} title="Notificações" onClick={() => setOpen((value) => !value)}>
      <Bell size={18} />{unreadCount > 0 && <span>{unreadCount > 9 ? '9+' : unreadCount}</span>}
    </button>
    {open && <section className="notification-popover" role="dialog" aria-label="Notificações">
      <header>
        <div><strong>Notificações</strong><small>{unreadCount ? `${unreadCount} não lida${unreadCount === 1 ? '' : 's'}` : 'Tudo em dia'}</small></div>
        {unreadCount > 0 && <button type="button" className="notification-popover-mark" onClick={onMarkAll}><Check size={14} />Marcar todas como lidas</button>}
      </header>
      {preview.length ? <ul>{preview.map((item) => {
        const Icon = icons[item.kind] ?? Bell;
        return <li key={item.id}><button type="button" className={`notification-popover-item ${item.unread ? 'unread' : ''} ${item.urgent ? 'urgent' : ''}`} onClick={() => { setOpen(false); onOpen(item.id); }}>
          <span className={`notification-icon ${item.kind}`}><Icon size={16} /></span>
          <span className="notification-popover-copy"><strong>{item.title}</strong><span>{item.description}</span><small>{item.dateLabel}</small></span>
          {item.unread && <i aria-label="Não lida" />}
        </button></li>;
      })}</ul> : <p className="notification-popover-empty">Nenhuma notificação por enquanto.</p>}
      <footer><button type="button" onClick={() => { setOpen(false); onViewAll(); }}>Ver todas as notificações<ChevronRight size={15} /></button></footer>
    </section>}
  </div>;
}
