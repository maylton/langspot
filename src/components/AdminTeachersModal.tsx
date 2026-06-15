import { useEffect, useState } from 'react';
import { Check, LoaderCircle, ShieldCheck, Trash2, UserRound, X } from 'lucide-react';
import { supabase } from '../supabase';

type ManagedTeacher = {
  id: string;
  full_name: string;
  email: string;
  school_name: string;
  plan: 'trial' | 'professional' | 'owner';
  status: string;
  trial_ends_at: string | null;
  created_at: string;
  student_count: number;
  is_owner: boolean;
};

export default function AdminTeachersModal({ onClose }: { onClose: () => void }) {
  const [teachers, setTeachers] = useState<ManagedTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const invoke = async (body: Record<string, unknown>) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { data, error } = await supabase.functions.invoke('admin-teachers', { body });
    if (error) {
      const response = error.context as Response | undefined;
      if (response?.json) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || error.message);
      }
      throw new Error(error.message);
    }
    return data;
  };

  const loadTeachers = async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await invoke({ action: 'list' });
      setTeachers(data.teachers ?? []);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadTeachers(); }, []);

  const setAccess = async (teacher: ManagedTeacher, enabled: boolean) => {
    setBusyId(teacher.id);
    setMessage('');
    try {
      await invoke({ action: 'set-access', teacher_id: teacher.id, enabled });
      setMessage(enabled ? `Acesso de ${teacher.full_name} liberado.` : `Acesso de ${teacher.full_name} suspenso.`);
      await loadTeachers();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const deleteTeacher = async (teacher: ManagedTeacher) => {
    const confirmation = window.prompt(`Esta ação excluirá permanentemente ${teacher.full_name}, seus alunos e todos os dados vinculados.\n\nDigite EXCLUIR para confirmar.`);
    if (confirmation !== 'EXCLUIR') return;
    setBusyId(teacher.id);
    setMessage('');
    try {
      await invoke({ action: 'delete', teacher_id: teacher.id });
      setMessage(`${teacher.full_name} foi excluído permanentemente.`);
      await loadTeachers();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return <div className="modal-backdrop" onMouseDown={onClose}>
    <section className="modal admin-teachers-modal" onMouseDown={(event) => event.stopPropagation()}>
      <div className="modal-header"><div><h2>Professores cadastrados</h2><small>Controle os acessos da plataforma.</small></div><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={17} /></button></div>
      <div className="admin-teachers-content">
        {message && <div className="auth-message">{message}</div>}
        {loading ? <div className="admin-teachers-loading"><LoaderCircle className="spin" size={25} />Carregando professores...</div> : teachers.length === 0 ? <div className="empty-state"><UserRound size={36} /><h3>Nenhum professor cadastrado</h3></div> : <div className="admin-teachers-list">
          {teachers.map((teacher) => {
            const active = teacher.plan === 'owner' || teacher.status === 'active' || (teacher.status === 'trialing' && Boolean(teacher.trial_ends_at && new Date(teacher.trial_ends_at) > new Date()));
            return <article className="admin-teacher-row" key={teacher.id}>
              <div className="admin-teacher-avatar"><UserRound size={19} /></div>
              <div className="admin-teacher-info"><div><strong>{teacher.full_name || 'Professor sem nome'}</strong>{teacher.is_owner && <span className="admin-owner-badge"><ShieldCheck size={12} />Administrador</span>}</div><span>{teacher.email || 'E-mail não informado'}</span><small>{teacher.school_name || 'Sem escola informada'} · {teacher.student_count} aluno(s) · cadastrado em {new Date(teacher.created_at).toLocaleDateString('pt-BR')}</small></div>
              <span className={`admin-access-badge ${active ? 'active' : 'inactive'}`}>{active ? 'Acesso ativo' : 'Acesso suspenso'}</span>
              {!teacher.is_owner && <div className="admin-teacher-actions"><button type="button" className={active ? 'cancel-button' : 'primary-button'} disabled={busyId === teacher.id} onClick={() => setAccess(teacher, !active)}>{busyId === teacher.id ? <LoaderCircle className="spin" size={14} /> : active ? <X size={14} /> : <Check size={14} />}{active ? 'Suspender' : 'Liberar acesso'}</button><button type="button" className="danger-button" disabled={busyId === teacher.id} onClick={() => deleteTeacher(teacher)}><Trash2 size={14} />Excluir</button></div>}
            </article>;
          })}
        </div>}
      </div>
    </section>
  </div>;
}
