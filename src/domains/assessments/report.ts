import type { AssessmentResultSection, CefrLevel, CefrProfile } from './types';
import { formatProfileItem, meaningfulPriorities, RUBRIC_SKILLS } from './cefrLabels';

export const REPORT_SKILL_LABELS: Record<string, string> = {
  grammar: 'Grammar',
  vocabulary: 'Vocabulary',
  reading: 'Reading',
  listening: 'Listening',
  writing: 'Writing',
  speaking: 'Speaking',
  spoken_production: 'Spoken Production',
  spoken_interaction: 'Spoken Interaction',
  mediation: 'Mediation',
  language_use: 'Language Use',
};

export type PreviousAssessmentForReport = {
  attemptId: string;
  title: string;
  completedAt: string;
  score: number | null;
  skills: Record<string, number>;
};

export type AssessmentReportNote = { summary: string; nextSteps: string; updatedAt: string };

export type ReportSkillLine = {
  key: string;
  label: string;
  percentage: number | null;
  level: CefrLevel | null;
  previousPercentage: number | null;
  delta: number | null;
  /** Rated with a teacher rubric: show the level, not a percentage (B1 = 45% of the scale reads as a fail). */
  rubric: boolean;
};

export type StudentReportSummary = {
  skills: ReportSkillLine[];
  strengths: string[];
  priorities: string[];
  scoreDelta: number | null;
};

const STRENGTH_THRESHOLD = 75;
const PRIORITY_THRESHOLD = 60;

export const normalizeReportSkill = (skill: string) => (skill === 'use_of_english' ? 'language_use' : skill);

/** "writing.task_achievement" → "Writing · cumprimento da tarefa" */
export const formatReportItem = formatProfileItem;

const cefrSkillKey = (skill: string) => (skill === 'speaking' ? 'spoken_production' : ['grammar', 'vocabulary'].includes(skill) ? 'language_use' : skill);
const round = (value: number) => Math.round(value * 10) / 10;

export function buildStudentReport(input: {
  sections: AssessmentResultSection[];
  score: number | null | undefined;
  cefrProfile?: CefrProfile | null;
  previous?: PreviousAssessmentForReport | null;
}): StudentReportSummary {
  const totals = new Map<string, { score: number; max: number }>();
  for (const section of input.sections) {
    const key = normalizeReportSkill(section.skill ?? section.title);
    const current = totals.get(key) ?? { score: 0, max: 0 };
    totals.set(key, { score: current.score + section.score, max: current.max + section.maxScore });
  }

  const skills: ReportSkillLine[] = [...totals.entries()].map(([key, total]) => {
    const percentage = total.max > 0 ? round((100 * total.score) / total.max) : null;
    const previousPercentage = input.previous?.skills[key] ?? null;
    const level = input.cefrProfile?.skills[cefrSkillKey(key) as keyof CefrProfile['skills']]?.level ?? null;
    const rubric = RUBRIC_SKILLS.has(key) && level !== null;
    return {
      key,
      label: REPORT_SKILL_LABELS[key] ?? key.replace(/_/g, ' '),
      percentage,
      level,
      previousPercentage,
      delta: !rubric && percentage !== null && previousPercentage !== null ? round(percentage - previousPercentage) : null,
      rubric,
    };
  });

  let strengths: string[];
  let priorities: string[];
  if (input.cefrProfile) {
    strengths = input.cefrProfile.strengths.map(formatReportItem);
    priorities = meaningfulPriorities(input.cefrProfile).map(formatReportItem);
  } else {
    const scored = skills.filter((line): line is ReportSkillLine & { percentage: number } => line.percentage !== null);
    strengths = scored.filter((line) => line.percentage >= STRENGTH_THRESHOLD).sort((a, b) => b.percentage - a.percentage).slice(0, 3).map((line) => line.label);
    priorities = scored.filter((line) => line.percentage < PRIORITY_THRESHOLD).sort((a, b) => a.percentage - b.percentage).slice(0, 3).map((line) => line.label);
  }

  const scoreDelta = typeof input.score === 'number' && typeof input.previous?.score === 'number' ? round(input.score - input.previous.score) : null;
  return { skills, strengths, priorities, scoreDelta };
}
