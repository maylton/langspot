import { useCallback, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Check, Clock3, FileQuestion, LoaderCircle, Play } from 'lucide-react';
import { listStudentAssessments, startAssessmentAttempt } from '../attemptService';
import type { StudentAssessmentSummary } from '../types';
import { AssessmentRunner } from './AssessmentRunner';
import { AssessmentResult } from './AssessmentResult';
import { DeviceCheck } from './DeviceCheck';
import { enterAssessmentFullscreen } from './integrity';

function deviceSessionId() {
  const key = 'langspot.assessmentDeviceSession';
  const stored = localStorage.getItem(key);
  if (stored) return stored;
  const created = crypto.randomUUID(); localStorage.setItem(key, created); return created;
}

export function AssessmentHub({ client, readOnly = false }: { client: SupabaseClient; readOnly?: boolean }) {
  const [items, setItems] = useState<StudentAssessmentSummary[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [resultFor, setResultFor] = useState<{ attemptId: string; title: string } | null>(null);
  const [instructions, setInstructions] = useState<StudentAssessmentSummary | null>(null);
  const [checkingDevices, setCheckingDevices] = useState(false);
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
  if (resultFor) return <AssessmentResult client={client} attemptId={resultFor.attemptId} title={resultFor.title} onBack={() => setResultFor(null)} />;
  return <section className="student-page assessment-student-hub">
    <div className="student-panel assessment-hub-header"><div><p className="eyebrow">AVALIAÇÕES</p><h2>Suas avaliações</h2><p>Faça a prova em um ambiente focado. Suas respostas são salvas durante o percurso.</p></div><FileQuestion size={30} /></div>
    {message && <div className="assessment-message" role="alert">{message}</div>}
    {loading ? <div className="assessment-loading"><LoaderCircle className="spin" size={24} />Carregando…</div> : items.length ? <div className="assessment-student-list">{items.map((item) => {
      const completed = ['submitted', 'grading', 'completed'].includes(item.status);
      const expired = item.status === 'expired';
      const liveOnly = Boolean(item.liveOnly);
      return <article key={item.assignmentId}><div><span className={`assessment-status ${item.status}`}>{expired ? 'Prazo encerrado' : completed ? 'Enviada' : liveOnly ? 'Ao vivo' : item.activeAttemptId ? 'Em andamento' : 'Disponível'}</span><h3>{item.title}</h3><p>{item.description || 'Leia as instruções antes de começar.'}</p>{item.liveQuestionCount ? <p className="assessment-live-notice">{liveOnly ? 'Avaliação feita ao vivo com seu professor durante a aula.' : `${item.liveQuestionCount} tarefa(s) serão feitas ao vivo com seu professor.`}</p> : null}<small><Clock3 size={14} />{item.dueAt ? `Prazo: ${new Date(item.dueAt).toLocaleString('pt-BR')}` : 'Sem prazo definido'}</small></div>{expired ? <span className="assessment-completed"><Clock3 size={18} />Encerrada</span> : completed && item.latestAttemptId ? <button className="secondary-button" onClick={() => setResultFor({ attemptId: item.latestAttemptId!, title: item.title })}><Check size={18} />Ver resultado</button> : completed ? <span className="assessment-completed"><Check size={18} />Concluída</span> : liveOnly ? <span className="assessment-completed"><Clock3 size={18} />Com o professor</span> : <button className="student-primary" onClick={() => setInstructions(item)}>{item.activeAttemptId ? 'Continuar' : 'Ver instruções'}<Play size={15} /></button>}</article>;
    })}</div> : <div className="assessment-empty"><FileQuestion size={38} /><h3>Nenhuma avaliação disponível</h3><p>Quando seu professor atribuir uma prova, ela aparecerá aqui.</p></div>}
    {instructions && <div className="modal-backdrop" onMouseDown={() => { setInstructions(null); setCheckingDevices(false); }}><section className="modal assessment-instructions" onMouseDown={(event) => event.stopPropagation()}>{checkingDevices ? <DeviceCheck needsAudio={Boolean(instructions.requiresAudio)} needsMicrophone={Boolean(instructions.requiresMicrophone)} onCancel={() => setCheckingDevices(false)} onReady={() => void begin()} /> : <><p className="eyebrow">ANTES DE COMEÇAR</p><h2>{instructions.title}</h2><p>{instructions.description || 'Responda todas as questões com atenção.'}</p><ul><li>As respostas são salvas automaticamente.</li><li>Se a conexão cair, continue: as alterações ficarão pendentes no dispositivo.</li><li>O cronômetro usa o horário do servidor e continua mesmo se você fechar a página. Em provas divididas em etapas, o tempo só conta enquanto a etapa está aberta, e você pode parar entre uma etapa e outra.</li><li>Em placement CEFR, auxílio de IA não é permitido.</li><li>No computador, a prova abre em tela cheia. Sair da tela cheia, trocar de aba, copiar ou colar texto fica registrado para o professor.</li><li>Para enviar a prova completa, você vai digitar um código de confirmação mostrado na tela. Depois do envio, não será possível alterar as respostas.</li>{instructions.liveQuestionCount ? <li>{instructions.liveQuestionCount} tarefa(s) de fala serão feitas ao vivo com seu professor e não aparecem nesta prova.</li> : null}</ul><div className="form-actions"><button className="cancel-button" onClick={() => setInstructions(null)}>Agora não</button><button className="student-primary" onClick={() => { enterAssessmentFullscreen(); if (instructions.requiresAudio || instructions.requiresMicrophone) setCheckingDevices(true); else void begin(); }}>{instructions.activeAttemptId ? 'Retomar avaliação' : 'Iniciar avaliação'}</button></div></>}</section></div>}
  </section>;
}
