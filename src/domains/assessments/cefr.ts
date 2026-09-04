import type { CefrConfidence, CefrLevel, CefrProfile, CefrSkill, CefrSkillResult } from './types';

export const CEFR_LEVELS: readonly CefrLevel[] = ['A1', 'A1+', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+', 'C1', 'C1+', 'C2'];
export const CEFR_PROVISIONAL_STANDARD = 'PROVISIONAL INTERNAL STANDARD' as const;
export const CEFR_DISCLAIMER = 'Estimativa LangSpot alinhada ao CEFR. Não constitui certificação oficial.';
export const CEFR_DECISION_RULE_VERSION = 'cefr-decision-v1';
export const CEFR_ROUTING_RULE_VERSION = 'cefr-routing-v1';
export const CEFR_REPORT_MODEL_VERSION = 'cefr-profile-v1';

export type TaskletDecision = 'not_demonstrated' | 'borderline' | 'demonstrated';
export type CefrRoutingDecision = { decision: 'move_down' | 'confirm' | 'move_up' | 'complete'; nextLevel: CefrLevel; requiresConfirmation: boolean; ruleVersion: typeof CEFR_ROUTING_RULE_VERSION };

export function classifyTasklet(score: number, itemCount = 8): TaskletDecision {
  if (!Number.isInteger(score) || !Number.isInteger(itemCount) || itemCount < 1 || score < 0 || score > itemCount) throw new Error('Invalid tasklet score.');
  if (itemCount === 8) return score <= 3 ? 'not_demonstrated' : score <= 5 ? 'borderline' : 'demonstrated';
  const ratio = score / itemCount;
  return ratio < 0.5 ? 'not_demonstrated' : ratio < 0.75 ? 'borderline' : 'demonstrated';
}

export function routeCefrTasklet(level: CefrLevel, score: number, itemCount: 4 | 8, confirmed = false): CefrRoutingDecision {
  const outcome = classifyTasklet(score, itemCount);
  const current = cefrOrdinal(level.replace('+', '') as CefrLevel);
  if (outcome === 'borderline' && !confirmed) return { decision: 'confirm', nextLevel: level.replace('+', '') as CefrLevel, requiresConfirmation: true, ruleVersion: CEFR_ROUTING_RULE_VERSION };
  if (outcome === 'demonstrated') {
    const next = Math.min(CEFR_LEVELS.length - 1, current + 2);
    return { decision: next === current ? 'complete' : 'move_up', nextLevel: ordinalToCefr(next), requiresConfirmation: false, ruleVersion: CEFR_ROUTING_RULE_VERSION };
  }
  const next = Math.max(0, current - 2);
  return { decision: next === current ? 'complete' : 'move_down', nextLevel: ordinalToCefr(next), requiresConfirmation: false, ruleVersion: CEFR_ROUTING_RULE_VERSION };
}

export function cefrOrdinal(level: CefrLevel): number {
  const value = CEFR_LEVELS.indexOf(level);
  if (value < 0) throw new Error(`Unknown CEFR level: ${level}`);
  return value;
}

export function ordinalToCefr(value: number): CefrLevel {
  return CEFR_LEVELS[Math.max(0, Math.min(CEFR_LEVELS.length - 1, Math.round(value)))];
}

export function productiveLevel(dimensions: Record<string, CefrLevel>, critical: string[]): { level: CefrLevel; priorities: string[] } {
  const entries = Object.entries(dimensions);
  if (!entries.length) throw new Error('At least one rubric dimension is required.');
  const ordered = entries.map(([, level]) => cefrOrdinal(level)).sort((a, b) => a - b);
  let candidate = ordered[Math.floor((ordered.length - 1) / 2)];
  const candidateBase = candidate % 2 === 0 ? candidate : candidate - 1;
  const below = entries.filter(([, level]) => cefrOrdinal(level) < candidateBase);
  if (below.length >= 2) candidate = Math.max(0, candidateBase - 1);
  for (const key of critical) {
    const level = dimensions[key];
    if (level && cefrOrdinal(level) < candidateBase) candidate = Math.min(candidate, cefrOrdinal(level) + 1);
  }
  const level = ordinalToCefr(candidate);
  const priorities = entries.filter(([, value]) => cefrOrdinal(value) < cefrOrdinal(level)).map(([key]) => key);
  return { level, priorities };
}

const PRODUCTIVE_SKILLS: CefrSkill[] = ['writing', 'spoken_production', 'spoken_interaction', 'mediation'];

export function buildCefrProfile(skills: Partial<Record<CefrSkill, CefrSkillResult>>, extraFlags: string[] = []): CefrProfile {
  const evidence = Object.entries(skills) as [CefrSkill, CefrSkillResult][];
  const flags = new Set(extraFlags);
  if (!evidence.length) return emptyCefrProfile(['LOW_ITEM_CONFIDENCE', ...extraFlags]);
  const ordinals = evidence.map(([, result]) => cefrOrdinal(result.level)).sort((a, b) => a - b);
  let overall = ordinals[Math.floor((ordinals.length - 1) / 2)];
  const productive = evidence.filter(([skill]) => PRODUCTIVE_SKILLS.includes(skill));
  if (productive.length) {
    const productiveFloor = Math.min(...productive.map(([, result]) => cefrOrdinal(result.level)));
    if (overall >= cefrOrdinal('B2') && productiveFloor < cefrOrdinal('B1')) {
      overall = Math.min(overall, cefrOrdinal('B1'));
      flags.add('PRODUCTIVE_SKILLS_BELOW_OVERALL');
    }
    if (overall >= cefrOrdinal('C1') && productiveFloor < cefrOrdinal('B2')) {
      overall = Math.min(overall, cefrOrdinal('B2'));
      flags.add('PRODUCTIVE_SKILLS_BELOW_OVERALL');
    }
  }
  if (ordinals[ordinals.length - 1] - ordinals[0] >= 4) flags.add('HIGH_SKILL_VARIANCE');
  if (evidence.some(([, result]) => result.confidence === 'low')) flags.add('LOW_ITEM_CONFIDENCE');
  const confidence: CefrConfidence = flags.size ? 'low' : evidence.every(([, result]) => result.confidence === 'high') ? 'high' : 'moderate';
  const overallLevel = ordinalToCefr(overall);
  const strengths = evidence.filter(([, result]) => cefrOrdinal(result.level) > overall).map(([skill]) => skill);
  const developmentPriorities: string[] = evidence.filter(([, result]) => cefrOrdinal(result.level) < overall).map(([skill]) => skill);
  for (const [skill, result] of evidence) {
    for (const [dimension, value] of Object.entries(result.dimensions ?? {})) if (cefrOrdinal(value.level) < cefrOrdinal(result.level)) developmentPriorities.push(`${skill}.${dimension}`);
  }
  const manualReviewRequired = [...flags].some((flag) => ['HIGH_SKILL_VARIANCE', 'PRODUCTIVE_SKILLS_BELOW_OVERALL', 'BORDERLINE_LEVEL', 'LOW_ITEM_CONFIDENCE', 'TECHNICAL_INTERRUPTION', 'NON_MONOTONIC_PATTERN'].includes(flag));
  if (manualReviewRequired) flags.add('MANUAL_REVIEW_REQUIRED');
  return {
    overallLevel,
    recommendedPlacement: `${overallLevel.replace('+', '')}${overallLevel.includes('+') ? ' consolidation / next-level preparation' : ' consolidation'}`,
    confidence,
    skills,
    strengths: [...new Set(strengths)],
    developmentPriorities: [...new Set(developmentPriorities)].slice(0, 4),
    flags: [...flags],
    manualReviewRequired,
    decisionRuleVersion: CEFR_DECISION_RULE_VERSION,
    routingRuleVersion: CEFR_ROUTING_RULE_VERSION,
    reportModelVersion: CEFR_REPORT_MODEL_VERSION,
    provisionalStandard: true,
    disclaimer: CEFR_DISCLAIMER,
  };
}

export function emptyCefrProfile(flags: string[] = []): CefrProfile {
  return { overallLevel: null, confidence: 'low', skills: {}, strengths: [], developmentPriorities: [], flags, manualReviewRequired: true, decisionRuleVersion: CEFR_DECISION_RULE_VERSION, routingRuleVersion: CEFR_ROUTING_RULE_VERSION, reportModelVersion: CEFR_REPORT_MODEL_VERSION, provisionalStandard: true, disclaimer: CEFR_DISCLAIMER };
}
