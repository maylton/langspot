import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ArrowLeft, LoaderCircle, TrendingUp } from 'lucide-react';
import { confirmAssessmentLevel, getAssessmentProgress } from '../assessmentService';
import type { AssessmentProgressReport, CefrLevel } from '../types';
import type { AssessmentStudentOption } from './AssessmentAssignments';

export function AssessmentProgress({ client, students, onBack }: { client: SupabaseClient; students: AssessmentStudentOption[]; onBack: () => void }) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? '');
  const [report, setReport] = useState<AssessmentProgressReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { if (!studentId) return; let active = true; setLoading(true); setMessage(''); void getAssessmentProgress(client, studentId).then((value) => { if (active) setReport(value); }).catch((error) => { if (active) setMessage(error instanceof Error ? error.message : 'Não foi possível carregar a evolução.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [client, studentId]);
  const confirmLevel = async (attemptId: string, level: CefrLevel) => { if (!report || !window.confirm(`Confirmar o nível ${level} para este aluno?`)) return; await confirmAssessmentLevel(client, report.studentId, attemptId, level); setReport(await getAssessmentProgress(client, report.studentId)); };
  return <section className="assessment-progress"><header className="assessment-dashboard-header"><div><button className="back-button" onClick={onBack}><ArrowLeft size={15} />Avaliações</button><p className="eyebrow">EVOLUÇÃO LONGITUDINAL</p><h2>Histórico de assessments</h2><p>Compare resultados por competência e confirme mudanças de nível.</p></div><label>Aluno<select value={studentId} onChange={(event) => setStudentId(event.target.value)}>{students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label></header>
    {message && <div className="assessment-message" role="alert">{message}</div>}{loading ? <div className="assessment-loading"><LoaderCircle className="spin" size={24} />Carregando evolução…</div> : report?.history.length ? <><div className="assessment-progress-summary"><TrendingUp size={20} /><span>Nível atual</span><strong>{report.currentLevel}</strong><small>{report.history.length} avaliação(ões) concluída(s)</small></div><div className="assessment-progress-history">{report.history.map((item, index) => <article key={item.attemptId}><header><span>{new Date(item.completedAt).toLocaleDateString('pt-BR')}</span><strong>{item.title}</strong><b>{item.score ?? '—'}%</b></header><div>{Object.entries(item.skills).map(([skill, score]) => <span key={skill}>{skill}<b>{score}%</b></span>)}</div><footer><small>v{item.version} · {item.type}{index ? ` · anterior ${report.history[index - 1].score ?? '—'}%` : ''}</small>{item.type === 'placement' && item.estimatedCefr && <button className="secondary-button" onClick={() => void confirmLevel(item.attemptId, item.estimatedCefr!)}>Confirmar nível {item.estimatedCefr}</button>}</footer></article>)}</div></> : <div className="assessment-empty"><TrendingUp size={38} /><h3>Sem histórico concluído</h3><p>Os resultados aparecerão após a conclusão das avaliações.</p></div>}
  </section>;
}
