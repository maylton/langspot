import { FormEvent, useState } from 'react';
import { DbLesson, Profile, supabase } from '../../supabase';
import { formatPortalDate } from '../../lib/format';

export function CancellationModal({ lesson, profile, onClose, onSent }: { lesson: DbLesson; profile: Profile; onClose: () => void; onSent: () => void }) {
  const [message, setMessage] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const reason = String(new FormData(event.currentTarget).get('reason'));
    const { error } = await supabase!.from('cancellation_requests').insert({ lesson_id: lesson.id, student_id: profile.id, teacher_id: lesson.teacher_id, reason });
    if (error) setMessage(error.message); else onSent();
  };
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal cancel-request-modal" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow">SOLICITAÇÃO</p><h2>Pedir cancelamento</h2></div><button className="icon-button" onClick={onClose}>×</button></div><p className="cancel-lesson-summary"><strong>{lesson.topic}</strong><br />{formatPortalDate(lesson.starts_at)}</p><form className="form-grid" onSubmit={submit}><label className="full-field">Justificativa<textarea name="reason" rows={5} minLength={5} required placeholder="Conte ao professor por que você precisa cancelar esta aula." /></label>{message && <div className="auth-message full-field">{message}</div>}<div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Voltar</button><button className="primary-button">Enviar solicitação</button></div></form></section></div>;
}
