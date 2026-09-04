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

export type AssessmentQuestionSnapshot = QuestionDefinition;

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
  };
  sections: StudentAttemptSection[];
  questions: AssessmentPresentedQuestion[];
  answers: Record<string, string>;
};
