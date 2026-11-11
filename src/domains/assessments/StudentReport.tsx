import { useEffect, useMemo, type ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, FileDown, Minus } from 'lucide-react';
import { CEFR_DISCLAIMER } from './cefr';
import { buildStudentReport, type AssessmentReportNote, type PreviousAssessmentForReport } from './report';
import type { AssessmentResultSection, CefrLevel, CefrProfile } from './types';

const PRINT_CLASS = 'printing-student-report';

/** Prints only the report; the system print dialog offers "Save as PDF". */
export function printStudentReport() {
  const root = document.documentElement;
  const cleanup = () => { root.classList.remove(PRINT_CLASS); window.removeEventListener('afterprint', cleanup); };
  root.classList.add(PRINT_CLASS);
  window.addEventListener('afterprint', cleanup);
  window.print();
  // Some webviews never fire afterprint.
  window.setTimeout(cleanup, 60_000);
}

export function StudentReport({ title, studentName, completedAt, score, estimatedCefr, sections, cefrProfile, previous, note, actions }: {
  title: string;
  studentName?: string;
  completedAt?: string | null;
  score: number | null | undefined;
  estimatedCefr?: CefrLevel | null;
  sections: AssessmentResultSection[];
  cefrProfile?: CefrProfile | null;
  previous?: PreviousAssessmentForReport | null;
  note?: AssessmentReportNote | null;
  actions?: ReactNode;
}) {
  const report = useMemo(() => buildStudentReport({ sections, score, cefrProfile, previous }), [cefrProfile, previous, score, sections]);
  useEffect(() => () => document.documentElement.classList.remove(PRINT_CLASS), []);
  const overall = cefrProfile?.overallLevel ?? estimatedCefr ?? (typeof score === 'number' ? `${Math.round(score)}%` : '—');

  return <article className="student-report">
    <header className="student-report-header">
      <div>
        <p className="eyebrow">RELATÓRIO DE AVALIAÇÃO</p>
        <h2>{title}</h2>
        <p>{[studentName, completedAt ? new Date(completedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : null].filter(Boolean).join(' · ')}</p>
      </div>
      <div className="student-report-overall">
        <strong>{overall}</strong>
        <span>{cefrProfile?.overallLevel ? 'nível estimado (CEFR)' : 'resultado geral'}</span>
        {report.scoreDelta !== null && <Delta value={report.scoreDelta} suffix=" p.p." />}
      </div>
    </header>

    {report.skills.length ? <section className="student-report-skills" aria-label="Resultado por habilidade">
      {report.skills.map((line) => <div key={line.key} className="student-report-skill">
        <span>{line.label}</span>
        {line.rubric
          ? <><em className="student-report-rubric">avaliado pelo professor</em><strong className="student-report-level">{line.level}</strong></>
          : line.percentage === null && !line.level ? <><em className="student-report-rubric">não avaliado</em><strong>—</strong></>
          : <><i aria-hidden="true"><b style={{ width: `${Math.max(0, Math.min(100, line.percentage ?? 0))}%` }} /></i>
            <strong>{line.percentage === null ? '—' : `${line.percentage}%`}{line.level ? <small>{line.level}</small> : null}</strong></>}
        {line.delta !== null ? <Delta value={line.delta} suffix=" p.p." /> : <em className="student-report-delta none">{previous ? 'novo' : ''}</em>}
      </div>)}
    </section> : null}
    {previous && <p className="student-report-previous">Comparado com “{previous.title}”, de {new Date(previous.completedAt).toLocaleDateString('pt-BR')}.</p>}

    <section className="student-report-columns">
      <div>
        <h3>Pontos fortes</h3>
        {report.strengths.length ? <ul>{report.strengths.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Ainda sem um destaque claro. Continue praticando todas as habilidades.</p>}
      </div>
      <div>
        <h3>Prioridades</h3>
        {report.priorities.length ? <ul>{report.priorities.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Nenhuma habilidade abaixo do esperado nesta avaliação.</p>}
      </div>
    </section>

    {note && (note.summary || note.nextSteps) ? <section className="student-report-note">
      {note.summary && <div><h3>Comentário do professor</h3><p>{note.summary}</p></div>}
      {note.nextSteps && <div><h3>Próximos passos</h3><p>{note.nextSteps}</p></div>}
    </section> : null}

    {cefrProfile && <p className="student-report-disclaimer">{cefrProfile.disclaimer || CEFR_DISCLAIMER}</p>}
    <footer className="student-report-actions">
      <button type="button" className="secondary-button compact" onClick={printStudentReport}><FileDown size={15} />Exportar PDF</button>
      {actions}
    </footer>
  </article>;
}

function Delta({ value, suffix }: { value: number; suffix: string }) {
  if (value === 0) return <em className="student-report-delta flat"><Minus size={12} />igual</em>;
  return <em className={`student-report-delta ${value > 0 ? 'up' : 'down'}`}>{value > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{value > 0 ? '+' : ''}{value}{suffix}</em>;
}
