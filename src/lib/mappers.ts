import { DbAssignment, DbLesson, DbQuestionBankItem } from '../supabase';
import { type Assignment, type AttendanceStatus, type InteractiveAssignmentContent, type InteractiveAssignmentResult, type LessonRecordInput, type QuestionBankItem, type ScheduledLesson, type ScheduledLessonInput, type Skill, type TextComment } from '../types';

export function dbAssignmentToAssignment(row: DbAssignment): Assignment {
  const statusMap = { pending: 'Pendente', submitted: 'Entregue', reviewed: 'Corrigida' } as const;
  return { id: row.id, teacherId: row.teacher_id, studentId: row.student_id, materialId: row.material_id ?? undefined, title: row.title, instructions: row.instructions, dueDate: row.due_date, status: statusMap[row.status], submissionText: row.submission_text || undefined, submittedAt: row.submitted_at || undefined, submissionFileName: row.submission_file_name ?? undefined, submissionFileUrl: row.submission_file_url ?? undefined, feedback: row.feedback || undefined, grade: row.grade ?? undefined, textComments: Array.isArray(row.text_comments) ? row.text_comments as TextComment[] : [], createdAt: row.created_at, assignmentType: row.assignment_type ?? 'regular', interactiveContent: row.interactive_content as InteractiveAssignmentContent | null | undefined, interactiveResult: row.interactive_result as InteractiveAssignmentResult | null | undefined };
}

export function dbQuestionBankToQuestion(row: DbQuestionBankItem): QuestionBankItem {
  return { id: row.id, teacherId: row.teacher_id ?? undefined, externalId: row.external_id ?? undefined, bankVersion: row.bank_version ?? undefined, sourceOrigin: row.source_origin ?? 'teacher', level: row.level as QuestionBankItem['level'], category: row.category as QuestionBankItem['category'], type: row.question_type, prompt: row.prompt, options: row.options ?? [], answer: row.answer ?? '', answerKey: row.answer_key ?? undefined, explanation: row.explanation ?? undefined, skill: row.skill ?? undefined, subskill: row.subskill ?? undefined, difficulty: row.difficulty ?? undefined, taskType: row.task_type ?? undefined, topic: row.topic ?? undefined, genre: row.genre ?? undefined, audience: row.audience, operationalDescriptor: row.operational_descriptor ?? undefined, primaryEvidence: row.primary_evidence ?? undefined, responseConstraints: row.response_constraints ?? undefined, rubric: row.rubric ?? undefined, sourceMaterial: row.source_material ?? undefined, taskletId: row.tasklet_id ?? undefined, taskletExternalId: row.question_bank_tasklets?.external_id, taskletInput: row.question_bank_tasklets?.input_text, taskletInputKind: row.question_bank_tasklets?.input_kind, sourceCredit: row.question_bank_tasklets?.source_credit ?? undefined, sourceReference: row.question_bank_tasklets?.source_reference ?? undefined, qualityStatus: row.quality_status ?? 'draft', psychometricStatus: row.psychometric_status ?? undefined, restricted: row.restricted ?? false, usageCount: row.usage_count ?? 0, lastUsedAt: row.last_used_at ?? undefined, createdAt: row.created_at };
}

export function normalizeSkills(value: unknown): Record<Skill, number> {
  const defaults: Record<Skill, number> = { Speaking: 50, Listening: 50, Reading: 50, Writing: 50, Grammar: 50, Vocabulary: 50, Pronunciation: 50 };
  if (!value || typeof value !== 'object') return defaults;
  for (const key of Object.keys(defaults) as Skill[]) {
    const score = Number((value as Record<string, unknown>)[key]);
    if (Number.isFinite(score)) defaults[key] = Math.max(0, Math.min(100, score));
  }
  return defaults;
}

export function dbLessonToScheduled(lesson: DbLesson): ScheduledLesson {
  const date = new Date(lesson.starts_at);
  const statusMap: Record<string, ScheduledLesson['status']> = { scheduled: 'Agendada', completed: 'Concluída', cancelled: 'Cancelada' };
  return {
    id: lesson.id,
    studentId: lesson.student_id,
    date: date.toLocaleDateString('en-CA'),
    startTime: date.toTimeString().slice(0, 5),
    duration: lesson.duration_minutes,
    topic: lesson.topic,
    onlineUrl: lesson.online_url ?? '',
    status: statusMap[lesson.status] ?? 'Agendada',
    notes: lesson.notes ?? '',
    strengths: lesson.strengths ?? '',
    improvements: lesson.improvements ?? '',
    homework: lesson.homework ?? '',
    attendance: lesson.attendance ? ({ presente: 'Presente', ausente: 'Ausente', remarcada: 'Remarcada' } as Record<string, AttendanceStatus>)[lesson.attendance] : undefined,
    skillScores: lesson.skill_scores ?? undefined,
  };
}

export function scheduledToDb(teacherId: string, lesson: ScheduledLessonInput) {
  return {
    teacher_id: teacherId,
    student_id: lesson.studentId,
    starts_at: new Date(`${lesson.date}T${lesson.startTime}:00`).toISOString(),
    duration_minutes: lesson.duration,
    topic: lesson.topic,
    online_url: lesson.onlineUrl || null,
    status: 'scheduled',
  };
}

export function lessonRecordToDb(record: LessonRecordInput) {
  return {
    starts_at: new Date(`${record.date}T${record.startTime}:00`).toISOString(),
    duration_minutes: record.duration,
    topic: record.topic,
    online_url: record.onlineUrl || null,
    status: 'completed',
    notes: record.notes,
    strengths: record.strengths,
    improvements: record.improvements,
    homework: record.homework,
    attendance: record.attendance.toLowerCase(),
    skill_scores: record.skillScores,
  };
}

export function formatNextLessonFromRows(studentId: string, lessons: DbLesson[]) {
  const upcoming = lessons.filter((lesson) => lesson.student_id === studentId && lesson.status === 'scheduled' && new Date(lesson.starts_at) >= new Date()).sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
  if (!upcoming) return '';
  return new Date(upcoming.starts_at).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace('.', '');
}
