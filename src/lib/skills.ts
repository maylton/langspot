import { type Skill, type Student } from '../types';

export const skills: Skill[] = ['Speaking', 'Listening', 'Reading', 'Writing', 'Grammar', 'Vocabulary', 'Pronunciation'];

export const defaultSkills = (): Record<Skill, number> => ({ Speaking: 50, Listening: 50, Reading: 50, Writing: 50, Grammar: 50, Vocabulary: 50, Pronunciation: 50 });

export function skillAverage(students: Student[], skill: Skill) { return students.length ? Math.round(students.reduce((sum, student) => sum + student.skills[skill], 0) / students.length) : 0; }

export function averageSkillScore(scores: Record<Skill, number>) { return Math.round(Object.values(scores).reduce((sum, value) => sum + value, 0) / skills.length); }
