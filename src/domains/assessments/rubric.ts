import type { AssessmentRubricCriterion } from './types';

export function calculateRubricScore(criteria: AssessmentRubricCriterion[], scores: Record<string, number>, responseMaxScore: number): number {
  const rubricMax = criteria.reduce((total, criterion) => total + criterion.maxScore, 0);
  if (!rubricMax || responseMaxScore <= 0) return 0;
  const earned = criteria.reduce((total, criterion) => {
    const value = scores[criterion.key];
    if (!Number.isFinite(value) || value < 0 || value > criterion.maxScore) throw new Error(`Invalid rubric score for ${criterion.key}`);
    return total + value;
  }, 0);
  return (earned / rubricMax) * responseMaxScore;
}
