/** The teacher portal's writes to Supabase (lessons, students, materials, tasks, quizzes, payments). */
import { DbAssignment, DbLesson, DbQuestionBankItem, Profile, supabase } from '../supabase';
import { dbAssignmentToAssignment, dbLessonToScheduled, dbQuestionBankToQuestion, lessonRecordToDb, scheduledToDb } from '../lib/mappers';
import { functionErrorMessage, updateProfileContact } from '../lib/supabaseHelpers';
import { MAX_UPLOAD_SIZE, isMaterialUploadFile, materialTypeFromFile } from '../lib/uploads';
import { type AssignmentInput, type LessonRecordInput, type Material, type MaterialInput, type Payment, type PaymentInput, type PaymentStatus, type QuestionBankInput, type ScheduledLesson, type ScheduledLessonInput, type Skill, type Student, type StudentCreateInput, type TextComment } from '../types';

export function teacherApi(profile: Profile, state: { schedule: ScheduledLesson[]; materials: Material[] }) {
  const createStudentAccount = async ({ name, email, whatsappPhone, age, level, goal, notes }: StudentCreateInput) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { data, error } = await supabase.functions.invoke('invite-student', { body: { action: 'create-with-password', email, fullName: name, age, level, goal, notes, whatsappPhone } });
    if (error) throw new Error(await functionErrorMessage(error));
    // Do not reload all teacher data here. That temporarily unmounts <App>
    // and would close the one-time temporary-password modal before it appears.
    // App adds the newly-created student to its current state; future reloads
    // continue to retrieve the account from Supabase normally.
    return { temporaryPassword: String(data.temporaryPassword), studentId: String(data.studentId) };
  };

  const createScheduledLesson = async (lesson: ScheduledLessonInput) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const payload = scheduledToDb(profile.id, lesson);
    const { data, error } = await supabase.from('lessons').insert(payload).select('*').single();
    if (error) throw new Error(error.message);
    return dbLessonToScheduled(data as DbLesson);
  };

  const updateScheduledLesson = async (id: string, lesson: ScheduledLessonInput) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { data, error } = await supabase.from('lessons').update(scheduledToDb(profile.id, lesson)).eq('id', id).select('*').single();
    if (error) throw new Error(error.message);
    return dbLessonToScheduled(data as DbLesson);
  };

  const cancelScheduledLesson = async (id: string) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { data, error } = await supabase
      .from('lessons')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('teacher_id', profile.id)
      .select('id')
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('A aula não foi encontrada ou você não tem permissão para alterá-la.');
  };

  const completeScheduledLesson = async (id: string, record: LessonRecordInput) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const lesson = state.schedule.find((item) => item.id === id);
    if (!lesson) throw new Error('Aula não encontrada.');
    const { error: lessonError } = await supabase.from('lessons').update(lessonRecordToDb(record)).eq('id', id).eq('teacher_id', profile.id);
    if (lessonError) throw new Error(lessonError.message);
    const { error: skillsError } = await supabase.from('student_records').update({ skills: record.skillScores }).eq('student_id', lesson.studentId).eq('teacher_id', profile.id);
    if (skillsError) throw new Error(skillsError.message);
  };

  const updateLessonRecord = async (id: string, record: LessonRecordInput) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { data, error } = await supabase.from('lessons').update(lessonRecordToDb(record)).eq('id', id).eq('teacher_id', profile.id).select('*').single();
    if (error) throw new Error(error.message);
    const updated = dbLessonToScheduled(data as DbLesson);
    const { error: skillsError } = await supabase.from('student_records').update({ skills: record.skillScores }).eq('student_id', updated.studentId).eq('teacher_id', profile.id);
    if (skillsError) throw new Error(skillsError.message);
    return updated;
  };

  const createLessonRecord = async (studentId: string, record: LessonRecordInput) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { data, error } = await supabase.from('lessons').insert({ teacher_id: profile.id, student_id: studentId, ...lessonRecordToDb(record) }).select('*').single();
    if (error) throw new Error(error.message);
    const created = dbLessonToScheduled(data as DbLesson);
    const { error: skillsError } = await supabase.from('student_records').update({ skills: record.skillScores }).eq('student_id', studentId).eq('teacher_id', profile.id);
    if (skillsError) throw new Error(skillsError.message);
    return created;
  };

  const deleteLessonRecord = async (id: string) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { error } = await supabase.from('lessons').delete().eq('id', id).eq('teacher_id', profile.id);
    if (error) throw new Error(error.message);
  };

  const createMaterial = async (material: MaterialInput) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    let storagePath: string | null = null;
    let resolvedUrl = material.url;
    if (material.file) {
      const safeName = material.file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-');
      storagePath = `${profile.id}/${crypto.randomUUID()}-${safeName}`;
      if (!isMaterialUploadFile(material.file) || material.file.size > MAX_UPLOAD_SIZE) throw new Error('Escolha um PDF, DOCX, PPTX ou imagem de até 10 MB.');
      const { error: uploadError } = await supabase.storage.from('materials').upload(storagePath, material.file, { contentType: material.file.type || 'application/octet-stream', upsert: false });
      if (uploadError) throw new Error(`Falha no upload: ${uploadError.message}`);
      const { data: signed } = await supabase.storage.from('materials').createSignedUrl(storagePath, 60 * 60);
      resolvedUrl = signed?.signedUrl ?? '';
    }
    const payload = { teacher_id: profile.id, title: material.title, type: material.file ? materialTypeFromFile(material.file) : material.type, level: material.level, skill: material.skill, url: material.file ? '' : material.url, description: material.description, storage_path: storagePath, file_name: material.file?.name ?? null, file_size: material.file?.size ?? null, mime_type: material.file?.type ?? null, material_source: material.file ? 'upload' : 'link' };
    const { data, error } = await supabase.from('materials').insert(payload).select('*').single();
    if (error) { if (storagePath) await supabase.storage.from('materials').remove([storagePath]); throw new Error(error.message); }
    return { id: data.id, title: data.title, type: data.type, level: data.level, skill: data.skill, url: resolvedUrl, description: data.description ?? '', createdAt: data.created_at.slice(0, 10), assignedStudentIds: [], storagePath: data.storage_path ?? undefined, fileName: data.file_name ?? undefined, fileSize: data.file_size ?? undefined, source: data.material_source ?? 'link' } as Material;
  };

  const deleteMaterial = async (id: string) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const material = state.materials.find((item) => item.id === id);
    const { error } = await supabase.from('materials').delete().eq('id', id).eq('teacher_id', profile.id);
    if (error) throw new Error(error.message);
    if (material?.storagePath) { const { error: storageError } = await supabase.storage.from('materials').remove([material.storagePath]); if (storageError) console.warn(storageError.message); }
  };

  const assignMaterial = async (materialId: string, studentIds: string[]) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { error: deleteError } = await supabase.from('material_assignments').delete().eq('material_id', materialId);
    if (deleteError) throw new Error(deleteError.message);
    if (!studentIds.length) return;
    const { error } = await supabase.from('material_assignments').insert(studentIds.map((studentId) => ({ material_id: materialId, student_id: studentId })));
    if (error) throw new Error(error.message);
  };

  const createAssignment = async (assignment: AssignmentInput) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const assignmentRow = { teacher_id: profile.id, student_id: assignment.studentId, material_id: assignment.materialId || null, title: assignment.title, instructions: assignment.instructions, due_date: assignment.dueDate, status: 'pending', ...(assignment.assignmentType === 'interactive' ? { assignment_type: 'interactive', interactive_content: assignment.interactiveContent ?? null } : {}) };
    const { data, error } = await supabase.from('assignments').insert(assignmentRow).select('*').single();
    if (error) throw new Error(error.message);
    if (assignment.materialId) {
      const { error: shareError } = await supabase.from('material_assignments').upsert({ material_id: assignment.materialId, student_id: assignment.studentId }, { onConflict: 'material_id,student_id' });
      if (shareError) console.warn(`A tarefa foi criada, mas o material não pôde ser compartilhado automaticamente: ${shareError.message}`);
    }
    return dbAssignmentToAssignment(data as DbAssignment);
  };
  const deleteAssignment = async (id: string) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { data: existing } = await supabase.from('assignments').select('submission_file_path').eq('id', id).eq('teacher_id', profile.id).maybeSingle();
    if (existing?.submission_file_path) {
      const { error: storageError } = await supabase.storage.from('assignment-submissions').remove([existing.submission_file_path]);
      if (storageError) console.warn(storageError.message);
    }
    const { error } = await supabase.from('assignments').delete().eq('id', id).eq('teacher_id', profile.id);
    if (error) throw new Error(error.message);
  };
  const reviewAssignment = async (id: string, feedback: string, grade?: number, textComments: TextComment[] = []) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { error } = await supabase.from('assignments').update({ feedback, grade: grade ?? null, text_comments: textComments, status: 'reviewed' }).eq('id', id).eq('teacher_id', profile.id);
    if (error) throw new Error(error.message);
  };
  const createQuestionBankItem = async (question: QuestionBankInput) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { data, error } = await supabase.from('question_bank').insert({
      teacher_id: profile.id,
      level: question.level,
      category: question.category,
      question_type: question.type,
      prompt: question.prompt,
      options: question.options,
      answer: question.answer,
      explanation: question.explanation ?? null,
      skill: question.skill ?? null,
      subskill: question.subskill ?? null,
      difficulty: question.difficulty ?? null,
      task_type: question.taskType ?? null,
      topic: question.topic ?? null,
      genre: question.genre ?? null,
      operational_descriptor: question.operationalDescriptor ?? null,
      quality_status: question.qualityStatus ?? 'draft',
      restricted: question.restricted ?? false,
    }).select('*').single();
    if (error) throw new Error(error.message);
    return dbQuestionBankToQuestion(data as DbQuestionBankItem);
  };
  const deleteQuestionBankItem = async (id: string) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { error } = await supabase.from('question_bank').delete().eq('id', id).eq('teacher_id', profile.id);
    if (error) throw new Error(error.message);
  };

  const createPayment = async (payment: PaymentInput) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { data, error } = await supabase.from('payments').insert({ teacher_id: profile.id, student_id: payment.studentId, description: payment.description, amount: payment.amount, due_date: payment.dueDate, status: 'pending' }).select('*').single();
    if (error) throw new Error(error.message);
    return { id: data.id, studentId: data.student_id, description: data.description, amount: Number(data.amount), dueDate: data.due_date, status: 'Pendente', createdAt: data.created_at } as Payment;
  };
  const updatePaymentStatus = async (id: string, status: PaymentStatus) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const dbStatus = status === 'Pago' ? 'paid' : status === 'Atrasado' ? 'overdue' : 'pending';
    const { error } = await supabase.from('payments').update({ status: dbStatus, paid_at: status === 'Pago' ? new Date().toISOString() : null }).eq('id', id).eq('teacher_id', profile.id);
    if (error) throw new Error(error.message);
  };
  const deletePayment = async (id: string) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { error } = await supabase.from('payments').delete().eq('id', id).eq('teacher_id', profile.id);
    if (error) throw new Error(error.message);
  };

  const updateStudentSkills = async (studentId: string, skillValues: Record<Skill, number>) => {
    const { error } = await supabase!.from('student_records').update({ skills: skillValues }).eq('student_id', studentId);
    if (error) throw new Error(error.message);
  };

  const updateStudentProfile = async (student: Student) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const [{ error: profileError }, { error: recordError }] = await Promise.all([
      updateProfileContact(student.id, { full_name: student.name, whatsapp_phone: student.whatsappPhone ?? '' }, (query) => query.eq('teacher_id', profile.id)),
      supabase.from('student_records').update({ age: student.age ? Number(student.age) : null, level: student.level, goal: student.goal, notes: student.notes }).eq('student_id', student.id).eq('teacher_id', profile.id),
    ]);
    if (profileError || recordError) throw new Error(profileError?.message ?? recordError?.message ?? 'Não foi possível atualizar o aluno.');
  };

  const deleteStudent = async (studentId: string) => {
    const { error } = await supabase!.from('student_records').delete().eq('student_id', studentId);
    if (error) throw new Error(error.message);
  };
  return { createStudentAccount, createScheduledLesson, updateScheduledLesson, cancelScheduledLesson, completeScheduledLesson, updateLessonRecord, createLessonRecord, deleteLessonRecord, createMaterial, deleteMaterial, assignMaterial, createAssignment, deleteAssignment, reviewAssignment, createQuestionBankItem, deleteQuestionBankItem, createPayment, updatePaymentStatus, deletePayment, updateStudentSkills, updateStudentProfile, deleteStudent };
}
