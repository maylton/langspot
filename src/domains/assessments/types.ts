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
