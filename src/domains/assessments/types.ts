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
