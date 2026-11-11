import type { CefrProfile } from './types';
import { CONFIDENCE_LABELS, dimensionLabel, formatProfileItem, meaningfulPriorities, placementLabel, SKILL_LABELS } from './cefrLabels';

/**
 * CEFR profile card. Students see levels and dimensions; confidence, review flags and rule versions are
 * internal and shown only to the teacher.
 */
export function CefrProfileReport({ profile, compact = false, audience = 'teacher' }: { profile: CefrProfile; compact?: boolean; audience?: 'teacher' | 'student' }) {
  const teacher = audience === 'teacher';
  const priorities = meaningfulPriorities(profile);
  return <section className={`cefr-profile ${compact ? 'compact' : ''}`}>
    <header>
      <div><p className="eyebrow">PERFIL CEFR</p><h3>{profile.overallLevel ? `Nível geral: ${profile.overallLevel}` : 'Evidência insuficiente'}</h3>{profile.recommendedPlacement && <p>{placementLabel(profile.recommendedPlacement)}</p>}</div>
      {teacher && <span className={`cefr-confidence ${profile.confidence}`}>Confiança {CONFIDENCE_LABELS[profile.confidence] ?? profile.confidence}</span>}
    </header>
    <div className="cefr-skill-grid">{Object.entries(profile.skills).map(([skill, result]) => <article key={skill}>
      <span>{SKILL_LABELS[skill] ?? skill}</span><strong>{result?.level}</strong>
      {teacher && result?.confidence && <small>confiança {CONFIDENCE_LABELS[result.confidence] ?? result.confidence}</small>}
      {Object.keys(result?.dimensions ?? {}).length ? <dl>{Object.entries(result?.dimensions ?? {}).map(([dimension, value]) => { const objective = /^(\d+)\/(\d+) objective/.exec(value.evidence ?? ''); return <div key={dimension}><dt>{dimensionLabel(dimension)}</dt><dd title={objective ? 'acertos' : undefined}>{objective ? `${objective[1]}/${objective[2]}` : value.level}</dd></div>; })}</dl> : null}
    </article>)}</div>
    {!compact && <div className="cefr-profile-notes">
      <div><h4>Pontos fortes</h4>{profile.strengths.length ? <ul>{profile.strengths.map((item) => <li key={item}>{formatProfileItem(item)}</li>)}</ul> : <p>Aguardando mais evidências convergentes.</p>}</div>
      <div><h4>Prioridades de desenvolvimento</h4>{priorities.length ? <ul>{priorities.map((item) => <li key={item}>{formatProfileItem(item)}</li>)}</ul> : <p>Nenhuma prioridade automática identificada.</p>}</div>
    </div>}
    {teacher && profile.flags.length ? <p className="cefr-flags">Revisão: {profile.flags.join(' · ')}</p> : null}
    <footer>
      {teacher && <b>PADRÃO INTERNO PROVISÓRIO</b>}
      <span>{profile.disclaimer}</span>
      {teacher && <small>Regras: {profile.decisionRuleVersion} · {profile.routingRuleVersion} · relatório {profile.reportModelVersion}</small>}
    </footer>
  </section>;
}
