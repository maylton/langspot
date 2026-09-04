import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ArrowLeft, BarChart3, LoaderCircle } from 'lucide-react';
import { getCefrItemAnalytics } from '../assessmentService';
import type { AssessmentRow } from '../database';

type Analytics = Awaited<ReturnType<typeof getCefrItemAnalytics>>;

export function CefrAnalytics({ client, assessment, onBack }: { client: SupabaseClient; assessment: AssessmentRow; onBack: () => void }) {
  const [data, setData] = useState<Analytics | null>(null); const [message, setMessage] = useState('');
  useEffect(() => { void getCefrItemAnalytics(client, assessment.id).then(setData).catch((error) => setMessage(error instanceof Error ? error.message : 'Não foi possível carregar os indicadores.')); }, [assessment.id, client]);
  return <section className="assessment-results"><header className="assessment-dashboard-header"><div><button className="back-button" onClick={onBack}><ArrowLeft size={15} />Avaliações</button><p className="eyebrow">CEFR ANALYTICS</p><h2>{assessment.title}</h2><p>Indicadores descritivos. Alinhamento pedagógico não equivale a validação psicométrica.</p></div></header>
    {message && <div className="assessment-message">{message}</div>}{!data ? <div className="assessment-loading"><LoaderCircle className="spin" />Carregando…</div> : <><div className="assessment-message"><b>Status de calibração: {data.calibrationStatus}</b><br />Discriminação só é exibida após {data.minimumCalibrationResponses} respostas válidas por item. Até lá, os dados não sustentam cut scores calibrados.</div><div className="assessment-card-grid">{data.items.map((item) => <article key={item.questionId}><div className="assessment-card-top"><span>{item.cefr} · {item.skill}</span><BarChart3 size={18} /></div><h3>{item.prompt}</h3><dl><div><dt>Respostas</dt><dd>{item.responses}</dd></div><div><dt>Facility</dt><dd>{item.facility ?? '—'}</dd></div><div><dt>Tempo médio</dt><dd>{item.averageTimeMs ? `${Math.round(item.averageTimeMs / 1000)} s` : '—'}</dd></div><div><dt>Discriminação</dt><dd>{item.discrimination ?? 'dados insuficientes'}</dd></div></dl></article>)}</div></>}
  </section>;
}
