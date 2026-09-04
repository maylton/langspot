import { useCallback, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Check, Clock3, FileQuestion, LoaderCircle, Play } from 'lucide-react';
import { listStudentAssessments, startAssessmentAttempt } from '../attemptService';
import type { StudentAssessmentSummary } from '../types';
import { AssessmentRunner } from './AssessmentRunner';
import { AssessmentResult } from './AssessmentResult';

function deviceSessionId() {
  const key = 'langspot.assessmentDeviceSession';
  const stored = localStorage.getItem(key);
  if (stored) return stored;
  const created = crypto.randomUUID(); localStorage.setItem(key, created); return created;
}

export function AssessmentHub({ client, readOnly = false }: { client: SupabaseClient; readOnly?: boolean }) {
  const [items, setItems] = useState<StudentAssessmentSummary[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [resultAttemptId, setResultAttemptId] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<StudentAssessmentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const load = useCallback(async () => {
    if (readOnly) { setItems([]); setLoading(false); return; }
    setLoading(true); setMessage('');
    try { setItems(await listStudentAssessments(client)); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível carregar as avaliações.'); }
    setLoading(false);
  }, [client, readOnly]);
  useEffect(() => { void load(); }, [load]);

  const begin = async () => {
    if (!instructions) return;
    setLoading(true); setMessage('');
    try { setAttemptId(instructions.activeAttemptId ?? await startAssessmentAttempt(client, instructions.assignmentId, deviceSessionId())); setInstructions(null); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível iniciar a avaliação.'); }
    setLoading(false);
  };
  if (attemptId) return <AssessmentRunner client={client} attemptId={attemptId} onExit={() => setAttemptId(null)} onComplete={() => { setAttemptId(null); void load(); }} />;
  if (resultAttemptId) return <AssessmentResult client={client} attemptId={resultAttemptId} onBack={() => setResultAttemptId(null)} />;
  return <section className="student-page assessment-student-hub">
    <div className="student-panel assessment-hub-header"><div><p className="eyebrow">AVALIAÇÕES</p><h2>Suas avaliações</h2><p>Faça a prova em um ambiente focado. Suas respostas são salvas durante o percurso.</p></div><FileQuestion size={30} /></div>
    {message && <div className="assessment-message" role="alert">{message}</div>}
    {loading ? <div className="assessment-loading"><LoaderCircle className="spin" size={24} />Carregando…</div> : items.length ? <div className="assessment-student-list">{items.map((item) => {
      const completed = ['submitted', 'grading', 'completed'].includes(item.status);
      const expired = item.status === 'expired';
      return <article key={item.assignmentId}><div><span className={`assessment-status ${item.status}`}>{expired ? 'Prazo encerrado' : completed ? 'Enviada' : item.activeAttemptId ? 'Em andamento' : 'Disponível'}</span><h3>{item.title}</h3><p>{item.description || 'Leia as instruções antes de começar.'}</p><small><Clock3 size={14} />{item.dueAt ? `Prazo: ${new Date(item.dueAt).toLocaleString('pt-BR')}` : 'Sem prazo definido'}</small></div>{expired ? <span className="assessment-completed"><Clock3 size={18} />Encerrada</span> : completed && item.latestAttemptId ? <button className="secondary-button" onClick={() => setResultAttemptId(item.latestAttemptId)}><Check size={18} />Ver resultado</button> : completed ? <span className="assessment-completed"><Check size={18} />Concluída</span> : <button className="student-primary" onClick={() => setInstructions(item)}>{item.activeAttemptId ? 'Continuar' : 'Ver instruções'}<Play size={15} /></button>}</article>;
    })}</div> : <div className="assessment-empty"><FileQuestion size={38} /><h3>Nenhuma avaliação disponível</h3><p>Quando seu professor atribuir uma prova, ela aparecerá aqui.</p></div>}
    {instructions && <div className="modal-backdrop" onMouseDown={() => setInstructions(null)}><section className="modal assessment-instructions" onMouseDown={(event) => event.stopPropagation()}><p className="eyebrow">ANTES DE COMEÇAR</p><h2>{instructions.title}</h2><p>{instructions.description || 'Responda todas as questões com atenção.'}</p><ul><li>As respostas são salvas automaticamente.</li><li>Se a conexão cair, continue: as alterações ficarão pendentes no dispositivo.</li><li>O cronômetro usa o horário definido pelo servidor e continua após fechar a página.</li><li>Após enviar, não será possível alterar as respostas.</li></ul><div className="form-actions"><button className="cancel-button" onClick={() => setInstructions(null)}>Agora não</button><button className="student-primary" onClick={() => void begin()}>{instructions.activeAttemptId ? 'Retomar avaliação' : 'Iniciar avaliação'}</button></div></section></div>}
  </section>;
}
