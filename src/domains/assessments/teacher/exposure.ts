import type { AssessmentStudentExposure, StudentSeenItem } from '../types';

export type SeenMark = { seenAt: string; assessmentTitle: string };
export type SeenIndex = { items: Map<string, SeenMark>; texts: Map<string, SeenMark> };

/** Lookup of what a student has seen, by bank item id (externalId) and by text (taskletId). */
export function buildSeenIndex(seen: StudentSeenItem[]): SeenIndex {
  const items = new Map<string, SeenMark>();
  const texts = new Map<string, SeenMark>();
  for (const entry of seen) {
    const mark = { seenAt: entry.seenAt, assessmentTitle: entry.assessmentTitle };
    if (!items.has(entry.itemKey)) items.set(entry.itemKey, mark);
    if (entry.taskletKey) {
      const current = texts.get(entry.taskletKey);
      if (!current || current.seenAt < mark.seenAt) texts.set(entry.taskletKey, mark);
    }
  }
  return { items, texts };
}

export const formatSeenDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const seenLabel = (studentName: string, mark: SeenMark) => `${studentName} já viu em “${mark.assessmentTitle}” (${formatSeenDate(mark.seenAt)})`;

const TEXT_SKILLS = new Set(['reading', 'listening']);
const PRODUCTIVE_SKILLS = new Set(['writing', 'spoken_production', 'spoken_interaction', 'speaking', 'mediation']);

export type ExposureSummary = {
  texts: { key: string; title: string | null; seenAt: string; assessmentTitle: string }[];
  tasks: { key: string; skill: string; seenAt: string; assessmentTitle: string }[];
  otherItems: number;
  /** Pools that cannot fill the draw with unseen items. */
  shortPools: { sectionTitle: string; unseen: number; drawCount: number }[];
  /** Pools where every drawn item will be new. */
  freshPools: number;
  clean: boolean;
};

/** Groups repeated questions by text and task for the assignment warning. */
export function summarizeExposure(exposure: AssessmentStudentExposure): ExposureSummary {
  const texts = new Map<string, ExposureSummary['texts'][number]>();
  const tasks: ExposureSummary['tasks'] = [];
  let otherItems = 0;
  for (const item of exposure.fixed) {
    if (TEXT_SKILLS.has(item.skill) && item.taskletKey) {
      if (!texts.has(item.taskletKey)) texts.set(item.taskletKey, { key: item.taskletKey, title: item.taskletTitle, seenAt: item.seenAt, assessmentTitle: item.assessmentTitle });
    } else if (PRODUCTIVE_SKILLS.has(item.skill)) tasks.push({ key: item.itemKey, skill: item.skill, seenAt: item.seenAt, assessmentTitle: item.assessmentTitle });
    else otherItems += 1;
  }
  const shortPools = exposure.pools.filter((pool) => pool.unseen < pool.drawCount).map(({ sectionTitle, unseen, drawCount }) => ({ sectionTitle, unseen, drawCount }));
  return {
    texts: [...texts.values()], tasks, otherItems, shortPools,
    freshPools: exposure.pools.length - shortPools.length,
    clean: texts.size === 0 && tasks.length === 0 && otherItems === 0 && shortPools.length === 0,
  };
}

const SKILL_NAMES: Record<string, string> = {
  writing: 'Writing', spoken_production: 'Spoken Production', spoken_interaction: 'Spoken Interaction', speaking: 'Speaking', mediation: 'Mediation',
};
export const skillName = (skill: string) => SKILL_NAMES[skill] ?? skill;

/** Readable, unique seed for a form generated for a student. */
export function studentFormSeed(studentName: string, date = new Date(), random = () => crypto.randomUUID().slice(0, 4)): string {
  const slug = studentName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'aluno';
  return `${slug}-${date.toISOString().slice(0, 10)}-${random().toUpperCase()}`;
}
