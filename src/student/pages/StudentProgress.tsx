import { GraduationCap } from 'lucide-react';
import { StudentRecord } from '../../supabase';
import { EmptyPortal } from '../components/ui';

export function StudentProgress({ record }: { record: StudentRecord | null }) {
  const entries = Object.entries(record?.skills ?? {});
  const average = entries.length ? Math.round(entries.reduce((sum, [, value]) => sum + value, 0) / entries.length) : 0;
  const strongest = entries.sort((a, b) => b[1] - a[1])[0];
  const attention = [...entries].sort((a, b) => a[1] - b[1])[0];
  return <div className="student-page"><section className="student-progress-hero"><div><p className="eyebrow">SEU DESENVOLVIMENTO</p><h2>{average ? `${average}% de progresso geral` : 'Seu progresso começa aqui'}</h2><p>{record?.goal || 'Seu professor poderá registrar metas e habilidades.'}</p></div><strong>{record?.level ?? '—'}</strong></section><section className="student-progress-grid"><article className="student-panel"><h2>Habilidades</h2>{entries.length ? <div className="portal-skills">{entries.map(([skill, value]) => <div key={skill}><div><strong>{skill}</strong><span>{value}%</span></div><i><b style={{ width: `${value}%` }} /></i></div>)}</div> : <EmptyPortal icon={GraduationCap} title="Sem avaliações ainda" text="As habilidades atualizadas pelo professor aparecerão aqui." />}</article><aside className="student-panel progress-insights"><h2>Destaques</h2><div><span>Habilidade mais forte</span><strong>{strongest?.[0] ?? 'A avaliar'}</strong></div><div><span>Ponto de atenção</span><strong>{attention?.[0] ?? 'A avaliar'}</strong></div><div><span>Observações do professor</span><p>{record?.notes || 'Nenhuma observação registrada.'}</p></div></aside></section></div>;
}
