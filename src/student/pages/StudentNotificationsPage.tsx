import { Ban, Bell, CalendarDays, Check, ChevronRight, ClipboardList, FileQuestion, GraduationCap, Target } from 'lucide-react';
import { formatNotificationDate } from '../../lib/format';
import { type StudentNotification } from '../../lib/notifications';

export function StudentNotificationsPage({ notifications, onOpen, onMarkAll }: { notifications: StudentNotification[]; onOpen: (notification: StudentNotification) => void; onMarkAll: () => void }) {
  const unread = notifications.filter((item) => !item.readAt).length;
  const iconFor = (kind: StudentNotification['kind']) => kind === 'lesson' ? CalendarDays : kind === 'assignment' ? ClipboardList : kind === 'quiz' ? FileQuestion : kind === 'assessment' ? GraduationCap : kind === 'mission' ? Target : kind === 'cancellation' ? Ban : Bell;
  return <section className="student-page student-notifications-page">
    <div className="student-panel notifications-panel">
      <div className="panel-heading notifications-heading"><div><p className="eyebrow">CENTRAL</p><h3>Notificações</h3><p>Lembretes de aula, missões diárias, tarefas e feedbacks aparecem aqui.</p></div>{unread > 0 && <button className="secondary-button compact" onClick={onMarkAll}><Check size={16} />Marcar todas como lidas</button>}</div>
      <div className="notification-summary"><div><Bell size={22} /><span><strong>{unread}</strong><small>não lida(s)</small></span></div><div><CalendarDays size={22} /><span><strong>{notifications.filter((item) => item.kind === 'lesson').length}</strong><small>aulas e lembretes</small></span></div><div><Target size={22} /><span><strong>{notifications.filter((item) => item.urgent).length}</strong><small>prioritárias</small></span></div></div>
      {notifications.length ? <div className="notification-list">{notifications.map((notification) => { const Icon = iconFor(notification.kind); const isRead = Boolean(notification.readAt); return <button key={notification.id} className={`notification-card ${isRead ? 'read' : 'unread'} ${notification.urgent ? 'urgent' : ''}`} onClick={() => onOpen(notification)}><span className={`notification-icon ${notification.kind}`}><Icon size={20} /></span><span className="notification-copy"><span><strong>{notification.title}</strong>{!isRead && <i>Novo</i>}</span><p>{notification.description}</p><small>{formatNotificationDate(notification.date)}</small></span><ChevronRight size={18} /></button>; })}</div> : <div className="empty-state"><Check size={38} /><h3>Tudo em dia!</h3><p>Quando houver lembretes ou feedbacks, eles aparecerão aqui.</p></div>}
    </div>
  </section>;
}
