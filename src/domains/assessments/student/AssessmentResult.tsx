import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ArrowLeft, Check, Clock3, LoaderCircle } from 'lucide-react';
import { getStudentAssessmentResult } from '../attemptService';
import { getAssessmentReportNote, getPreviousAssessmentForReport } from '../assessmentService';
import type { AssessmentReportNote, PreviousAssessmentForReport } from '../report';
import type { StudentAssessmentResult } from '../types';
import { CefrProfileReport } from '../CefrProfileReport';
import { StudentReport } from '../StudentReport';

export function AssessmentResult({ client, attemptId, title, onBack }: { client: SupabaseClient; attemptId: string; title: string; onBack: () => void }) {
  const [result, setResult] = useState<StudentAssessmentResult | null>(null);
  const [note, setNote] = useState<AssessmentReportNote | null>(null);
  const [previous, setPrevious] = useState<PreviousAssessmentForReport | null>(null);
  const [message, setMessage] = useState('');
  useEffect(() => {
    void getStudentAssessmentResult(client, attemptId).then(setResult).catch((error) => setMessage(error instanceof Error ? error.message : 'Não foi possível carregar o resultado.'));
    // The report extras are optional: a missing note or comparison must not block the result.
    void getAssessmentReportNote(client, attemptId).then(setNote).catch(() => undefined);
    void getPreviousAssessmentForReport(client, attemptId).then(setPrevious).catch(() => undefined);
  }, [attemptId, client]);
  if (message) return <div className="student-panel"><button className="back-button" onClick={onBack}><ArrowLeft size={15} />Avaliações</button><p>{message}</p></div>;
  if (!result) return <div className="assessment-loading"><LoaderCircle className="spin" size={24} />Carregando resultado…</div>;
  if (!result.visible) return <div className="student-panel assessment-result-pending"><Clock3 size={30} /><h2>Resultado em revisão</h2><p>Seu envio foi recebido. O resultado será liberado conforme a configuração do professor.</p><button className="secondary-button" onClick={onBack}>Voltar</button></div>;
  return <section className="assessment-student-result">
    <button className="back-button" onClick={onBack}><ArrowLeft size={15} />Avaliações</button>
    {result.sections?.length
      ? <StudentReport title={title} score={result.score} estimatedCefr={result.estimatedCefr} sections={result.sections} cefrProfile={result.cefrProfile} previous={previous} note={note} />
      : <header className="student-panel"><div className="assessment-result-score"><Check size={24} /><span><strong>{result.cefrProfile?.overallLevel ?? (result.score === undefined ? result.estimatedCefr ?? '—' : `${result.score}%`)}</strong><small>{result.cefrProfile ? 'Estimativa CEFR alinhada' : result.estimatedCefr ? `Nível estimado: ${result.estimatedCefr}` : 'Avaliação concluída'}</small></span></div>{note?.summary && <p className="teacher-feedback"><b>Comentário do professor</b>{note.summary}</p>}</header>}
    {result.cefrProfile && <CefrProfileReport profile={result.cefrProfile} />}
    {result.questions?.length ? <div className="assessment-report-questions">{result.questions.map((question, index) => <article key={question.id}><div className="assessment-question-result-heading"><span>{index + 1}</span><div><h3>{question.prompt}</h3><small>{question.answer === 'live' && ['speaking', 'mediation'].includes(question.type ?? '') ? 'Feita ao vivo com o professor' : question.type === 'speaking' ? 'Resposta gravada' : question.answer || 'Em branco'}</small></div><strong>{question.score ?? 0}/{question.maxScore ?? 0}</strong></div>{question.teacherFeedback && <p className="teacher-feedback"><b>Feedback do professor</b>{question.teacherFeedback}</p>}</article>)}</div> : null}
  </section>;
}
