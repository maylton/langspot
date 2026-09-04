import type { AssessmentSectionSkill, CefrLevel } from '../types';

export const ADAPTIVE_MODEL_VERSION = 'adaptive-rule-v1';

export type AdaptiveConfig = {
  initialAbility: number;
  minItems: number;
  maxItems: number;
  confidenceThreshold: number;
};

export type AdaptiveState = {
  skill: AssessmentSectionSkill;
  ability: number;
  confidence: number;
  itemsAnswered: number;
  correctCount: number;
  incorrectCount: number;
  recentAbilities: number[];
};

export type AdaptiveQuestionCandidate = {
  id: string;
  difficulty: number;
  cefr: CefrLevel | null;
};

export type AdaptiveAnswerOutcome = {
  state: AdaptiveState;
  cefr: CefrLevel;
  stopped: boolean;
};
