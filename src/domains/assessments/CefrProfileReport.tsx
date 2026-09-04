import type { CefrProfile } from './types';

const labels: Record<string, string> = { reading: 'Reading', listening: 'Listening', writing: 'Writing', spoken_production: 'Spoken Production', spoken_interaction: 'Spoken Interaction', mediation: 'Mediation', language_use: 'Language Use' };

export function CefrProfileReport({ profile, compact = false }: { profile: CefrProfile; compact?: boolean }) {
  return <section className={`cefr-profile ${compact ? 'compact' : ''}`}>
    <header><div><p className="eyebrow">CEFR-ALIGNED PROFILE</p><h3>{profile.overallLevel ? `Estimativa geral: ${profile.overallLevel}` : 'Evidência insuficiente'}</h3><p>{profile.recommendedPlacement}</p></div><span className={`cefr-confidence ${profile.confidence}`}>Confiança {profile.confidence}</span></header>
    <div className="cefr-skill-grid">{Object.entries(profile.skills).map(([skill, result]) => <article key={skill}><span>{labels[skill] ?? skill}</span><strong>{result?.level}</strong><small>confiança {result?.confidence}</small>{Object.keys(result?.dimensions ?? {}).length ? <dl>{Object.entries(result?.dimensions ?? {}).map(([dimension, value]) => <div key={dimension}><dt>{dimension.replace(/_/g, ' ')}</dt><dd>{value.level}</dd></div>)}</dl> : null}</article>)}</div>
    {!compact && <div className="cefr-profile-notes"><div><h4>Pontos fortes</h4>{profile.strengths.length ? <ul>{profile.strengths.map((item) => <li key={item}>{item.replace(/[._]/g, ' ')}</li>)}</ul> : <p>Aguardando mais evidências convergentes.</p>}</div><div><h4>Prioridades de desenvolvimento</h4>{profile.developmentPriorities.length ? <ul>{profile.developmentPriorities.map((item) => <li key={item}>{item.replace(/[._]/g, ' ')}</li>)}</ul> : <p>Nenhuma prioridade automática identificada.</p>}</div></div>}
    {profile.flags.length ? <p className="cefr-flags">Revisão: {profile.flags.join(' · ')}</p> : null}
    <footer><b>PROVISIONAL INTERNAL STANDARD</b><span>{profile.disclaimer}</span><small>Regras: {profile.decisionRuleVersion} · {profile.routingRuleVersion} · relatório {profile.reportModelVersion}</small></footer>
  </section>;
}
