import { Ban, Bell, CalendarDays, Check, ChevronRight, CircleDollarSign, ClipboardList, FileQuestion, GraduationCap, Target } from 'lucide-react';
import { formatNotificationDate } from '../../lib/format';
import { type AppNotification, type NotificationKind } from '../../types';

export function NotificationsPage({ notifications, readIds, onOpen, onMarkAll }: { notifications: AppNotification[]; readIds: string[]; onOpen: (notification: AppNotification) => void; onMarkAll: () => void }) {
  const unread = notifications.filter((item) => !readIds.includes(item.id)).length;
  const iconFor = (kind: NotificationKind) => kind === 'lesson' ? CalendarDays : kind === 'assignment' ? ClipboardList : kind === 'quiz' ? FileQuestion : kind === 'assessment' ? GraduationCap : kind === 'payment' ? CircleDollarSign : kind === 'mission' ? Target : kind === 'system' ? Bell : Ban;
  return <section className="notifications-page">
    <div className="panel notifications-panel">
      <div className="panel-heading notifications-heading"><div><p className="eyebrow">CENTRAL</p><h3>Notificações</h3><p>Acompanhe o que precisa da sua atenção agora.</p></div>{unread > 0 && <button className="secondary-button compact" onClick={onMarkAll}><Check size={16} />Marcar todas como lidas</button>}</div>
      <div className="notification-summary"><div><Bell size={22} /><span><strong>{unread}</strong><small>não lida(s)</small></span></div><div><CalendarDays size={22} /><span><strong>{notifications.filter((item) => item.kind === 'lesson').length}</strong><small>aulas próximas</small></span></div><div><Target size={22} /><span><strong>{notifications.filter((item) => item.urgent).length}</strong><small>itens prioritários</small></span></div></div>
      {notifications.length ? <div className="notification-list">{notifications.map((notification) => { const Icon = iconFor(notification.kind); const isRead = readIds.includes(notification.id); return <button key={notification.id} className={`notification-card ${isRead ? 'read' : 'unread'} ${notification.urgent ? 'urgent' : ''}`} onClick={() => onOpen(notification)}><span className={`notification-icon ${notification.kind}`}><Icon size={20} /></span><span className="notification-copy"><span><strong>{notification.title}</strong>{!isRead && <i>Novo</i>}</span><p>{notification.description}</p><small>{formatNotificationDate(notification.date)}</small></span><ChevronRight size={18} /></button>; })}</div> : <div className="empty-state"><Check size={38} /><h3>Tudo em dia!</h3><p>Quando houver aulas próximas ou pendências, elas aparecerão aqui.</p></div>}
    </div>
  </section>;
}
