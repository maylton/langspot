import { Copy, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Field, Modal, SelectField } from '../../components/ui';
import { type Student, type StudentCreateInput } from '../../types';

export function StudentModal({ onClose, onSave, defaultDuration, defaultOnlineUrl }: { onClose: () => void; onSave: (data: StudentCreateInput) => Promise<void>; defaultDuration: number; defaultOnlineUrl: string }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      await onSave({ name: String(form.get('name')), email: String(form.get('email')), whatsappPhone: String(form.get('whatsappPhone') || ''), age: String(form.get('age') || ''), level: String(form.get('level')), goal: String(form.get('goal')), status: 'Ativo', notes: String(form.get('notes')), firstLessonDate: String(form.get('firstLessonDate') || ''), firstLessonTime: String(form.get('firstLessonTime') || ''), firstLessonDuration: Number(form.get('firstLessonDuration') || defaultDuration), firstLessonTopic: String(form.get('firstLessonTopic') || ''), firstLessonOnlineUrl: String(form.get('firstLessonOnlineUrl') || '') });
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Não foi possível criar a conta do aluno.'); setBusy(false); }
  };
  return <Modal title="Cadastrar novo aluno" onClose={onClose}><form className="form-grid" onSubmit={submit}><div className="auth-message full-field">O aluno receberá uma conta com senha temporária para acessar o portal.</div><Field name="name" label="Nome completo" required /><Field name="email" label="E-mail" type="email" required /><Field name="whatsappPhone" label="WhatsApp" placeholder="+55 85 99999-9999" /><Field name="age" label="Idade" type="number" min="1" max="120" /><SelectField name="level" label="Nível" options={['A1', 'A2', 'B1', 'B2', 'C1', 'C2']} /><Field name="goal" label="Objetivo" placeholder="Conversação, viagem..." required /><label className="full-field">Observações<textarea name="notes" rows={3} placeholder="Necessidades, interesses e pontos importantes" /></label><div className="form-section-title full-field"><strong>Primeira aula (opcional)</strong><span>Ao preencher data, horário e tema, a aula será salva na agenda.</span></div><Field name="firstLessonDate" label="Data" type="date" /><Field name="firstLessonTime" label="Horário" type="time" /><Field name="firstLessonTopic" label="Tema da aula" placeholder="Ex.: Aula de diagnóstico" /><label>Duração<select name="firstLessonDuration" defaultValue={defaultDuration}><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="50">50 minutos</option><option value="60">60 minutos</option><option value="90">90 minutos</option></select></label><Field name="firstLessonOnlineUrl" label="Link da aula online" type="url" defaultValue={defaultOnlineUrl} placeholder="https://meet.google.com/..." />{error && <div className="auth-message full-field">{error}</div>}<div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button" type="submit" disabled={busy}>{busy ? 'Criando conta...' : 'Salvar e criar acesso'}</button></div></form></Modal>;
}

export function StudentEditModal({ student, onClose, onSave }: { student: Student; onClose: () => void; onSave: (student: Student) => Promise<void> }) {
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(''); const form = new FormData(event.currentTarget); try { await onSave({ ...student, name: String(form.get('name')), whatsappPhone: String(form.get('whatsappPhone') || ''), age: String(form.get('age') || ''), level: String(form.get('level')), goal: String(form.get('goal')), status: String(form.get('status')) as Student['status'], notes: String(form.get('notes')) }); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Não foi possível atualizar o perfil.'); setBusy(false); } };
  return <Modal title={`Editar perfil · ${student.name}`} onClose={onClose}><form className="form-grid" onSubmit={submit}><Field name="name" label="Nome completo" defaultValue={student.name} required /><Field name="email" label="E-mail de acesso" type="email" defaultValue={student.email} disabled /><Field name="whatsappPhone" label="WhatsApp" defaultValue={student.whatsappPhone ?? ''} placeholder="+55 85 99999-9999" /><Field name="age" label="Idade" type="number" min="1" max="120" defaultValue={student.age} /><label>Nível<select name="level" defaultValue={student.level}>{['A1','A2','B1','B2','C1','C2'].map((level) => <option key={level}>{level}</option>)}</select></label><Field name="goal" label="Objetivo" defaultValue={student.goal} required /><label>Status<select name="status" defaultValue={student.status}><option>Ativo</option><option>Pausado</option></select></label><label className="full-field">Observações<textarea name="notes" rows={4} defaultValue={student.notes} /></label>{error && <div className="auth-message full-field">{error}</div>}<div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={busy}>{busy ? 'Salvando...' : 'Salvar alterações'}</button></div></form></Modal>;
}

export function TemporaryAccessModal({ access, onClose }: { access: { name: string; email: string; password: string }; onClose: () => void }) {
  const accessUrl = window.location.origin;
  const accessMessage = `Olá, ${access.name}! Tudo bem?

Seu acesso ao LangSpot já foi criado. A plataforma será nosso espaço para acompanhar aulas, materiais, tarefas, metas, flashcards e seu progresso nos estudos.

Acesse por aqui:
${accessUrl}

Dados de acesso:
E-mail: ${access.email}
Senha temporária: ${access.password}

Como entrar pela primeira vez:
1. Acesse o link acima.
2. Clique em entrar.
3. Use o e-mail e a senha temporária.
4. No primeiro acesso, você poderá atualizar seus dados e trocar sua foto de perfil.
5. Depois disso, use o menu do portal para acompanhar suas aulas, tarefas, materiais, metas e flashcards.

Dica:
Salve o link nos favoritos ou na tela inicial do celular para acessar mais rápido.

Se tiver qualquer dificuldade para entrar, me avise que eu te ajudo.`;
  const copy = () => navigator.clipboard.writeText(accessMessage);
  return <Modal title="Acesso do aluno criado" onClose={onClose}><div className="temporary-access"><p>Envie este tutorial para <strong>{access.name}</strong>. A senha será solicitada apenas no primeiro acesso e não ficará disponível novamente.</p><div><span>E-mail</span><strong>{access.email}</strong></div><div><span>Senha temporária</span><strong>{access.password}</strong></div><div className="access-message-preview"><span>Mensagem que será copiada</span><pre>{accessMessage}</pre></div><button className="primary-button" onClick={copy}><Copy size={16} />Copiar tutorial de acesso</button></div><div className="form-actions"><button className="cancel-button" onClick={onClose}>Concluir</button></div></Modal>;
}

export function DeleteStudentModal({ student, scheduledLessons, onClose, onConfirm }: { student: Student; scheduledLessons: number; onClose: () => void; onConfirm: () => void }) {
  return <Modal title="Excluir aluno" onClose={onClose}><div className="delete-warning"><div className="delete-warning-icon"><Trash2 size={22} /></div><div><strong>Excluir {student.name} permanentemente?</strong><p>O perfil, {student.lessons.length} aula(s) do histórico e {scheduledLessons} aula(s) agendada(s) serão removidos. Esta ação não pode ser desfeita.</p></div></div><div className="form-actions"><button className="cancel-button" onClick={onClose}>Manter aluno</button><button className="danger-button" onClick={onConfirm}><Trash2 size={16} />Excluir aluno</button></div></Modal>;
}
