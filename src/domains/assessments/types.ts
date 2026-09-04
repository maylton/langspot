export type AssessmentType = 'placement' | 'diagnostic' | 'progress' | 'unit' | 'custom';
export type AssessmentStatus = 'draft' | 'published' | 'archived';
export type AssessmentMode = 'fixed' | 'adaptive';
export type AssessmentSectionSkill =
  | 'grammar'
  | 'vocabulary'
  | 'reading'
  | 'listening'
  | 'writing'
  | 'speaking'
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
  | 'tab_blur'
  | 'tab_focus'
  | 'fullscreen_exit'
  | 'paste_detected'
  | 'network_disconnect'
  | 'network_reconnect'
  | 'resumed'
  | 'submitted'
  | 'session_conflict';

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

import type { QuestionDefinition, QuestionType } from '../questions';

export type AssessmentQuestionSnapshot = QuestionDefinition & { difficulty?: number; cefr?: CefrLevel };

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
  questions: AssessmentDraftQuestion[];
};

export type AssessmentDraft = {
  id: string | null;
  title: string;
  description: string;
  type: AssessmentType;
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
  sections: AssessmentDraftSection[];
};

export type AssessmentPresentedQuestion = {
  id: string;
  sectionId: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  required: boolean;
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
  assessment: { id: string; title: string; type: AssessmentType; version: number };
  sections: AssessmentResultSection[];
  questions: AssessmentResultQuestion[];
  integrity: AssessmentIntegrityReport;
  adaptiveSkills?: AdaptiveSkillResult[];
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
};
