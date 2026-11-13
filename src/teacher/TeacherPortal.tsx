import { teacherApi } from './teacherApi';
import { Check, LoaderCircle } from 'lucide-react';
import { FormEvent, Suspense, lazy, useEffect, useState } from 'react';
import AdminTeachersModal from '../components/AdminTeachersModal';
import InviteTeacherModal from '../components/InviteTeacherModal';
import { can } from '../config/env';
import { CancellationRequest, DbLesson, DbNotification, DbQuestionBankItem, Profile, TeacherSubscription, supabase } from '../supabase';
import { App } from '../App';
import { dbAssignmentToAssignment, dbLessonToScheduled, dbQuestionBankToQuestion, formatNextLessonFromRows, normalizeSkills } from '../lib/mappers';
import { mapDbNotificationToTeacher } from '../lib/notifications';
import { functionErrorMessage, isSchemaCacheMiss, updateProfileContact } from '../lib/supabaseHelpers';
import { StudentPortal } from '../student/StudentPortal';
import { calculateStreak, streakMilestones } from '../student/streaks';
import { type AppNotification, type Assignment, type Material, type Payment, type QuestionBankItem, type ScheduledLesson, type Student } from '../types';
import { CancellationRequestsModal } from './modals/CancellationRequestsModal';

const AssessmentDashboard = lazy(() => import('../domains/assessments/teacher/AssessmentDashboard').then((module) => ({ default: module.AssessmentDashboard })));

export function TeacherPortal({ profile, authEmail, onProfileChange, onLogout }: { profile: Profile; authEmail: string; onProfileChange: (profile: Profile) => void; onLogout: () => void }) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteTeacherOpen, setInviteTeacherOpen] = useState(false);
  const [manageTeachersOpen, setManageTeachersOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [schedule, setSchedule] = useState<ScheduledLesson[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [subscription, setSubscription] = useState<TeacherSubscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState('');
  const [showAccessToast, setShowAccessToast] = useState(false);
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);

  const openStudentInvite = () => {
    setInviteMessage('');
    setInviteOpen(true);
  };

  const closeStudentInvite = () => {
    setInviteMessage('');
    setInviteOpen(false);
  };

  const loadRequests = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('cancellation_requests').select('*, lessons(*), student:profiles!cancellation_requests_student_id_fkey(full_name)').order('created_at', { ascending: false });
    setRequests((data ?? []) as unknown as CancellationRequest[]);
  };

  const loadNotifications = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: false })
      .limit(50);
    if (error) {
      if (!isSchemaCacheMiss(error)) console.warn('Notifications loading failed:', error);
      setNotifications([]);
      return;
    }
    setNotifications(((data ?? []) as DbNotification[]).map(mapDbNotificationToTeacher));
  };

  const loadTeacherData = async () => {
    if (!supabase) return;
    setDataLoading(true);

    // Core academic data must load independently from the materials library.
    // A Storage/RLS error in materials should never make students or lessons disappear.
    const [{ data: records, error: recordsError }, { data: lessons, error: lessonsError }, { data: activityRows, error: activityError }, { data: freezeRows, error: freezeError }] = await Promise.all([
      supabase.from('student_records').select('*, student:profiles!student_records_student_id_fkey(*)').order('created_at', { ascending: false }),
      supabase.from('lessons').select('*').order('starts_at', { ascending: true }),
      supabase.from('study_activities').select('*').order('activity_date', { ascending: false }),
      supabase.from('streak_freezes').select('*').order('protected_date', { ascending: false }),
    ]);

    if (recordsError || lessonsError || activityError || (freezeError && !isSchemaCacheMiss(freezeError))) {
      setMessage(`Não foi possível carregar alunos e aulas: ${recordsError?.message ?? lessonsError?.message ?? activityError?.message ?? freezeError?.message}`);
      setDataLoading(false);
      return;
    }

    const lessonRows = (lessons ?? []) as DbLesson[];
    const mappedStudents = (records ?? []).map((row: any): Student => {
      const skillValues = normalizeSkills(row.skills);
      const studentLessons = lessonRows
        .filter((lesson) => lesson.student_id === row.student_id && (lesson.status === 'completed' || new Date(lesson.starts_at) < new Date()))
        .map((lesson) => { const scheduled = dbLessonToScheduled(lesson); return { id: scheduled.id, date: scheduled.date, startTime: scheduled.startTime, duration: scheduled.duration, topic: scheduled.topic, onlineUrl: scheduled.onlineUrl, notes: scheduled.notes, strengths: scheduled.strengths, improvements: scheduled.improvements, homework: scheduled.homework, attendance: scheduled.attendance, skillScores: scheduled.skillScores }; });
      const values = Object.values(skillValues);
      const streakDates = [
        ...(activityRows ?? []).filter((activity: any) => activity.student_id === row.student_id).map((activity: any) => activity.activity_date),
        ...(freezeRows ?? []).filter((freeze: any) => freeze.student_id === row.student_id).map((freeze: any) => freeze.protected_date),
      ];
      const streak = calculateStreak(streakDates);
      return {
        id: row.student_id,
        name: row.student?.full_name || 'Aluno sem nome',
        email: row.student?.email || '',
        whatsappPhone: row.student?.whatsapp_phone || '',
        age: row.age != null ? String(row.age) : '',
        level: row.level || 'A1',
        goal: row.goal || '',
        status: 'Ativo',
        progress: values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0,
        nextClass: formatNextLessonFromRows(row.student_id, lessonRows),
        notes: row.notes || '',
        skills: skillValues,
        lessons: studentLessons,
        currentStreak: streak.current,
        bestStreak: streak.best,
        achievementCount: streakMilestones.filter((milestone) => streak.best >= milestone.days).length,
      };
    });
    setStudents(mappedStudents);
    setSchedule(lessonRows.map(dbLessonToScheduled));

    const [{ data: materialRows, error: materialsError }, { data: assignmentRows, error: assignmentsError }] = await Promise.all([
      supabase.from('materials').select('*').order('created_at', { ascending: false }),
      supabase.from('material_assignments').select('material_id, student_id'),
    ]);

    if (materialsError || assignmentsError) {
      setMaterials([]);
      setMessage(`Alunos e aulas foram carregados, mas houve um problema na biblioteca de materiais: ${materialsError?.message ?? assignmentsError?.message}`);
      setDataLoading(false);
      return;
    }

    const signedMaterials = await Promise.all((materialRows ?? []).map(async (row: any) => {
      let resolvedUrl = row.url ?? '';
      if (row.storage_path) {
        const { data: signed } = await supabase!.storage.from('materials').createSignedUrl(row.storage_path, 60 * 60);
        resolvedUrl = signed?.signedUrl ?? '';
      }
      return { id: row.id, title: row.title, type: row.type, level: row.level, skill: row.skill, url: resolvedUrl, description: row.description ?? '', createdAt: row.created_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10), assignedStudentIds: (assignmentRows ?? []).filter((a: any) => a.material_id === row.id).map((a: any) => a.student_id), storagePath: row.storage_path ?? undefined, fileName: row.file_name ?? undefined, fileSize: row.file_size ?? undefined, source: row.material_source ?? 'link' } as Material;
    }));
    setMaterials(signedMaterials);
    const { data: taskRows, error: taskError } = await supabase.from('assignments').select('*').order('due_date', { ascending: true });
    if (taskError) { setAssignments([]); setMessage(`Dados principais carregados, mas houve um problema nas tarefas: ${taskError.message}`); }
    else {
      const signedTasks = await Promise.all((taskRows ?? []).map(async (row: any) => {
        if (!row.submission_file_path) return row;
        const { data: signed } = await supabase!.storage.from('assignment-submissions').createSignedUrl(row.submission_file_path, 60 * 60);
        return { ...row, submission_file_url: signed?.signedUrl ?? '' };
      }));
      setAssignments(signedTasks.map(dbAssignmentToAssignment));
    }
    const { data: questionRows, error: questionError } = await supabase.from('question_bank').select('*, question_bank_tasklets(external_id,input_kind,input_text,source_credit,source_reference)').order('created_at', { ascending: false });
    if (questionError && !isSchemaCacheMiss(questionError)) {
      setQuestionBank([]);
      setMessage(`Dados principais carregados, mas houve um problema no banco de questões: ${questionError.message}`);
    } else setQuestionBank(((questionRows ?? []) as DbQuestionBankItem[]).map(dbQuestionBankToQuestion));
    const { data: paymentRows, error: paymentError } = await supabase.from('payments').select('*').order('due_date', { ascending: true });
    if (paymentError) { setPayments([]); setMessage(`Dados principais carregados, mas houve um problema no financeiro: ${paymentError.message}`); }
    else setPayments((paymentRows ?? []).map((row: any): Payment => ({ id: row.id, studentId: row.student_id, description: row.description, amount: Number(row.amount), dueDate: row.due_date, status: row.status === 'paid' ? 'Pago' : row.status === 'overdue' ? 'Atrasado' : 'Pendente', paidAt: row.paid_at ?? undefined, createdAt: row.created_at })));
    setDataLoading(false);
  };

  useEffect(() => {
    const loadSubscription = async () => {
      if (!supabase) return;
      setSubscriptionLoading(true);
      setSubscriptionError('');
      const { data, error } = await supabase.rpc('ensure_teacher_subscription');
      if (error) {
        console.error('Subscription loading failed:', error);
        setSubscriptionError('Não foi possível carregar o período de teste. Verifique se a migração 1.1.2 foi aplicada no Supabase.');
        setSubscriptionLoading(false);
        return;
      }
      setSubscription((data as TeacherSubscription | null) ?? null);
      setSubscriptionLoading(false);
    };
    void loadSubscription();
    void loadRequests();
    void loadTeacherData();
    void loadNotifications();
  }, []);

  useEffect(() => {
    const shouldShowToast = subscription?.plan === 'owner' || subscription?.status === 'trialing';
    if (!shouldShowToast) {
      setShowAccessToast(false);
      return;
    }
    setShowAccessToast(true);
    const timeout = window.setTimeout(() => setShowAccessToast(false), 5000);
    return () => window.clearTimeout(timeout);
  }, [subscription?.plan, subscription?.status, subscription?.trial_ends_at]);

  const invite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setInviteMessage('');

    const { error } = await supabase.functions.invoke('invite-student', {
      body: {
        email: form.get('email'),
        fullName: form.get('name'),
        whatsappPhone: form.get('whatsappPhone'),
        level: form.get('level'),
        goal: form.get('goal'),
      },
    });

    if (error) {
      setInviteMessage(`Não foi possível enviar o convite: ${await functionErrorMessage(error)}`);
      return;
    }

    formElement.reset();
    setInviteMessage('Convite enviado com sucesso! O aluno receberá um link para definir a própria senha.');
    await loadTeacherData();
  };

  const { createStudentAccount, createScheduledLesson, updateScheduledLesson, cancelScheduledLesson, completeScheduledLesson, updateLessonRecord, createLessonRecord, deleteLessonRecord, createMaterial, deleteMaterial, assignMaterial, createAssignment, deleteAssignment, reviewAssignment, createQuestionBankItem, deleteQuestionBankItem, createPayment, updatePaymentStatus, deletePayment, updateStudentSkills, updateStudentProfile, deleteStudent } = teacherApi(profile, { schedule, materials });

  const resolveRequest = async (request: CancellationRequest, status: 'approved' | 'rejected', response: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('cancellation_requests').update({ status, teacher_response: response, resolved_at: new Date().toISOString() }).eq('id', request.id);
    if (!error && status === 'approved') await supabase.from('lessons').update({ status: 'cancelled' }).eq('id', request.lesson_id);
    await Promise.all([loadRequests(), loadTeacherData(), loadNotifications()]);
  };

  const markNotificationRead = async (id: string) => {
    if (!supabase) return;
    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, readAt } : item));
    const { error } = await supabase.from('notifications').update({ read_at: readAt }).eq('id', id);
    if (error) await loadNotifications();
  };

  const markAllNotificationsRead = async (ids: string[]) => {
    if (!supabase || !ids.length) return;
    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((item) => ids.includes(item.id) ? { ...item, readAt } : item));
    const { error } = await supabase.from('notifications').update({ read_at: readAt }).in('id', ids);
    if (error) await loadNotifications();
  };

  const pending = requests.filter((request) => request.status === 'pending').length;
  if (dataLoading) return <div className="auth-loading"><LoaderCircle className="spin" size={30} />Carregando alunos e aulas...</div>;

  const subscriptionActive = subscription?.status === 'active' || (subscription?.status === 'trialing' && Boolean(subscription.trial_ends_at && new Date(subscription.trial_ends_at) > new Date()));
  const trialDays = subscription?.trial_ends_at ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / 86400000)) : null;

  const accountAccess = subscription ? {
    label: subscription.plan === 'owner' ? 'Acesso permanente' : subscription.status === 'trialing' ? `Teste gratuito · ${trialDays} dia(s) restante(s)` : subscription.status === 'active' ? 'Plano ativo' : subscription.status === 'pending_confirmation' ? 'Confirmação pendente' : 'Acesso expirado',
    description: subscription.plan === 'owner' ? 'Sua conta possui acesso completo ao LangSpot, sem data de expiração.' : subscription.status === 'pending_confirmation' ? 'Confirme seu e-mail para iniciar os 30 dias de teste gratuito.' : subscriptionActive ? 'Todos os recursos do LangSpot estão liberados para esta conta.' : 'Seus dados permanecem disponíveis, mas novas alterações exigem uma assinatura ativa.',
    status: subscription.plan === 'owner' ? 'permanent' as const : subscriptionActive ? 'active' as const : 'inactive' as const,
  } : undefined;

  if (previewStudent) {
    const previewFallback: Profile = {
      id: previewStudent.id,
      role: 'student',
      full_name: previewStudent.name,
      teacher_id: profile.id,
      must_change_password: false,
      email: previewStudent.email,
      whatsapp_phone: previewStudent.whatsappPhone || '',
      avatar_url: '',
      school_name: '',
      onboarding_completed: true,
    };
    return <StudentPortal profile={previewFallback} onLogout={() => setPreviewStudent(null)} previewMode previewTeacherName={profile.full_name} />;
  }

  return <div className={`authenticated-app ${subscription && !subscriptionActive ? 'subscription-locked' : ''}`}>
    {subscriptionLoading && <div className="subscription-banner"><strong>Carregando seu período de teste…</strong><span>Estamos verificando o status da sua conta.</span></div>}
    {subscriptionError && <div className="subscription-banner subscription-banner-expired"><strong>Período de teste indisponível</strong><span>{subscriptionError}</span></div>}
    {message && <div className="subscription-banner subscription-banner-expired" role="alert"><strong>Parte dos dados não carregou</strong><span>{message}</span></div>}
    {!subscriptionLoading && !subscriptionError && subscription && subscription.plan !== 'owner' && !subscriptionActive && <div className="subscription-banner subscription-banner-expired"><strong>{subscription.status === 'pending_confirmation' ? 'Confirme seu e-mail para iniciar o teste' : 'Período de teste encerrado'}</strong><span>{subscription.status === 'pending_confirmation' ? 'Abra o link enviado ao seu e-mail. O teste gratuito de 30 dias começa após a confirmação.' : 'Seus dados continuam disponíveis, mas novas alterações exigem uma assinatura ativa.'}</span>{subscription.status !== 'pending_confirmation' && <button type="button" onClick={() => alert('A integração de pagamento será adicionada na próxima etapa.')}>Ver planos</button>}</div>}
    {showAccessToast && <div className="access-toast" role="status"><Check size={18} /><div><strong>{subscription?.plan === 'owner' ? 'Acesso permanente' : `Teste gratuito · ${trialDays} dia(s) restante(s)`}</strong><span>{subscription?.plan === 'owner' ? 'Sua conta possui acesso completo ao LangSpot.' : 'Todos os recursos estão liberados durante o período de teste.'}</span></div></div>}
    <App
      authenticatedMode
      accountAccess={accountAccess}
      assessmentContent={can.useAssessments() && supabase ? <Suspense fallback={<div className="assessment-loading"><LoaderCircle className="spin" size={24} />Carregando avaliações…</div>}><AssessmentDashboard client={supabase} teacherId={profile.id} students={students.map((student) => ({ id: student.id, name: student.name }))} bank={questionBank.map((question) => ({ bankId: question.id, id: question.externalId ?? question.id, externalId: question.externalId, type: question.type, prompt: question.prompt, options: question.options, answer: question.answer, explanation: question.explanation, cefr: question.level, difficulty: question.difficulty ?? ({ A1: 1.5, 'A1+': 2.25, A2: 3, 'A2+': 4, B1: 5, 'B1+': 5.75, B2: 6.5, 'B2+': 7.25, C1: 8, 'C1+': 8.75, C2: 9.5 } as const)[question.level], skill: question.skill, subskill: question.subskill, taskType: question.taskType, topic: question.topic, genre: question.genre, audience: question.audience, qualityStatus: question.qualityStatus, psychometricStatus: question.psychometricStatus, isPilot: question.sourceOrigin === 'cefr_pilot', sourceMaterial: question.skill === 'reading' ? question.taskletInput : question.sourceMaterial, sourceCredit: question.sourceCredit, sourceReference: question.sourceReference, transcript: question.skill === 'listening' ? question.taskletInput : undefined, transcriptVisibility: question.skill === 'listening' ? 'after_submit' : undefined, rubric: question.rubric, responseConstraints: question.responseConstraints, recordingSeconds: question.type === 'speaking' && question.responseConstraints ? question.responseConstraints.max * (question.responseConstraints.unit === 'minutes' ? 60 : 1) : undefined, primaryEvidence: question.primaryEvidence, taskletId: question.taskletExternalId, restricted: question.restricted }))} /></Suspense> : undefined}
      initialStudents={students}
      initialSchedule={schedule}
      initialMaterials={materials}
      initialAssignments={assignments}
      initialQuestionBank={questionBank}
      initialPayments={payments}
      initialNotifications={notifications}
      onMarkNotificationRead={markNotificationRead}
      onMarkAllNotificationsRead={markAllNotificationsRead}
      onLogout={onLogout}
      onInviteStudent={subscriptionActive ? openStudentInvite : undefined}
      onInviteTeacher={subscriptionActive && subscription?.plan === 'owner' ? () => setInviteTeacherOpen(true) : undefined}
      onManageTeachers={subscriptionActive && subscription?.plan === 'owner' ? () => setManageTeachersOpen(true) : undefined}
      onCreateStudentAccount={createStudentAccount}
      onCreateScheduledLesson={createScheduledLesson}
      onUpdateScheduledLesson={updateScheduledLesson}
      onCancelScheduledLesson={cancelScheduledLesson}
      onCompleteScheduledLesson={completeScheduledLesson}
      onCreateLessonRecord={createLessonRecord}
      onUpdateLessonRecord={updateLessonRecord}
      onDeleteLessonRecord={deleteLessonRecord}
      onUpdateStudentSkills={updateStudentSkills}
      onUpdateStudentProfile={updateStudentProfile}
      onDeleteStudent={deleteStudent}
      onPreviewStudent={setPreviewStudent}
      onCreateMaterial={createMaterial}
      onDeleteMaterial={deleteMaterial}
      onAssignMaterial={assignMaterial}
      onCreateAssignment={createAssignment}
      onDeleteAssignment={deleteAssignment}
      onReviewAssignment={reviewAssignment}
      onCreateQuestionBankItem={createQuestionBankItem}
      onDeleteQuestionBankItem={deleteQuestionBankItem}
      onCreatePayment={createPayment}
      onUpdatePaymentStatus={updatePaymentStatus}
      onDeletePayment={deletePayment}
      onOpenCancellationRequests={() => setRequestsOpen(true)}
      cancellationRequestCount={pending}
      initialSettings={{ teacherName: profile.full_name, email: profile.email || authEmail, whatsappPhone: profile.whatsapp_phone || '', schoolName: profile.school_name, avatar: profile.avatar_url }}
      onProfileSettingsChange={async (settings) => {
        if (!supabase) return;
        const updates = { full_name: settings.teacherName, email: settings.email, whatsapp_phone: settings.whatsappPhone, school_name: settings.schoolName, avatar_url: settings.avatar };
        const { data, error } = await updateProfileContact(profile.id, updates);
        if (!error) onProfileChange({ ...profile, ...updates });
        if (!error && data) onProfileChange(data as Profile);
      }}
    />
    {inviteOpen && <div className="modal-backdrop" onMouseDown={closeStudentInvite}><section className="modal invite-modal" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><h2>Convidar aluno</h2><button className="icon-button" onClick={closeStudentInvite}>×</button></div><form className="form-grid" onSubmit={invite}><label>Nome completo<input name="name" required /></label><label>E-mail<input name="email" type="email" required /></label><label>WhatsApp<input name="whatsappPhone" placeholder="+55 85 99999-9999" /></label><label>Nível<select name="level"><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option></select></label><label>Objetivo<input name="goal" placeholder="Conversação, intercâmbio..." /></label>{inviteMessage && <div className="auth-message full-field">{inviteMessage}</div>}<div className="form-actions"><button type="button" className="cancel-button" onClick={closeStudentInvite}>Cancelar</button><button className="primary-button">Enviar convite</button></div></form></section></div>}
    {inviteTeacherOpen && subscription?.plan === 'owner' && <InviteTeacherModal onClose={() => setInviteTeacherOpen(false)} />}
    {manageTeachersOpen && subscription?.plan === 'owner' && <AdminTeachersModal onClose={() => setManageTeachersOpen(false)} />}
    {requestsOpen && <CancellationRequestsModal requests={requests} onClose={() => setRequestsOpen(false)} onResolve={resolveRequest} />}
  </div>;
}
