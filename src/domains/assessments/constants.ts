import type {
  AssessmentIntegrityStatus,
  AssessmentFramework,
  AssessmentMode,
  AssessmentNavigationMode,
  AssessmentResultVisibility,
  AssessmentSectionSkill,
  AssessmentStatus,
  AssessmentType,
} from './types';

export const ASSESSMENT_TYPES = ['placement', 'diagnostic', 'progress', 'unit', 'custom'] as const satisfies readonly AssessmentType[];
export const ASSESSMENT_FRAMEWORKS = ['none', 'cefr'] as const satisfies readonly AssessmentFramework[];
export const ASSESSMENT_STATUSES = ['draft', 'published', 'archived'] as const satisfies readonly AssessmentStatus[];
export const ASSESSMENT_MODES = ['fixed', 'adaptive'] as const satisfies readonly AssessmentMode[];
export const ASSESSMENT_SECTION_SKILLS = ['grammar', 'vocabulary', 'reading', 'listening', 'writing', 'speaking', 'spoken_production', 'spoken_interaction', 'mediation', 'language_use', 'use_of_english'] as const satisfies readonly AssessmentSectionSkill[];
export const ASSESSMENT_NAVIGATION_MODES = ['free', 'linear'] as const satisfies readonly AssessmentNavigationMode[];
export const ASSESSMENT_RESULT_VISIBILITIES = ['none', 'score_only', 'level_only', 'full_report', 'after_teacher_review'] as const satisfies readonly AssessmentResultVisibility[];
export const ASSESSMENT_INTEGRITY_STATUSES = ['no_unusual_activity', 'unusual_activity', 'review_recommended'] as const satisfies readonly AssessmentIntegrityStatus[];
