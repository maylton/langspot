import type {
  AssessmentAssignmentStatus,
  AssessmentAttemptStatus,
  AssessmentEventType,
  AssessmentGradingStatus,
  AssessmentFramework,
  AssessmentIntegrityStatus,
  AssessmentMode,
  AssessmentNavigationMode,
  AssessmentResultVisibility,
  AssessmentSectionSkill,
  AssessmentStatus,
  AssessmentType,
  CefrLevel,
} from './types';

export type AssessmentRow = {
  id: string;
  teacher_id: string;
  parent_assessment_id: string | null;
  title: string;
  description: string;
  type: AssessmentType;
  framework: AssessmentFramework;
  status: AssessmentStatus;
  assessment_mode: AssessmentMode;
  navigation_mode: AssessmentNavigationMode;
  level_min: CefrLevel | null;
  level_max: CefrLevel | null;
  time_limit_minutes: number | null;
  max_attempts: number;
  randomize_questions: boolean;
  randomize_options: boolean;
  show_results: AssessmentResultVisibility;
  version: number;
  scoring_model_version: string;
  form_version: string;
  decision_rule_version: string;
  routing_rule_version: string;
  report_model_version: string;
  adaptive_initial_ability: number;
  adaptive_min_items: number;
  adaptive_max_items: number;
  adaptive_confidence_threshold: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type AssessmentSectionRow = {
  id: string;
  assessment_id: string;
  title: string;
  skill: AssessmentSectionSkill;
  position: number;
  instructions: string;
  time_limit_seconds: number | null;
  adaptive: boolean;
  weight: number;
  draw_count: number | null;
  created_at: string;
  updated_at: string;
};

export type AssessmentQuestionRow = {
  id: string;
  assessment_id: string;
  section_id: string;
  question_bank_id: string | null;
  position: number;
  weight: number;
  required: boolean;
  question_snapshot: Record<string, unknown>;
  difficulty_snapshot: number | null;
  cefr_snapshot: CefrLevel | null;
  created_at: string;
};

export type AssessmentAssignmentRow = {
  id: string;
  assessment_id: string;
  teacher_id: string;
  student_id: string;
  available_from: string | null;
  due_at: string | null;
  attempt_limit: number;
  access_code_hash: string | null;
  status: AssessmentAssignmentStatus;
  created_at: string;
  updated_at: string;
};

export type AssessmentAttemptRow = {
  id: string;
  assessment_assignment_id: string;
  assessment_id: string;
  student_id: string;
  started_at: string;
  submitted_at: string | null;
  expires_at: string | null;
  status: AssessmentAttemptStatus;
  current_section_id: string | null;
  current_question_id: string | null;
  raw_score: number | null;
  scaled_score: number | null;
  estimated_cefr: CefrLevel | null;
  integrity_status: AssessmentIntegrityStatus;
  device_session_id: string | null;
  randomization_seed: string;
  scoring_model_version: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AssessmentResponseRow = {
  id: string;
  attempt_id: string;
  assessment_id: string;
  assessment_question_id: string;
  answer_payload: unknown;
  answered_at: string | null;
  time_spent_ms: number;
  score: number | null;
  max_score: number | null;
  grading_status: AssessmentGradingStatus;
  teacher_feedback: string;
  created_at: string;
  updated_at: string;
};

export type AssessmentEventRow = {
  id: string;
  attempt_id: string;
  event_type: AssessmentEventType;
  occurred_at: string;
  metadata: Record<string, unknown>;
};
