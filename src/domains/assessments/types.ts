export type AssessmentType = 'placement' | 'diagnostic' | 'progress' | 'unit' | 'custom';
export type AssessmentStatus = 'draft' | 'published' | 'archived';
export type AssessmentMode = 'fixed' | 'adaptive';
export type AssessmentFramework = 'none' | 'cefr';
export type AssessmentSectionSkill =
  | 'grammar'
  | 'vocabulary'
  | 'reading'
  | 'listening'
  | 'writing'
  | 'speaking'
  | 'spoken_production'
  | 'spoken_interaction'
  | 'mediation'
  | 'language_use'
  | 'use_of_english';
export type AssessmentNavigationMode = 'free' | 'linear';
export type AssessmentResultVisibility =
  | 'none'
  | 'score_only'
  | 'level_only'
  | 'full_report'
  | 'after_teacher_review';
export type AssessmentIntegrityStatus =
  | 'no_unusual_activity'
  | 'unusual_activity'
  | 'review_recommended';

export type AssessmentAssignmentStatus =
  | 'assigned'
  | 'available'
  | 'started'
  | 'submitted'
  | 'grading'
  | 'completed'
  | 'expired';

export type AssessmentAttemptStatus =
  | 'in_progress'
  | 'submitted'
  | 'grading'
  | 'completed'
  | 'expired'
  | 'invalidated';

export type AssessmentGradingStatus = 'pending' | 'auto_graded' | 'manual_review' | 'reviewed';

export type AssessmentEventType =
  | 'assessment_started'
  | 'question_opened'
  | 'question_closed'
  | 'answer_saved'
  | 'audio_play_started'
  | 'tab_blur'
  | 'tab_focus'
  | 'fullscreen_exit'
  | 'paste_detected'
  | 'network_disconnect'
  | 'network_reconnect'
  | 'resumed'
  | 'submitted'
  | 'session_conflict';

export type CefrBaseLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type CefrLevel = CefrBaseLevel | 'A1+' | 'A2+' | 'B1+' | 'B2+' | 'C1+';
export type CefrSkill = 'reading' | 'listening' | 'writing' | 'spoken_production' | 'spoken_interaction' | 'mediation' | 'language_use';
export type CefrConfidence = 'low' | 'moderate' | 'high';
export type CefrQualityStatus = 'draft' | 'reviewed' | 'approved_for_pilot' | 'pilot_data_collected' | 'item_analysis' | 'approved' | 'pilot' | 'needs_revision' | 'retired';

import type { QuestionDefinition, QuestionType } from '../questions';

export type AssessmentRubricCriterion = { key: string; label: string; maxScore: number; scale?: 'numeric' | 'cefr' };
export type TranscriptVisibility = 'never' | 'after_submit' | 'always';

export type AssessmentQuestionSnapshot = QuestionDefinition & {
  externalId?: string;
  answerKey?: 'A' | 'B' | 'C' | 'D';
  bankVersion?: string;
  sourceOrigin?: 'teacher' | 'cefr_pilot';
  difficulty?: number;
  cefr?: CefrLevel;
  skill?: CefrSkill;
  subskill?: string;
  descriptorId?: string;
  operationalDescriptor?: string;
  taskType?: string;
  topic?: string;
  genre?: string;
  audience?: 'child' | 'teen' | 'adult' | 'general' | 'teen_adult';
  cognitiveProcesses?: string[];
  sourceMaterial?: string;
  qualityStatus?: CefrQualityStatus;
  isPilot?: boolean;
  psychometricStatus?: 'uncalibrated' | 'pilot_data_collected' | 'under_analysis' | 'calibrated';
  primaryEvidence?: string;
  responseConstraints?: { min: number; max: number; unit: 'words' | 'seconds' | 'minutes'; label: string };
  taskletId?: string;
  taskletTitle?: string;
  inputLength?: number;
  estimatedDurationSeconds?: number;
  estimatedDurationMinSeconds?: number;
  estimatedDurationMaxSeconds?: number;
  estimatedDurationLabel?: string;
  audioPath?: string;
  maxPlays?: number;
  autoplay?: boolean;
  transcript?: string;
  transcriptVisibility?: TranscriptVisibility;
  preparationSeconds?: number;
  recordingSeconds?: number;
  allowReview?: boolean;
  rubric?: AssessmentRubricCriterion[];
};

export type AssessmentDraftQuestion = {
  id: string;
  questionBankId: string | null;
  weight: number;
  required: boolean;
  snapshot: AssessmentQuestionSnapshot;
};

export type AssessmentDraftSection = {
  id: string;
  title: string;
  skill: AssessmentSectionSkill;
  instructions: string;
  weight: number;
  drawCount: number | null;
  cefrLevel?: CefrLevel | null;
  construct?: string;
  taskletKind?: 'screening' | 'primary' | 'confirmation' | 'floor' | 'ceiling';
  confirmationForSectionId?: string | null;
  questions: AssessmentDraftQuestion[];
};

export type AssessmentDraft = {
  id: string | null;
  title: string;
  description: string;
  type: AssessmentType;
  framework: AssessmentFramework;
  assessmentMode: AssessmentMode;
  navigationMode: AssessmentNavigationMode;
  levelMin: CefrLevel | null;
  levelMax: CefrLevel | null;
  timeLimitMinutes: number | null;
  maxAttempts: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  showResults: AssessmentResultVisibility;
  adaptiveInitialAbility: number;
  adaptiveMinItems: number;
  adaptiveMaxItems: number;
  adaptiveConfidenceThreshold: number;
  formVersion: string;
  decisionRuleVersion: string;
  routingRuleVersion: string;
  reportModelVersion: string;
  sections: AssessmentDraftSection[];
};

export type CefrLevelCheckPreset = {
  id: string;
  name: string;
  purpose: string;
  targetLevel: CefrBaseLevel;
  floorLevel: CefrBaseLevel | null;
  ceilingLevel: CefrBaseLevel | null;
  formVersion: string;
  presetVersion: string;
  estimatedDurationMinMinutes: number;
  estimatedDurationMaxMinutes: number;
};

export type AssessmentPresentedQuestion = {
  id: string;
  sectionId: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  required: boolean;
  audioPath?: string;
  maxPlays?: number;
  autoplay?: boolean;
  transcript?: string;
  preparationSeconds?: number;
  recordingSeconds?: number;
  allowReview?: boolean;
  sourceMaterial?: string;
  responseConstraints?: { min: number; max: number; unit: 'words' | 'seconds' | 'minutes'; label: string };
};

export type StudentAssessmentSummary = {
  assignmentId: string;
  assessmentId: string;
  title: string;
  description: string;
  availableFrom: string | null;
  dueAt: string | null;
  attemptLimit: number;
  status: AssessmentAssignmentStatus;
  activeAttemptId: string | null;
  latestAttemptId: string | null;
  framework?: AssessmentFramework;
  requiresAudio?: boolean;
  requiresMicrophone?: boolean;
};

export type StudentAttemptSection = {
  id: string;
  title: string;
  instructions: string;
  position: number;
};

export type StudentAttemptPayload = {
  attempt: {
    id: string;
    assignmentId: string;
    status: AssessmentAttemptStatus;
    startedAt: string;
    expiresAt: string | null;
    currentQuestionId: string | null;
  };
  assessment: {
    id: string;
    title: string;
    description: string;
    navigationMode: AssessmentNavigationMode;
    assessmentMode: AssessmentMode;
    adaptiveComplete: boolean;
  };
  sections: StudentAttemptSection[];
  questions: AssessmentPresentedQuestion[];
  answers: Record<string, string>;
};

export type AdaptiveAdvanceResult = { complete: boolean; nextQuestionId: string | null };

export type AssessmentResultSection = {
  id: string;
  title: string;
  skill?: AssessmentSectionSkill;
  score: number;
  maxScore: number;
  percentage: number | null;
};

export type AssessmentResultQuestion = {
  id: string;
  sectionId?: string;
  responseId?: string | null;
  prompt: string;
  type?: string;
  options?: string[];
  correctAnswer?: string | null;
  explanation?: string | null;
  answer: string | null;
  score: number | null;
  maxScore: number | null;
  gradingStatus?: AssessmentGradingStatus;
  teacherFeedback: string;
  timeSpentMs?: number;
  transcript?: string | null;
  mediaPath?: string | null;
  rubric?: AssessmentRubricCriterion[];
  rubricScores?: Record<string, number>;
};

export type TeacherAssessmentResult = {
  attempt: {
    id: string;
    studentId: string;
    studentName: string;
    status: AssessmentAttemptStatus;
    startedAt: string;
    submittedAt: string | null;
    rawScore: number | null;
    scaledScore: number | null;
    estimatedCefr: CefrLevel | null;
    integrityStatus: AssessmentIntegrityStatus;
    reviewedAt: string | null;
    scoringModelVersion: string;
  };
  assessment: { id: string; title: string; type: AssessmentType; version: number; framework?: AssessmentFramework };
  sections: AssessmentResultSection[];
  questions: AssessmentResultQuestion[];
  integrity: AssessmentIntegrityReport;
  adaptiveSkills?: AdaptiveSkillResult[];
  cefrProfile?: CefrProfile | null;
};

export type AssessmentIntegrityEvent = {
  id: string;
  type: AssessmentEventType;
  occurredAt: string;
  metadata: Record<string, unknown>;
};

export type AssessmentIntegrityReport = {
  status: AssessmentIntegrityStatus;
  windowExits: number;
  timeOutsideMs: number;
  pasteEvents: number;
  sessionConflicts: number;
  events: AssessmentIntegrityEvent[];
};

export type AdaptiveSkillResult = {
  sectionId: string;
  skill: AssessmentSectionSkill;
  ability: number;
  cefr: CefrLevel;
  confidence: number;
  itemsAnswered: number;
};

export type StudentAssessmentResult = {
  visible: boolean;
  status: AssessmentAttemptStatus;
  score?: number | null;
  estimatedCefr?: CefrLevel | null;
  sections?: AssessmentResultSection[];
  questions?: AssessmentResultQuestion[];
  cefrProfile?: CefrProfile | null;
};

export type CefrDimensionResult = { level: CefrLevel; evidence?: string };
export type CefrSkillResult = { level: CefrLevel; confidence: CefrConfidence; dimensions?: Record<string, CefrDimensionResult>; rawScore?: number; maxScore?: number };
export type CefrProfile = {
  overallLevel: CefrLevel | null;
  recommendedPlacement?: string | null;
  confidence: CefrConfidence;
  skills: Partial<Record<CefrSkill, CefrSkillResult>>;
  strengths: string[];
  developmentPriorities: string[];
  flags: string[];
  manualReviewRequired: boolean;
  decisionRuleVersion: string;
  routingRuleVersion: string;
  reportModelVersion: string;
  provisionalStandard: true;
  disclaimer: string;
};

export type AssessmentProgressPoint = { attemptId: string; assessmentId: string; title: string; type: AssessmentType; version: number; completedAt: string; score: number | null; estimatedCefr: CefrLevel | null; skills: Record<string, number> };
export type AssessmentProgressReport = { studentId: string; currentLevel: CefrLevel; history: AssessmentProgressPoint[]; levelUpdates: { attemptId: string; previousLevel: CefrLevel; confirmedLevel: CefrLevel; createdAt: string }[] };
