import { FormEvent, type InputHTMLAttributes, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Award, Ban, BookOpen, Brain, CalendarDays, Check, ClipboardList, Clock3, Edit3, ExternalLink, Eye, EyeOff, FileQuestion, FileText, Flag, Flame, GraduationCap, ImagePlus, Layers3, LayoutDashboard, LoaderCircle, LockKeyhole, LogOut, Moon, NotebookPen, Plus, RotateCcw, Snowflake, Sparkles, Sun, Target, Trash2, UserRound, UserPlus, X } from 'lucide-react';
import App, { Assignment, AssignmentInput, AttendanceStatus, InteractiveAssignmentContent, InteractiveAssignmentResult, LessonRecordInput, Material, MaterialInput, Payment, PaymentInput, PaymentStatus, PlatformSettings, QuestionBankInput, QuestionBankItem, ScheduledLesson, ScheduledLessonInput, Skill, Student, StudentCreateInput } from './App';
import { CancellationRequest, DbAssignment, DbLesson, DbMaterial, DbQuestionBankItem, Flashcard, FlashcardDeck, FlashcardReview, isSupabaseConfigured, LearningGoal, LearningJournalEntry, Profile, StreakFreeze, StudentRecord, StudyActivity, TeacherSubscription, supabase } from './supabase';
import { can } from './config/env';
import InviteAcceptance from './components/InviteAcceptance';
import InviteTeacherModal from './components/InviteTeacherModal';
import AdminTeachersModal from './components/AdminTeachersModal';

type AuthMode = 'login' | 'register' | 'forgot';
const streakMilestones = [
  { days: 3, title: 'Primeiros passos' },
  { days: 7, title: 'Uma semana firme' },
  { days: 14, title: 'Ritmo consistente' },
  { days: 30, title: 'Hábito de estudo' },
  { days: 100, title: 'Centenário' },
];

type AchievementDefinition = {
  id: string;
  category: string;
  title: string;
  description: string;
  target: number;
  current: number;
  icon: typeof Award;
};

const ORDERING_RESPONSE_SEPARATOR = '\u001f';
const normalizeInteractiveAnswer = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
const splitOrderingAnswer = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return [];
  const parts = trimmed.includes(ORDERING_RESPONSE_SEPARATOR)
    ? trimmed.split(ORDERING_RESPONSE_SEPARATOR)
    : trimmed.includes('/')
      ? trimmed.split('/')
      : trimmed.split(',');
  return parts.map((item) => item.trim()).filter(Boolean);
};
const joinOrderingAnswer = (items: string[]) => items.join(ORDERING_RESPONSE_SEPARATOR);
const normalizeQuestionAnswer = (question: InteractiveAssignmentContent['questions'][number], value: string) => {
  if (question.type !== 'ordering') return normalizeInteractiveAnswer(value);
  return splitOrderingAnswer(value).map(normalizeInteractiveAnswer).join(' ');
};
const scoreInteractiveAssignment = (content: InteractiveAssignmentContent | null | undefined, answers: Record<string, string>): InteractiveAssignmentResult => {
  const questions = content?.questions ?? [];
  const score = questions.reduce((sum, question) => sum + (normalizeQuestionAnswer(question, answers[question.id] ?? '') === normalizeQuestionAnswer(question, question.answer) ? 1 : 0), 0);
  return { answers, score, total: questions.length, percentage: questions.length ? Math.round((score / questions.length) * 100) : 0 };
};
const interactiveAttempts = (result: InteractiveAssignmentResult | null | undefined) => result?.attempts?.length ? result.attempts : result ? [{ answers: result.answers, score: result.score, total: result.total, percentage: result.percentage, submittedAt: new Date().toISOString() }] : [];
const interactiveMaxAttempts = (content: InteractiveAssignmentContent | null | undefined) => content?.settings?.maxAttempts ?? 1;
const canAttemptInteractive = (content: InteractiveAssignmentContent | null | undefined, result: InteractiveAssignmentResult | null | undefined) => {
  const maxAttempts = interactiveMaxAttempts(content);
  return maxAttempts === 0 || interactiveAttempts(result).length < maxAttempts;
};
const shouldRevealInteractiveAnswers = (content: InteractiveAssignmentContent | null | undefined, result: InteractiveAssignmentResult | null | undefined) => {
  if (content?.settings?.revealAnswers !== 'after_last') return true;
  return !canAttemptInteractive(content, result);
};
const displayInteractiveAnswer = (question: InteractiveAssignmentContent['questions'][number], value: string) => {
  if (question.type !== 'ordering') return value;
  return splitOrderingAnswer(value).join(' ');
};

function isSchemaCacheMiss(error: { code?: string; message?: string } | null) {
  return error?.code === 'PGRST205' || Boolean(error?.message?.includes('schema cache'));
}

export default function AuthApp() {
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [demo, setDemo] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(() => {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    return query.get('password-recovery') === '1' || hash.get('type') === 'recovery';
  });

  // Check if we're accepting an invitation
  const params = new URLSearchParams(window.location.search);
  const invitationToken = params.get('token');
  const invitationEmail = params.get('email');

  // If accepting invitation, show invitation page
  if (invitationToken && invitationEmail) {
    return (
      <InviteAcceptance
        token={invitationToken}
        email={invitationEmail}
        onSuccess={() => {
          // After successful account creation, redirect to login
          window.location.href = '/';
        }}
        onError={(error) => {
          console.error('Invitation error:', error);
        }}
      />
    );
  }

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    const loadProfile = async () => {
      const { data: { user } } = await client.auth.getUser();
      if (!user) { setProfile(null); setAuthEmail(''); setLoading(false); return; }
      setAuthEmail(user.email ?? '');
      const { data } = await client.from('profiles').select('*').eq('id', user.id).single();
      if (!data) { setProfile(null); setLoading(false); return; }
      const metadata = user.user_metadata ?? {};
      setProfile({
        ...data,
        full_name: data.full_name || metadata.full_name || metadata.name || '',
        email: data.email || user.email || '',
        avatar_url: data.avatar_url || metadata.avatar_url || metadata.picture || '',
        school_name: data.school_name || '',
        onboarding_completed: Boolean(data.onboarding_completed),
      } as Profile);
      setLoading(false);
    };
    loadProfile();
    const { data } = client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      void loadProfile();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (loading) return <div className="auth-loading"><LoaderCircle className="spin" size={30} />Carregando sua conta...</div>;
  if (passwordRecovery) return <UpdatePassword onComplete={async () => {
    await supabase?.auth.signOut();
    window.history.replaceState({}, '', '/');
    setProfile(null);
    setAuthEmail('');
    setPasswordRecovery(false);
  }} />;
  if (demo) return <>
    <App onLogout={() => setDemo(false)} />
  </>;
  if (!profile) return <AuthPage onDemo={() => setDemo(true)} />;
  if (profile.role === 'student' && profile.must_change_password) return <FirstAccessPassword profile={profile} onComplete={() => setProfile({ ...profile, must_change_password: false })} onLogout={() => supabase?.auth.signOut()} />;
  if (profile.role === 'student') return <StudentPortal profile={profile} onLogout={() => supabase?.auth.signOut()} />;
  if (!profile.onboarding_completed) return <TeacherOnboarding profile={profile} authEmail={authEmail} onComplete={setProfile} onLogout={() => supabase?.auth.signOut()} />;
  return <TeacherPortal profile={profile} authEmail={authEmail} onProfileChange={setProfile} onLogout={() => supabase?.auth.signOut()} />;
}


function TeacherOnboarding({ profile, authEmail, onComplete, onLogout }: { profile: Profile; authEmail: string; onComplete: (profile: Profile) => void; onLogout: () => void }) {
  const [name, setName] = useState(profile.full_name || '');
  const [email, setEmail] = useState(profile.email || authEmail);
  const [schoolName, setSchoolName] = useState(profile.school_name || '');
  const [avatar, setAvatar] = useState(profile.avatar_url || '');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const selectAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setMessage('Escolha uma imagem JPG, PNG ou WebP de até 5 MB.');
      return;
    }
    try { setAvatar(await resizeProfileImage(file)); setMessage(''); }
    catch { setMessage('Não foi possível processar a imagem.'); }
    event.target.value = '';
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setMessage('');
    const updates = { full_name: name.trim(), email: email.trim(), school_name: schoolName.trim(), avatar_url: avatar, onboarding_completed: true };
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', profile.id).select('*').single();
    if (error) { setMessage(error.message); setBusy(false); return; }
    onComplete(data as Profile);
  };

  return <main className="teacher-onboarding-page"><section className="teacher-onboarding-card"><div className="onboarding-copy"><p className="eyebrow">PRIMEIRO ACESSO</p><h1>Vamos preparar seu espaço de trabalho</h1><p>Confirme seus dados profissionais. Eles aparecerão no dashboard, nos relatórios e na área de configurações.</p></div><form onSubmit={submit}><div className="onboarding-avatar"><div>{avatar ? <img src={avatar} alt="Avatar do professor" /> : <UserRound size={48} />}</div><label><ImagePlus size={16} />Escolher foto<input type="file" accept="image/*" onChange={selectAvatar} /></label></div><div className="onboarding-fields"><label>Nome completo<input value={name} onChange={(event) => setName(event.target.value)} required autoFocus /></label><label>E-mail profissional<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label className="full-field">Escola, curso ou marca <span>(opcional)</span><input value={schoolName} onChange={(event) => setSchoolName(event.target.value)} placeholder="Ex.: Maylton English Classes" /></label></div>{message && <div className="auth-message">{message}</div>}<button className="student-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <ArrowRight size={17} />}{busy ? 'Salvando...' : 'Entrar no meu dashboard'}</button></form><button className="auth-switch" onClick={onLogout}>Sair da conta</button></section></main>;
}

function resizeProfileImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const crop = Math.min(image.width, image.height);
      const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 320;
      const context = canvas.getContext('2d');
      if (!context) { URL.revokeObjectURL(url); reject(); return; }
      context.drawImage(image, (image.width - crop) / 2, (image.height - crop) / 2, crop, crop, 0, 0, 320, 320);
      URL.revokeObjectURL(url); resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(); };
    image.src = url;
  });
}

function TeacherPortal({ profile, authEmail, onProfileChange, onLogout }: { profile: Profile; authEmail: string; onProfileChange: (profile: Profile) => void; onLogout: () => void }) {
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
    const { data: questionRows, error: questionError } = await supabase.from('question_bank').select('*').order('created_at', { ascending: false });
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

  const createStudentAccount = async ({ name, email, age, level, goal, notes }: StudentCreateInput) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { data, error } = await supabase.functions.invoke('invite-student', { body: { action: 'create-with-password', email, fullName: name, level, goal } });
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
    const lesson = schedule.find((item) => item.id === id);
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
      const { error: uploadError } = await supabase.storage.from('materials').upload(storagePath, material.file, { contentType: 'application/pdf', upsert: false });
      if (uploadError) throw new Error(`Falha no upload: ${uploadError.message}`);
      const { data: signed } = await supabase.storage.from('materials').createSignedUrl(storagePath, 60 * 60);
      resolvedUrl = signed?.signedUrl ?? '';
    }
    const payload = { teacher_id: profile.id, title: material.title, type: material.file ? 'PDF' : material.type, level: material.level, skill: material.skill, url: material.file ? '' : material.url, description: material.description, storage_path: storagePath, file_name: material.file?.name ?? null, file_size: material.file?.size ?? null, mime_type: material.file?.type ?? null, material_source: material.file ? 'upload' : 'link' };
    const { data, error } = await supabase.from('materials').insert(payload).select('*').single();
    if (error) { if (storagePath) await supabase.storage.from('materials').remove([storagePath]); throw new Error(error.message); }
    return { id: data.id, title: data.title, type: data.type, level: data.level, skill: data.skill, url: resolvedUrl, description: data.description ?? '', createdAt: data.created_at.slice(0, 10), assignedStudentIds: [], storagePath: data.storage_path ?? undefined, fileName: data.file_name ?? undefined, fileSize: data.file_size ?? undefined, source: data.material_source ?? 'link' } as Material;
  };

  const deleteMaterial = async (id: string) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const material = materials.find((item) => item.id === id);
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
  const reviewAssignment = async (id: string, feedback: string, grade?: number) => {
    if (!supabase) throw new Error('Supabase não configurado.');
    const { error } = await supabase.from('assignments').update({ feedback, grade: grade ?? null, status: 'reviewed' }).eq('id', id).eq('teacher_id', profile.id);
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
      supabase.from('profiles').update({ full_name: student.name }).eq('id', student.id).eq('teacher_id', profile.id),
      supabase.from('student_records').update({ age: student.age ? Number(student.age) : null, level: student.level, goal: student.goal, notes: student.notes }).eq('student_id', student.id).eq('teacher_id', profile.id),
    ]);
    if (profileError || recordError) throw new Error(profileError?.message ?? recordError?.message ?? 'Não foi possível atualizar o aluno.');
  };

  const deleteStudent = async (studentId: string) => {
    const { error } = await supabase!.from('student_records').delete().eq('student_id', studentId);
    if (error) throw new Error(error.message);
  };

  const resolveRequest = async (request: CancellationRequest, status: 'approved' | 'rejected', response: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('cancellation_requests').update({ status, teacher_response: response, resolved_at: new Date().toISOString() }).eq('id', request.id);
    if (!error && status === 'approved') await supabase.from('lessons').update({ status: 'cancelled' }).eq('id', request.lesson_id);
    await Promise.all([loadRequests(), loadTeacherData()]);
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
      avatar_url: '',
      school_name: '',
      onboarding_completed: true,
    };
    return <StudentPortal profile={previewFallback} onLogout={() => setPreviewStudent(null)} previewMode previewTeacherName={profile.full_name} />;
  }

  return <div className={`authenticated-app ${subscription && !subscriptionActive ? 'subscription-locked' : ''}`}>
    {subscriptionLoading && <div className="subscription-banner"><strong>Carregando seu período de teste…</strong><span>Estamos verificando o status da sua conta.</span></div>}
    {subscriptionError && <div className="subscription-banner subscription-banner-expired"><strong>Período de teste indisponível</strong><span>{subscriptionError}</span></div>}
    {!subscriptionLoading && !subscriptionError && subscription && subscription.plan !== 'owner' && !subscriptionActive && <div className="subscription-banner subscription-banner-expired"><strong>{subscription.status === 'pending_confirmation' ? 'Confirme seu e-mail para iniciar o teste' : 'Período de teste encerrado'}</strong><span>{subscription.status === 'pending_confirmation' ? 'Abra o link enviado ao seu e-mail. O teste gratuito de 30 dias começa após a confirmação.' : 'Seus dados continuam disponíveis, mas novas alterações exigem uma assinatura ativa.'}</span>{subscription.status !== 'pending_confirmation' && <button type="button" onClick={() => alert('A integração de pagamento será adicionada na próxima etapa.')}>Ver planos</button>}</div>}
    {showAccessToast && <div className="access-toast" role="status"><Check size={18} /><div><strong>{subscription?.plan === 'owner' ? 'Acesso permanente' : `Teste gratuito · ${trialDays} dia(s) restante(s)`}</strong><span>{subscription?.plan === 'owner' ? 'Sua conta possui acesso completo ao LangSpot.' : 'Todos os recursos estão liberados durante o período de teste.'}</span></div></div>}
    <App
      authenticatedMode
      accountAccess={accountAccess}
      initialStudents={students}
      initialSchedule={schedule}
      initialMaterials={materials}
      initialAssignments={assignments}
      initialQuestionBank={questionBank}
      initialPayments={payments}
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
      initialSettings={{ teacherName: profile.full_name, email: profile.email || authEmail, schoolName: profile.school_name, avatar: profile.avatar_url }}
      onProfileSettingsChange={async (settings) => {
        if (!supabase) return;
        const updates = { full_name: settings.teacherName, email: settings.email, school_name: settings.schoolName, avatar_url: settings.avatar };
        const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id);
        if (!error) onProfileChange({ ...profile, ...updates });
      }}
    />
    {inviteOpen && <div className="modal-backdrop" onMouseDown={closeStudentInvite}><section className="modal invite-modal" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><h2>Convidar aluno</h2><button className="icon-button" onClick={closeStudentInvite}>×</button></div><form className="form-grid" onSubmit={invite}><label>Nome completo<input name="name" required /></label><label>E-mail<input name="email" type="email" required /></label><label>Nível<select name="level"><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option></select></label><label>Objetivo<input name="goal" placeholder="Conversação, intercâmbio..." /></label>{inviteMessage && <div className="auth-message full-field">{inviteMessage}</div>}<div className="form-actions"><button type="button" className="cancel-button" onClick={closeStudentInvite}>Cancelar</button><button className="primary-button">Enviar convite</button></div></form></section></div>}
    {inviteTeacherOpen && subscription?.plan === 'owner' && <InviteTeacherModal onClose={() => setInviteTeacherOpen(false)} />}
    {manageTeachersOpen && subscription?.plan === 'owner' && <AdminTeachersModal onClose={() => setManageTeachersOpen(false)} />}
    {requestsOpen && <CancellationRequestsModal requests={requests} onClose={() => setRequestsOpen(false)} onResolve={resolveRequest} />}
  </div>;
}

function dbAssignmentToAssignment(row: DbAssignment): Assignment {
  const statusMap = { pending: 'Pendente', submitted: 'Entregue', reviewed: 'Corrigida' } as const;
  return { id: row.id, teacherId: row.teacher_id, studentId: row.student_id, materialId: row.material_id ?? undefined, title: row.title, instructions: row.instructions, dueDate: row.due_date, status: statusMap[row.status], submissionText: row.submission_text || undefined, submittedAt: row.submitted_at || undefined, submissionFileName: row.submission_file_name ?? undefined, submissionFileUrl: row.submission_file_url ?? undefined, feedback: row.feedback || undefined, grade: row.grade ?? undefined, createdAt: row.created_at, assignmentType: row.assignment_type ?? 'regular', interactiveContent: row.interactive_content as InteractiveAssignmentContent | null | undefined, interactiveResult: row.interactive_result as InteractiveAssignmentResult | null | undefined };
}

function dbQuestionBankToQuestion(row: DbQuestionBankItem): QuestionBankItem {
  return { id: row.id, teacherId: row.teacher_id, level: row.level as QuestionBankItem['level'], category: row.category as QuestionBankItem['category'], type: row.question_type, prompt: row.prompt, options: row.options ?? [], answer: row.answer, explanation: row.explanation ?? undefined, createdAt: row.created_at };
}

function normalizeSkills(value: unknown): Record<Skill, number> {
  const defaults: Record<Skill, number> = { Speaking: 50, Listening: 50, Reading: 50, Writing: 50, Grammar: 50, Vocabulary: 50, Pronunciation: 50 };
  if (!value || typeof value !== 'object') return defaults;
  for (const key of Object.keys(defaults) as Skill[]) {
    const score = Number((value as Record<string, unknown>)[key]);
    if (Number.isFinite(score)) defaults[key] = Math.max(0, Math.min(100, score));
  }
  return defaults;
}

function dbLessonToScheduled(lesson: DbLesson): ScheduledLesson {
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

function scheduledToDb(teacherId: string, lesson: ScheduledLessonInput) {
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

function lessonRecordToDb(record: LessonRecordInput) {
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

function FirstAccessPassword({ profile, onComplete, onLogout }: { profile: Profile; onComplete: () => void; onLogout: () => void }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password'));
    if (password !== String(form.get('confirmation'))) { setMessage('As senhas não coincidem.'); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setMessage(error.message); setBusy(false); return; }
    const { error: completionError } = await supabase.rpc('complete_initial_password_change');
    if (completionError) { setMessage(completionError.message); setBusy(false); return; }
    onComplete();
  };
  return <main className="first-access-page"><section className="first-access-card"><div className="first-access-icon"><LockKeyhole size={27} /></div><p className="eyebrow">PRIMEIRO ACESSO</p><h1>Olá, {profile.full_name}!</h1><p>Antes de entrar no portal, escolha uma senha pessoal. A senha temporária deixará de funcionar.</p><form onSubmit={submit}><PasswordField label="Nova senha" name="password" minLength={8} autoComplete="new-password" required /><PasswordField label="Confirmar nova senha" name="confirmation" minLength={8} autoComplete="new-password" required />{message && <div className="auth-message">{message}</div>}<button className="student-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <LockKeyhole size={16} />}{busy ? 'Atualizando...' : 'Definir senha e entrar'}</button></form><button className="auth-switch" onClick={onLogout}>Sair da conta</button></section></main>;
}

function formatNextLessonFromRows(studentId: string, lessons: DbLesson[]) {
  const upcoming = lessons.filter((lesson) => lesson.student_id === studentId && lesson.status === 'scheduled' && new Date(lesson.starts_at) >= new Date()).sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
  if (!upcoming) return '';
  return new Date(upcoming.starts_at).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace('.', '');
}

async function functionErrorMessage(error: { message: string; context?: unknown }) {
  if (error.context instanceof Response) {
    const payload = await error.context.clone().json().catch(() => null);
    return payload?.error ?? error.message;
  }
  return error.message;
}

function PasswordField({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  return <label>{label}<span className="password-input-wrapper"><input {...props} type={visible ? 'text' : 'password'} /><button type="button" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setVisible((current) => !current)}>{visible ? <EyeOff size={15} /> : <Eye size={15} />}</button></span></label>;
}

function UpdatePassword({ onComplete }: { onComplete: () => void | Promise<void> }) {
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') ?? '');
    const confirmation = String(form.get('confirmation') ?? '');

    if (password.length < 8) {
      setMessage('A nova senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmation) {
      setMessage('As senhas não coincidem.');
      return;
    }

    setBusy(true);
    setMessage('');
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setMessage('Este link é inválido ou expirou. Solicite uma nova redefinição de senha.');
      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }

    setSuccess(true);
    setBusy(false);
    setMessage('Senha atualizada com sucesso. Agora você já pode entrar com a nova senha.');
  };

  return <main className="first-access-page"><section className="first-access-card"><div className="first-access-icon"><LockKeyhole size={27} /></div><p className="eyebrow">REDEFINIÇÃO DE SENHA</p><h1>Crie uma nova senha</h1><p>{success ? 'Sua senha foi alterada com segurança.' : 'Digite e confirme uma nova senha para continuar usando o LangSpot.'}</p>{success ? <><div className="auth-message auth-message-success">{message}</div><button className="student-primary" onClick={() => void onComplete()}><ArrowRight size={16} />Voltar para o login</button></> : <form onSubmit={submit}><PasswordField label="Nova senha" name="password" minLength={8} autoComplete="new-password" required autoFocus /><PasswordField label="Confirmar nova senha" name="confirmation" minLength={8} autoComplete="new-password" required />{message && <div className="auth-message">{message}</div>}<button className="student-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <LockKeyhole size={16} />}{busy ? 'Atualizando...' : 'Salvar nova senha'}</button></form>}</section></main>;
}

function AuthPage({ onDemo }: { onDemo: () => void }) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setMessage('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();

    if (mode === 'forgot') {
      const redirectTo = `${window.location.origin}/?password-recovery=1`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      setMessage(error
        ? 'Não foi possível enviar o e-mail agora. Aguarde um momento e tente novamente.'
        : 'Se houver uma conta associada a esse e-mail, enviaremos um link para redefinir a senha.');
      setBusy(false);
      return;
    }

    const password = String(form.get('password') ?? '');
    if (mode === 'register') {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: String(form.get('name')), role: 'teacher' } } });
      setMessage(error ? error.message : 'Cadastro realizado. Verifique seu e-mail para confirmar a conta.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
    }
    setBusy(false);
  };

  const eyebrow = mode === 'login' ? 'BEM-VINDO DE VOLTA' : mode === 'register' ? 'COMECE AGORA' : 'RECUPERAR ACESSO';
  const title = mode === 'login' ? 'Entre na sua conta' : mode === 'register' ? 'Crie sua conta de professor' : 'Esqueceu sua senha?';
  const description = mode === 'login' ? 'Acesse seu espaço de trabalho.' : mode === 'register' ? 'Depois, você poderá convidar seus alunos.' : 'Informe seu e-mail para receber um link de redefinição.';

  return <main className="auth-page"><section className="auth-intro"><div className="auth-brand"><GraduationCap size={28} /><strong>LangSpot</strong></div><div><span>TEACHER WORKSPACE</span><h1>Ensine melhor.<br />Acompanhe de perto.</h1><p>Alunos, aulas, materiais e progresso organizados em um único espaço.</p></div><ul><li><CalendarDays size={18} />Agenda e aulas online</li><li><BookOpen size={18} />Biblioteca de materiais</li><li><GraduationCap size={18} />Portal individual do aluno</li></ul></section><section className="auth-form-wrap"><div className="auth-form-card"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{description}</p>{isSupabaseConfigured ? <form onSubmit={submit}>{mode === 'register' && <label>Nome completo<input name="name" required /></label>}<label>E-mail<input name="email" type="email" autoComplete="email" required autoFocus /></label>{mode !== 'forgot' && <PasswordField label="Senha" name="password" minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />}{mode === 'login' && <button type="button" className="forgot-password-link" onClick={() => changeMode('forgot')}>Esqueci minha senha</button>}{message && <div className="auth-message">{message}</div>}<button disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : mode === 'login' ? <LockKeyhole size={17} /> : mode === 'register' ? <UserPlus size={17} /> : <ArrowRight size={17} />}{busy ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta' : 'Enviar link'}{!busy && mode !== 'forgot' && <ArrowRight size={16} />}</button></form> : <div className="auth-message">Configure as variáveis do Supabase para habilitar login e cadastro.</div>}{mode === 'forgot' ? <button className="auth-switch" onClick={() => changeMode('login')}>Voltar para o login</button> : <button className="auth-switch" onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Ainda não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}</button>}{can.useDemoMode() && mode !== 'forgot' && <button className="demo-button" onClick={onDemo}>Continuar no modo demonstração</button>}</div></section></main>;
}

type StudentTab = 'Visão geral' | 'Aulas' | 'Progresso' | 'Materiais' | 'Tarefas' | 'Quiz' | 'Flashcards' | 'Metas' | 'Conquistas' | 'Diário' | 'Perfil';

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dateKeyDistance(later: string, earlier: string) {
  return Math.round((Date.parse(`${later}T12:00:00Z`) - Date.parse(`${earlier}T12:00:00Z`)) / 86400000);
}

function calculateStreak(activityDates: string[]) {
  const dates = [...new Set(activityDates)].sort();
  let best = dates.length ? 1 : 0;
  let running = dates.length ? 1 : 0;
  for (let index = 1; index < dates.length; index += 1) {
    running = dateKeyDistance(dates[index], dates[index - 1]) === 1 ? running + 1 : 1;
    best = Math.max(best, running);
  }
  const last = dates[dates.length - 1];
  if (!last) return { current: 0, best: 0 };
  const today = localDateKey(new Date());
  if (dateKeyDistance(today, last) > 1) return { current: 0, best };
  let current = 1;
  for (let index = dates.length - 1; index > 0 && dateKeyDistance(dates[index], dates[index - 1]) === 1; index -= 1) current += 1;
  return { current, best };
}

function lastStudyDays(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (count - index - 1));
    return { date: localDateKey(date), label: date.toLocaleDateString('pt-BR', { weekday: 'narrow' }).replace('.', '') };
  });
}

type DailyMission = {
  type: StudyActivity['activity_type'];
  title: string;
  text: string;
  action: StudentTab;
  icon: typeof NotebookPen;
  completed: boolean;
};

function StudentPortal({ profile, onLogout, previewMode = false, previewTeacherName = '' }: { profile: Profile; onLogout: () => void; previewMode?: boolean; previewTeacherName?: string }) {
  const [portalProfile, setPortalProfile] = useState(profile);
  const [tab, setTab] = useState<StudentTab>('Visão geral');
  const [record, setRecord] = useState<StudentRecord | null>(null);
  const [lessons, setLessons] = useState<DbLesson[]>([]);
  const [materials, setMaterials] = useState<DbMaterial[]>([]);
  const [assignments, setAssignments] = useState<DbAssignment[]>([]);
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [journal, setJournal] = useState<LearningJournalEntry[]>([]);
  const [studyActivities, setStudyActivities] = useState<StudyActivity[]>([]);
  const [streakFreezes, setStreakFreezes] = useState<StreakFreeze[]>([]);
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [lessonToCancel, setLessonToCancel] = useState<DbLesson | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => localStorage.getItem(`langspot.studentTheme.${profile.id}`) === 'dark' ? 'dark' : 'light');

  const loadPortal = async () => {
    if (!supabase) return;
    setLoading(true);
    setLoadError('');
    const [profileResult, recordResult, lessonResult, assignmentResult, taskResult, goalResult, journalResult, activityResult, freezeResult, requestResult, userResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profile.id).maybeSingle(),
      supabase.from('student_records').select('*').eq('student_id', profile.id).maybeSingle(),
      supabase.from('lessons').select('*').eq('student_id', profile.id).order('starts_at'),
      supabase.from('material_assignments').select('materials(*)').eq('student_id', profile.id),
      supabase.from('assignments').select('*').eq('student_id', profile.id).order('due_date', { ascending: true }),
      supabase.from('learning_goals').select('*').eq('student_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('learning_journal_entries').select('*').eq('student_id', profile.id).order('created_at', { ascending: false }).limit(30),
      supabase.from('study_activities').select('*').eq('student_id', profile.id).order('activity_date', { ascending: false }),
      supabase.from('streak_freezes').select('*').eq('student_id', profile.id).order('protected_date', { ascending: false }),
      supabase.from('cancellation_requests').select('*').eq('student_id', profile.id).order('created_at', { ascending: false }),
      previewMode ? Promise.resolve({ data: { user: null }, error: null }) : supabase.auth.getUser(),
    ]);
    const errors = [profileResult.error, recordResult.error, lessonResult.error, assignmentResult.error, taskResult.error, goalResult.error, journalResult.error, activityResult.error, requestResult.error, freezeResult.error && !isSchemaCacheMiss(freezeResult.error) ? freezeResult.error : null].filter(Boolean);
    const warnings = errors.map((error) => error?.message).filter(Boolean) as string[];
    if (previewMode && !profileResult.data && !profileResult.error) {
      warnings.unshift('O perfil real do aluno não está acessível para o professor. Aplique a migração de permissões da visualização do aluno no Supabase.');
    }
    if (warnings.length) setLoadError(warnings.join(' · '));
    if (profileResult.data) {
      const realProfile = profileResult.data as Profile;
      setPortalProfile({
        ...realProfile,
        full_name: realProfile.full_name || profile.full_name,
        email: realProfile.email || profile.email,
        avatar_url: realProfile.avatar_url || '',
        school_name: realProfile.school_name || '',
        onboarding_completed: Boolean(realProfile.onboarding_completed),
      });
    } else {
      setPortalProfile(profile);
    }
    setRecord(recordResult.data as StudentRecord | null);
    setLessons((lessonResult.data ?? []) as DbLesson[]);
    const assignedRows = (assignmentResult.data ?? []).flatMap((assignment) => assignment.materials ? [assignment.materials as unknown as DbMaterial] : []);
    const resolvedMaterials = await Promise.all(assignedRows.map(async (material) => {
      if (!material.storage_path) return material;
      const { data: signed } = await supabase!.storage.from('materials').createSignedUrl(material.storage_path, 60 * 60);
      return { ...material, url: signed?.signedUrl ?? '' };
    }));
    setMaterials(resolvedMaterials);
    const resolvedTasks = await Promise.all((taskResult.data ?? []).map(async (assignment) => {
      const row = assignment as DbAssignment;
      if (!row.submission_file_path) return row;
      const { data: signed } = await supabase!.storage.from('assignment-submissions').createSignedUrl(row.submission_file_path, 60 * 60);
      return { ...row, submission_file_url: signed?.signedUrl ?? '' };
    }));
    setAssignments(resolvedTasks as DbAssignment[]);
    setGoals((goalResult.data ?? []) as LearningGoal[]);
    setJournal((journalResult.data ?? []) as LearningJournalEntry[]);
    setStudyActivities((activityResult.data ?? []) as StudyActivity[]);
    setStreakFreezes((freezeResult.data ?? []) as StreakFreeze[]);
    setRequests((requestResult.data ?? []) as CancellationRequest[]);
    setEmail(userResult.data.user?.email ?? (profileResult.data as Profile | null)?.email ?? profile.email ?? '');
    setLoading(false);
  };
  useEffect(() => { setPortalProfile(profile); }, [profile]);
  useEffect(() => { void loadPortal(); }, [profile.id]);
  useEffect(() => {
    localStorage.setItem(`langspot.studentTheme.${profile.id}`, theme);
    document.body.classList.toggle('dark-theme', theme === 'dark');
    return () => document.body.classList.remove('dark-theme');
  }, [profile.id, theme]);

  const upcoming = useMemo(() => lessons.filter((lesson) => lesson.status === 'scheduled' && new Date(lesson.starts_at) > new Date()), [lessons]);
  const history = useMemo(() => lessons.filter((lesson) => lesson.status !== 'scheduled' || new Date(lesson.starts_at) <= new Date()).reverse(), [lessons]);
  const nextLesson = upcoming[0];
  const requestByLesson = (lessonId: string) => requests.find((request) => request.lesson_id === lessonId);
  const navigateStudent = (nextTab: StudentTab) => {
    setTab(nextTab);
    setAccountMenuOpen(false);
  };
  const nav: { label: StudentTab; icon: typeof LayoutDashboard }[] = [
    { label: 'Visão geral', icon: LayoutDashboard },
    { label: 'Aulas', icon: CalendarDays },
    { label: 'Tarefas', icon: ClipboardList },
    { label: 'Quiz', icon: FileQuestion },
    { label: 'Materiais', icon: BookOpen },
    { label: 'Flashcards', icon: Brain },
    { label: 'Metas', icon: Flag },
    { label: 'Conquistas', icon: Award },
    { label: 'Diário', icon: NotebookPen },
    { label: 'Progresso', icon: GraduationCap },
    { label: 'Perfil', icon: UserRound },
  ];

  if (loading) return <div className="auth-loading"><LoaderCircle className="spin" size={30} />Carregando seu portal...</div>;
  return <div className={`student-app ${previewMode ? 'student-preview-mode' : ''}`}>{previewMode && <div className="student-preview-banner"><Eye size={18} /><div><strong>Visualização do aluno: {portalProfile.full_name}</strong><span>Você está vendo o portal em modo somente leitura{previewTeacherName ? ` como ${previewTeacherName}` : ''}.</span></div><button type="button" onClick={onLogout}><ArrowLeft size={16} />Sair da visualização</button></div>}<aside className="student-sidebar"><div className="auth-brand"><GraduationCap size={25} /><strong>LangSpot</strong></div><nav>{nav.map(({ label, icon: Icon }) => <button key={label} className={tab === label ? 'active' : ''} onClick={() => navigateStudent(label)}><Icon size={18} />{label}</button>)}</nav><button className="student-logout" onClick={onLogout}>{previewMode ? <ArrowLeft size={16} /> : <LogOut size={16} />}{previewMode ? 'Voltar ao painel' : 'Sair'}</button></aside><main className="student-main-content"><header className="student-topbar"><div><p className="eyebrow">PORTAL DO ALUNO</p><h1>{tab}</h1></div><div className="student-account-menu"><button type="button" className="student-avatar student-avatar-button" aria-label="Abrir menu do perfil" aria-expanded={accountMenuOpen} onClick={() => setAccountMenuOpen((open) => !open)}>{portalProfile.avatar_url ? <img src={portalProfile.avatar_url} alt={`Avatar de ${portalProfile.full_name}`} /> : initials(portalProfile.full_name)}</button>{accountMenuOpen && <div className="student-account-popover"><div><strong>{portalProfile.full_name}</strong><span>{email || portalProfile.email || 'Aluno'}</span></div><button type="button" onClick={() => navigateStudent('Perfil')}><UserRound size={16} />Meu perfil</button><button type="button" className="student-account-logout" onClick={onLogout}>{previewMode ? <ArrowLeft size={16} /> : <LogOut size={16} />}{previewMode ? 'Voltar ao painel' : 'Sair'}</button></div>}</div></header>{loadError && <div className="student-data-warning"><strong>Algumas informações não puderam ser carregadas.</strong><span>{loadError}</span></div>}{tab === 'Visão geral' ? <StudentOverview profile={portalProfile} record={record} nextLesson={nextLesson} materialCount={materials.length} assignments={assignments} history={history} goals={goals} journal={journal} studyActivities={studyActivities} streakFreezes={streakFreezes} onChanged={loadPortal} onNavigate={navigateStudent} readOnly={previewMode} /> : tab === 'Aulas' ? <StudentLessons upcoming={upcoming} history={history} requestByLesson={requestByLesson} onCancel={previewMode ? () => undefined : setLessonToCancel} /> : tab === 'Progresso' ? <StudentProgress record={record} /> : tab === 'Materiais' ? <StudentMaterials materials={materials} /> : tab === 'Tarefas' ? <StudentAssignments assignments={assignments.filter((assignment) => assignment.assignment_type !== 'interactive')} materials={materials} mode="tasks" onAssignmentsChange={setAssignments} readOnly={previewMode} /> : tab === 'Quiz' ? <StudentAssignments assignments={assignments.filter((assignment) => assignment.assignment_type === 'interactive')} materials={materials} mode="quiz" onAssignmentsChange={setAssignments} readOnly={previewMode} /> : tab === 'Flashcards' ? <StudentFlashcards profile={portalProfile} onActivity={loadPortal} readOnly={previewMode} /> : tab === 'Metas' ? <StudentGoals profile={portalProfile} goals={goals} onGoalsChange={setGoals} onChanged={loadPortal} readOnly={previewMode} /> : tab === 'Conquistas' ? <StudentAchievements studyActivities={studyActivities} streakFreezes={streakFreezes} /> : tab === 'Diário' ? <StudentJournal profile={portalProfile} entries={journal} lessons={lessons} onEntriesChange={setJournal} onChanged={loadPortal} readOnly={previewMode} /> : <StudentProfilePage profile={portalProfile} record={record} email={email} theme={theme} onThemeChange={setTheme} onProfileChange={setPortalProfile} readOnly={previewMode} />}</main>{!previewMode && lessonToCancel && <CancellationModal lesson={lessonToCancel} profile={portalProfile} onClose={() => setLessonToCancel(null)} onSent={async () => { setLessonToCancel(null); await loadPortal(); }} />}</div>;
}

function CancellationRequestsModal({ requests, onClose, onResolve }: { requests: CancellationRequest[]; onClose: () => void; onResolve: (request: CancellationRequest, status: 'approved' | 'rejected', response: string) => void }) {
  const [responses, setResponses] = useState<Record<string, string>>({});
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal request-modal" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow">AGENDA</p><h2>Solicitações de cancelamento</h2></div><button className="icon-button" onClick={onClose}>×</button></div><div className="request-list">{requests.length ? requests.map((request) => <article className="request-card" key={request.id}><div className="request-heading"><div><strong>{request.student?.full_name ?? 'Aluno'}</strong><span>{request.lessons ? `${formatPortalDate(request.lessons.starts_at)} · ${request.lessons.topic}` : 'Aula'}</span></div><StatusBadge status={request.status} /></div><p>{request.reason}</p>{request.status === 'pending' ? <><textarea value={responses[request.id] ?? ''} onChange={(event) => setResponses((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="Resposta opcional para o aluno" /><div className="request-actions"><button className="reject-button" onClick={() => onResolve(request, 'rejected', responses[request.id] ?? '')}><Ban size={15} />Recusar</button><button className="approve-button" onClick={() => onResolve(request, 'approved', responses[request.id] ?? '')}><Check size={15} />Aprovar</button></div></> : request.teacher_response && <small>Resposta: {request.teacher_response}</small>}</article>) : <div className="empty-state small"><Check size={30} /><h3>Nenhuma solicitação</h3><p>Os pedidos dos alunos aparecerão aqui.</p></div>}</div></section></div>;
}

function StudentOverview({ profile, record, nextLesson, materialCount, assignments, history, goals, journal, studyActivities, streakFreezes, onChanged, onNavigate, readOnly = false }: { profile: Profile; record: StudentRecord | null; nextLesson?: DbLesson; materialCount: number; assignments: DbAssignment[]; history: DbLesson[]; goals: LearningGoal[]; journal: LearningJournalEntry[]; studyActivities: StudyActivity[]; streakFreezes: StreakFreeze[]; onChanged: () => Promise<void>; onNavigate: (tab: StudentTab) => void; readOnly?: boolean }) {
  const [streakMessage, setStreakMessage] = useState('');
  const [protecting, setProtecting] = useState(false);
  const regularAssignments = assignments.filter((item) => item.assignment_type !== 'interactive');
  const quizAssignments = assignments.filter((item) => item.assignment_type === 'interactive');
  const pending = regularAssignments.filter((item) => item.status === 'pending');
  const pendingQuizzes = quizAssignments.filter((item) => item.status === 'pending');
  const urgent = [...pending].sort((a, b) => a.due_date.localeCompare(b.due_date))[0];
  const urgentQuiz = [...pendingQuizzes].sort((a, b) => a.due_date.localeCompare(b.due_date))[0];
  const activeGoals = goals.filter((goal) => goal.status === 'active');
  const average = record ? Object.values(record.skills ?? {}).reduce((sum, value) => sum + value, 0) / Math.max(Object.values(record.skills ?? {}).length, 1) : 0;
  const activityDates = studyActivities.map((activity) => activity.activity_date);
  const protectedDates = streakFreezes.map((freeze) => freeze.protected_date);
  const streak = calculateStreak([...activityDates, ...protectedDates]);
  const activeDates = new Set(studyActivities.map((activity) => activity.activity_date));
  const freezeDates = new Set(protectedDates);
  const todayKey = localDateKey(new Date());
  const todayActivityTypes = new Set(studyActivities.filter((activity) => activity.activity_date === todayKey).map((activity) => activity.activity_type));
  const streakWeek = lastStudyDays(7);
  const yesterday = lastStudyDays(2)[0].date;
  const dayBeforeYesterday = lastStudyDays(3)[0].date;
  const monthlyFreezeUsed = protectedDates.some((date) => date.slice(0, 7) === yesterday.slice(0, 7));
  const canProtectYesterday = !readOnly && !monthlyFreezeUsed && !activeDates.has(yesterday) && !freezeDates.has(yesterday) && (activeDates.has(dayBeforeYesterday) || freezeDates.has(dayBeforeYesterday));
  const isToday = (value: string) => localDateKey(new Date(value)) === todayKey;
  const dailyMissionOptions: DailyMission[] = [];
  if (nextLesson && isToday(nextLesson.starts_at)) dailyMissionOptions.push({ type: 'lesson', title: 'Participar da aula', text: nextLesson.topic || 'Entre no encontro agendado de hoje.', action: 'Aulas', icon: CalendarDays, completed: todayActivityTypes.has('lesson') });
  if (pending.length) dailyMissionOptions.push({ type: 'assignment', title: 'Enviar uma tarefa', text: urgent ? `Prioridade: ${urgent.title}` : 'Escolha uma atividade pendente.', action: 'Tarefas', icon: ClipboardList, completed: todayActivityTypes.has('assignment') });
  if (!pending.length && pendingQuizzes.length) dailyMissionOptions.push({ type: 'assignment', title: 'Responder um quiz', text: urgentQuiz ? `Prioridade: ${urgentQuiz.title}` : 'Escolha um quiz pendente.', action: 'Quiz', icon: FileQuestion, completed: todayActivityTypes.has('assignment') });
  dailyMissionOptions.push(
    { type: 'journal', title: 'Registrar o estudo', text: 'Anote o que aprendeu ou uma dúvida para a próxima aula.', action: 'Diário', icon: NotebookPen, completed: todayActivityTypes.has('journal') },
    { type: 'flashcard', title: 'Revisar flashcards', text: 'Faça uma sessão rápida de revisão espaçada.', action: 'Flashcards', icon: Brain, completed: todayActivityTypes.has('flashcard') },
  );
  if (activeGoals.length) dailyMissionOptions.push({ type: 'goal', title: 'Avançar uma meta', text: 'Atualize o progresso de uma meta em andamento.', action: 'Metas', icon: Target, completed: todayActivityTypes.has('goal') });
  const dailyMissions = dailyMissionOptions.slice(0, 4);
  const completedMissions = dailyMissions.filter((mission) => mission.completed).length;
  const missionTarget = Math.min(1, dailyMissions.length);
  const streakActivatedToday = missionTarget > 0 && completedMissions >= missionTarget;
  const useFreeze = async () => {
    if (!supabase || !canProtectYesterday) return;
    setProtecting(true); setStreakMessage('');
    const { error } = await supabase.rpc('use_monthly_streak_freeze');
    if (error) setStreakMessage(error.message);
    else { setStreakMessage('Sequência protegida! Ontem agora conta como um dia preservado.'); await onChanged(); }
    setProtecting(false);
  };
  const timeline = [
    ...history.slice(0, 4).map((lesson) => ({ date: lesson.starts_at, icon: 'lesson', title: `Aula: ${lesson.topic}`, text: lesson.notes || 'Aula registrada no seu histórico.' })),
    ...assignments.filter((item) => item.status !== 'pending').slice(0, 4).map((item) => ({ date: item.submitted_at ?? item.created_at, icon: 'task', title: item.assignment_type === 'interactive' ? `Quiz enviado: ${item.title}` : item.status === 'reviewed' ? `Tarefa corrigida: ${item.title}` : `Tarefa enviada: ${item.title}`, text: item.feedback || (item.status === 'reviewed' ? 'Confira o feedback do professor.' : 'Aguardando correção.') })),
    ...journal.slice(0, 3).map((entry) => ({ date: entry.created_at, icon: 'journal', title: entry.title, text: `${entry.study_minutes} min de estudo${entry.new_words.length ? ` · ${entry.new_words.length} nova(s) palavra(s)` : ''}` })),
    ...goals.filter((goal) => goal.status === 'completed').slice(0, 3).map((goal) => ({ date: goal.updated_at, icon: 'goal', title: `Meta concluída: ${goal.title}`, text: goal.description || 'Mais uma conquista no seu aprendizado.' })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

  return <div className="student-page student-dashboard-page">
    <section className="student-welcome student-welcome-enhanced"><div><span>BEM-VINDO DE VOLTA</span><h1>Olá, {profile.full_name}!</h1><p>{record?.goal ? `Seu objetivo: ${record.goal}.` : 'Continue avançando um passo por vez.'}</p></div><div className="student-level-ring"><strong>{Math.round(average)}%</strong><span>progresso</span></div></section>
    <section className="stats-grid student-dashboard-stats">
      <button className="stat-card next-lesson-stat" onClick={() => onNavigate('Aulas')}><i className="student-stat-icon"><CalendarDays size={20} /></i><span>Próxima aula</span><strong>{nextLesson ? shortPortalDate(nextLesson.starts_at) : '—'}</strong><small>{nextLesson?.topic || 'Nenhuma aula agendada'}</small></button>
      <button className="stat-card" onClick={() => onNavigate('Tarefas')}><i className="student-stat-icon"><ClipboardList size={20} /></i><span>Tarefas pendentes</span><strong>{pending.length}</strong><small>{urgent ? `Próximo prazo: ${new Date(`${urgent.due_date}T12:00:00`).toLocaleDateString('pt-BR')}` : 'Tudo em dia'}</small></button>
      <button className="stat-card" onClick={() => onNavigate('Quiz')}><i className="student-stat-icon"><FileQuestion size={20} /></i><span>Quizzes pendentes</span><strong>{pendingQuizzes.length}</strong><small>{urgentQuiz ? `Próximo prazo: ${new Date(`${urgentQuiz.due_date}T12:00:00`).toLocaleDateString('pt-BR')}` : 'Tudo em dia'}</small></button>
      <button className="stat-card" onClick={() => onNavigate('Materiais')}><i className="student-stat-icon"><BookOpen size={20} /></i><span>Materiais disponíveis</span><strong>{materialCount}</strong><small>{materialCount === 1 ? '1 recurso compartilhado' : `${materialCount} recursos compartilhados`}</small></button>
    </section>
    <section className="student-dashboard-columns"><div className="student-dashboard-main">{nextLesson && <section className="student-panel next-lesson-panel"><div><p className="eyebrow">PRÓXIMO ENCONTRO</p><h2>{nextLesson.topic}</h2><p><Clock3 size={15} />{formatPortalDate(nextLesson.starts_at)} · {nextLesson.duration_minutes} minutos</p></div>{nextLesson.online_url && <a className="student-primary" href={nextLesson.online_url} target="_blank" rel="noreferrer">Entrar na aula <ExternalLink size={15} /></a>}</section>}
      <section className="student-panel student-timeline-panel"><div className="student-section-heading"><div><p className="eyebrow">SUA JORNADA</p><h2>Linha do tempo</h2></div></div>{timeline.length ? <div className="student-learning-timeline">{timeline.map((item, index) => <article key={`${item.date}-${index}`}><span className={`timeline-icon ${item.icon}`}>{item.icon === 'lesson' ? <CalendarDays size={15} /> : item.icon === 'task' ? <Check size={15} /> : item.icon === 'goal' ? <Flag size={15} /> : <NotebookPen size={15} />}</span><div><time>{new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</time><strong>{item.title}</strong><p>{item.text}</p></div></article>)}</div> : <EmptyPortal icon={Sparkles} title="Sua jornada está começando" text="Aulas, tarefas, metas e registros de estudo aparecerão aqui." />}</section></div>
      <aside className="student-dashboard-side"><section className="student-panel student-streak-card"><div className="streak-heading"><span><Flame size={24} /></span><div><p className="eyebrow">SEQUÊNCIA DE ESTUDOS</p><h2>{streak.current} dia(s)</h2></div></div><p>{streakActivatedToday ? 'Missão cumprida hoje. Sua sequência está ativa!' : 'Complete uma missão de hoje para acender sua sequência.'}</p><div className="streak-week">{streakWeek.map((day) => <div className={activeDates.has(day.date) ? 'active' : freezeDates.has(day.date) ? 'protected' : ''} key={day.date}><span>{day.label}</span><i>{freezeDates.has(day.date) ? <Snowflake size={13} /> : <Flame size={13} />}</i></div>)}</div>{canProtectYesterday && <button className="streak-freeze-button" disabled={protecting} onClick={useFreeze}><Snowflake size={14} />{protecting ? 'Protegendo...' : 'Proteger sequência de ontem'}</button>}{streakMessage && <small className="streak-message">{streakMessage}</small>}<footer><span>Recorde pessoal</span><strong>{streak.best} dia(s)</strong></footer></section><section className={`student-panel daily-missions-card ${streakActivatedToday ? 'completed' : ''}`}><div className="student-section-heading"><div><p className="eyebrow">MISSÕES DE HOJE</p><h2>{streakActivatedToday ? 'Streak ativado' : 'Escolha uma missão'}</h2></div><span>{completedMissions}/{dailyMissions.length}</span></div><p>{streakActivatedToday ? 'Boa. O dia já conta para sua sequência.' : 'Conclua pelo menos uma ação real de estudo para ativar o dia.'}</p><div className="daily-mission-progress"><b style={{ width: `${dailyMissions.length ? Math.round((completedMissions / dailyMissions.length) * 100) : 0}%` }} /></div><div className="daily-mission-list">{dailyMissions.map((mission) => { const Icon = mission.icon; return <button key={mission.type} className={mission.completed ? 'done' : ''} onClick={() => onNavigate(mission.action)}><span><Icon size={16} /></span><div><strong>{mission.title}</strong><small>{mission.text}</small></div>{mission.completed ? <Check size={16} /> : <ArrowRight size={15} />}</button>; })}</div></section><section className="student-panel quick-actions"><h2>{readOnly ? 'Explorar portal' : 'Ações rápidas'}</h2><button onClick={() => onNavigate('Diário')}><NotebookPen size={17} /><span><strong>Registrar estudo</strong><small>Anote o que aprendeu hoje</small></span></button><button onClick={() => onNavigate('Quiz')}><FileQuestion size={17} /><span><strong>Responder quizzes</strong><small>Pratique com atividades interativas</small></span></button><button onClick={() => onNavigate('Flashcards')}><Brain size={17} /><span><strong>Revisar flashcards</strong><small>Pratique com repetição espaçada</small></span></button><button onClick={() => onNavigate('Metas')}><Target size={17} /><span><strong>Atualizar metas</strong><small>Acompanhe seu progresso</small></span></button><button onClick={() => onNavigate('Conquistas')}><Award size={17} /><span><strong>Ver conquistas</strong><small>Acompanhe os marcos desbloqueados</small></span></button></section>{activeGoals.length > 0 && <section className="student-panel dashboard-goals-preview"><div className="student-section-heading"><div><p className="eyebrow">EM ANDAMENTO</p><h2>Metas</h2></div><button onClick={() => onNavigate('Metas')}>Ver todas</button></div>{activeGoals.slice(0, 3).map((goal) => <article key={goal.id}><div><strong>{goal.title}</strong><span>{goal.progress}%</span></div><i><b style={{ width: `${goal.progress}%` }} /></i></article>)}</section>}</aside></section>
  </div>;
}

function StudentAchievements({ studyActivities, streakFreezes }: { studyActivities: StudyActivity[]; streakFreezes: StreakFreeze[] }) {
  const streak = calculateStreak([...studyActivities.map((activity) => activity.activity_date), ...streakFreezes.map((freeze) => freeze.protected_date)]);
  const activityCount = (type: StudyActivity['activity_type']) => studyActivities.filter((activity) => activity.activity_type === type).length;
  const uniqueActivityTypes = new Set(studyActivities.map((activity) => activity.activity_type));
  const currentMonthKey = localDateKey(new Date()).slice(0, 7);
  const lessonMonthKeys = studyActivities.filter((activity) => activity.activity_type === 'lesson').map((activity) => activity.activity_date.slice(0, 7));
  const monthKeys = [...new Set([currentMonthKey, ...lessonMonthKeys])].sort().reverse();
  const monthlyAchievements: AchievementDefinition[] = monthKeys.map((monthKey) => {
    const monthDate = new Date(`${monthKey}-02T12:00:00`);
    const title = monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, (letter) => letter.toUpperCase());
    const monthlyLessons = studyActivities.filter((activity) => activity.activity_type === 'lesson' && activity.activity_date.startsWith(monthKey)).length;
    return { id: `month-${monthKey}`, category: 'Mensal', title, description: `Assista pelo menos 4 aulas em ${title}.`, target: 4, current: monthlyLessons, icon: CalendarDays };
  });
  const achievements: AchievementDefinition[] = [
    ...streakMilestones.map((milestone) => ({ id: `streak-${milestone.days}`, category: 'Sequência', title: milestone.title, description: `Alcance ${milestone.days} dias de estudo consistente.`, target: milestone.days, current: streak.best, icon: Flame })),
    { id: 'first-action', category: 'Começo', title: 'Primeira missão', description: 'Complete sua primeira atividade real de estudo.', target: 1, current: studyActivities.length, icon: Sparkles },
    { id: 'journal-1', category: 'Diário', title: 'Primeiro registro', description: 'Escreva sua primeira entrada no diário de aprendizagem.', target: 1, current: activityCount('journal'), icon: NotebookPen },
    { id: 'journal-5', category: 'Diário', title: 'Reflexão constante', description: 'Registre 5 momentos de estudo no diário.', target: 5, current: activityCount('journal'), icon: NotebookPen },
    { id: 'flashcard-10', category: 'Flashcards', title: 'Memória ativa', description: 'Revise 10 cartões nos seus baralhos.', target: 10, current: activityCount('flashcard'), icon: Brain },
    { id: 'assignment-3', category: 'Tarefas', title: 'Entrega em dia', description: 'Envie 3 tarefas para correção.', target: 3, current: activityCount('assignment'), icon: ClipboardList },
    { id: 'goal-3', category: 'Metas', title: 'Meta em movimento', description: 'Avance ou conclua metas em 3 momentos diferentes.', target: 3, current: activityCount('goal'), icon: Target },
    { id: 'lesson-5', category: 'Aulas', title: 'Presença firme', description: 'Participe de 5 aulas concluídas.', target: 5, current: activityCount('lesson'), icon: CalendarDays },
    { id: 'all-rounder', category: 'Exploração', title: 'Estudante completo', description: 'Use diário, flashcards, tarefas, metas e aulas pelo menos uma vez.', target: 5, current: uniqueActivityTypes.size, icon: Award },
  ];
  const allAchievements = [...monthlyAchievements, ...achievements];
  const unlocked = allAchievements.filter((achievement) => achievement.current >= achievement.target).length;
  const next = allAchievements.find((achievement) => achievement.current < achievement.target);
  const progress = next ? Math.min(100, Math.round((next.current / next.target) * 100)) : 100;
  return <div className="student-page student-achievements-page">
    <section className="student-achievements-hero"><div><p className="eyebrow">SUA CONSTÂNCIA</p><h2>Conquistas</h2><p>Marcos desbloqueados por sequência, revisões, diário, tarefas, metas, aulas e meses concluídos.</p></div><span><Award size={27} /><strong>{unlocked}/{allAchievements.length}</strong><small>desbloqueadas</small></span></section>
    <section className="student-achievement-summary"><article><Flame size={20} /><span>Sequência atual</span><strong>{streak.current} dia(s)</strong></article><article><Award size={20} /><span>Conquistas</span><strong>{unlocked}</strong></article><article><Target size={20} /><span>Próximo marco</span><strong>{next ? next.title : 'Todos alcançados'}</strong></article></section>
    {next && <section className="student-panel achievement-next-card"><div><span>PRÓXIMA CONQUISTA</span><h2>{next.title}</h2><p>Faltam {Math.max(0, next.target - next.current)} passo(s) para desbloquear este marco.</p></div><strong>{progress}%</strong><i><b style={{ width: `${progress}%` }} /></i></section>}
    <section className="student-panel"><div className="student-section-heading"><div><p className="eyebrow">MENSAL</p><h2>Conquistas por mês</h2></div></div><div className="achievement-collection">{monthlyAchievements.map((achievement) => { const achieved = achievement.current >= achievement.target; const Icon = achievement.icon; return <article className={achieved ? 'unlocked' : ''} key={achievement.id}><span><Icon size={24} /></span><div><small>{achievement.category.toUpperCase()} · {Math.min(achievement.current, achievement.target)}/{achievement.target}</small><h3>{achievement.title}</h3><p>{achieved ? 'Conquista mensal desbloqueada pelo seu histórico de aulas.' : achievement.description}</p></div>{achieved ? <b><Check size={14} />Desbloqueada</b> : <b>Em andamento</b>}</article>; })}</div></section>
    <section className="student-panel"><div className="student-section-heading"><div><p className="eyebrow">COLEÇÃO</p><h2>Marcos de estudo</h2></div></div><div className="achievement-collection">{achievements.map((achievement) => { const achieved = achievement.current >= achievement.target; const Icon = achievement.icon; return <article className={achieved ? 'unlocked' : ''} key={achievement.id}><span><Icon size={24} /></span><div><small>{achievement.category.toUpperCase()} · {Math.min(achievement.current, achievement.target)}/{achievement.target}</small><h3>{achievement.title}</h3><p>{achieved ? 'Conquista desbloqueada pelo seu progresso real.' : achievement.description}</p></div>{achieved ? <b><Check size={14} />Desbloqueada</b> : <b>Bloqueada</b>}</article>; })}</div></section>
  </div>;
}

function StudentLessons({ upcoming, history, requestByLesson, onCancel }: { upcoming: DbLesson[]; history: DbLesson[]; requestByLesson: (id: string) => CancellationRequest | undefined; onCancel: (lesson: DbLesson) => void }) {
  return <div className="student-page"><section className="student-panel"><div className="student-section-heading"><div><p className="eyebrow">AGENDA</p><h2>Próximas aulas</h2></div></div><div className="portal-lesson-list">{upcoming.length ? upcoming.map((lesson) => { const request = requestByLesson(lesson.id); return <article key={lesson.id}><div className="portal-date"><strong>{new Date(lesson.starts_at).toLocaleDateString('pt-BR', { day: '2-digit' })}</strong><span>{new Date(lesson.starts_at).toLocaleDateString('pt-BR', { month: 'short' })}</span></div><div><h3>{lesson.topic}</h3><p>{formatPortalDate(lesson.starts_at)} · {lesson.duration_minutes} minutos</p>{request && <StatusBadge status={request.status} />}</div><div className="portal-lesson-actions">{lesson.online_url && <a href={lesson.online_url} target="_blank" rel="noreferrer"><ExternalLink size={14} />Entrar</a>}<a href={googleCalendarUrl(lesson)} target="_blank" rel="noreferrer"><CalendarDays size={14} />Calendário</a>{!request && <button onClick={() => onCancel(lesson)}><Ban size={14} />Pedir cancelamento</button>}</div></article>; }) : <EmptyPortal icon={CalendarDays} title="Nenhuma aula agendada" text="Sua próxima aula aparecerá aqui." />}</div></section><section className="student-panel"><div className="student-section-heading"><div><p className="eyebrow">HISTÓRICO</p><h2>Aulas anteriores</h2></div></div><div className="portal-history">{history.length ? history.map((lesson) => <article key={lesson.id}><time>{formatPortalDate(lesson.starts_at)}</time><div><strong>{lesson.topic}</strong><p>{lesson.notes || 'Sem observações registradas.'}</p>{lesson.homework && <small>Tarefa: {lesson.homework}</small>}</div></article>) : <EmptyPortal icon={Clock3} title="Histórico vazio" text="As aulas concluídas aparecerão aqui." />}</div></section></div>;
}

function StudentProgress({ record }: { record: StudentRecord | null }) {
  const entries = Object.entries(record?.skills ?? {});
  const average = entries.length ? Math.round(entries.reduce((sum, [, value]) => sum + value, 0) / entries.length) : 0;
  const strongest = entries.sort((a, b) => b[1] - a[1])[0];
  const attention = [...entries].sort((a, b) => a[1] - b[1])[0];
  return <div className="student-page"><section className="student-progress-hero"><div><p className="eyebrow">SEU DESENVOLVIMENTO</p><h2>{average ? `${average}% de progresso geral` : 'Seu progresso começa aqui'}</h2><p>{record?.goal || 'Seu professor poderá registrar metas e habilidades.'}</p></div><strong>{record?.level ?? '—'}</strong></section><section className="student-progress-grid"><article className="student-panel"><h2>Habilidades</h2>{entries.length ? <div className="portal-skills">{entries.map(([skill, value]) => <div key={skill}><div><strong>{skill}</strong><span>{value}%</span></div><i><b style={{ width: `${value}%` }} /></i></div>)}</div> : <EmptyPortal icon={GraduationCap} title="Sem avaliações ainda" text="As habilidades atualizadas pelo professor aparecerão aqui." />}</article><aside className="student-panel progress-insights"><h2>Destaques</h2><div><span>Habilidade mais forte</span><strong>{strongest?.[0] ?? 'A avaliar'}</strong></div><div><span>Ponto de atenção</span><strong>{attention?.[0] ?? 'A avaliar'}</strong></div><div><span>Observações do professor</span><p>{record?.notes || 'Nenhuma observação registrada.'}</p></div></aside></section></div>;
}

function StudentMaterials({ materials }: { materials: DbMaterial[] }) {
  return <div className="student-page"><section className="student-panel"><div className="student-section-heading"><div><p className="eyebrow">BIBLIOTECA</p><h2>Materiais compartilhados</h2></div><span>{materials.length} item(ns)</span></div>{materials.length ? <div className="portal-material-grid">{materials.map((material) => <article key={material.id}><FileText size={22} /><span>{material.type} · {material.level}</span><h3>{material.title}</h3><p>{material.description || `${material.skill} para seus estudos.`}</p><a href={material.url} target="_blank" rel="noreferrer">Abrir material <ExternalLink size={14} /></a></article>)}</div> : <EmptyPortal icon={BookOpen} title="Nenhum material compartilhado" text="Quando o professor enviar um recurso, ele aparecerá aqui." />}</section></div>;
}

function OrderingAnswer({ question, value, onChange }: { question: InteractiveAssignmentContent['questions'][number]; value: string; onChange: (value: string) => void }) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const items = value ? splitOrderingAnswer(value) : question.options.map((item) => item.trim()).filter(Boolean);
  const moveItem = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    onChange(joinOrderingAnswer(next));
    setDragIndex(null);
  };
  useEffect(() => { if (!value && question.options.length) onChange(joinOrderingAnswer(question.options)); }, [question.id]);
  return <div className="ordering-drag-list">{items.map((item, index) => <button type="button" draggable key={`${item}-${index}`} onDragStart={() => setDragIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveItem(index)} onDragEnd={() => setDragIndex(null)} className={dragIndex === index ? 'dragging' : ''}>{item}</button>)}</div>;
}

function InteractiveAssignmentForm({ assignment, answers, onAnswer, onSubmit, busy }: { assignment: DbAssignment; answers: Record<string, string>; onAnswer: (questionId: string, answer: string) => void; onSubmit: () => void; busy: boolean }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const content = assignment.interactive_content as InteractiveAssignmentContent | null | undefined;
  const questions = content?.questions ?? [];
  const currentQuestion = questions[currentIndex];
  const answeredCount = questions.filter((question) => Boolean(answers[question.id])).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  useEffect(() => { if (currentIndex >= questions.length) setCurrentIndex(Math.max(0, questions.length - 1)); }, [currentIndex, questions.length]);
  const typeHint = (type: string) => type === 'fill_blank' ? 'Digite a palavra ou expressão que completa a frase.' : type === 'ordering' ? 'Arraste os itens para montar a ordem correta.' : 'Escolha uma alternativa.';
  return <div className="task-response-box interactive-task-box"><div className="task-response-header"><div><label>Atividade interativa</label><span>Responda no seu ritmo. Você pode voltar para revisar antes de enviar.</span></div><span className="task-response-count">{answeredCount}/{questions.length}</span></div>{questions.length ? <><div className="interactive-progress"><div><span>Progresso do quiz</span><strong>{progress}%</strong></div><i><b style={{ width: `${progress}%` }} /></i></div><div className="interactive-step-dots">{questions.map((question, index) => <button type="button" key={question.id} className={`${index === currentIndex ? 'active' : ''} ${answers[question.id] ? 'answered' : ''}`} onClick={() => setCurrentIndex(index)} aria-label={`Ir para questão ${index + 1}`}>{index + 1}</button>)}</div>{currentQuestion && <div className="interactive-question-list interactive-question-single"><fieldset key={currentQuestion.id}><span className="interactive-question-position">Questão {currentIndex + 1} de {questions.length}</span><legend>{currentQuestion.prompt}</legend><small className="interactive-question-hint">{typeHint(currentQuestion.type)}</small>{currentQuestion.type === 'ordering' ? <OrderingAnswer question={currentQuestion} value={answers[currentQuestion.id] ?? ''} onChange={(value) => onAnswer(currentQuestion.id, value)} /> : currentQuestion.type === 'fill_blank' ? <input className="interactive-text-answer" value={answers[currentQuestion.id] ?? ''} onChange={(event) => onAnswer(currentQuestion.id, event.target.value)} placeholder="Digite sua resposta" /> : currentQuestion.options.map((option) => <label key={option} className={answers[currentQuestion.id] === option ? 'selected' : ''}><input type="radio" name={`${assignment.id}-${currentQuestion.id}`} checked={answers[currentQuestion.id] === option} onChange={() => onAnswer(currentQuestion.id, option)} />{option}</label>)}</fieldset></div>}</> : <p>Esta atividade ainda não possui questões.</p>}<div className="interactive-navigation"><button type="button" className="cancel-button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}>Anterior</button>{currentIndex < questions.length - 1 ? <button type="button" className="student-primary" onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))}>Próxima <ArrowRight size={15} /></button> : <button className="student-primary" disabled={busy || !allAnswered} onClick={onSubmit}>{busy ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />}{busy ? 'Enviando...' : allAnswered ? 'Enviar quiz' : 'Responda tudo'}</button>}</div><div className="task-submit-row interactive-submit-note"><small>{allAnswered ? 'Tudo respondido. Pode enviar quando quiser.' : `Faltam ${Math.max(0, questions.length - answeredCount)} questão(ões) para liberar o envio.`}</small></div></div>;
}

function InteractiveDetailedFeedback({ assignment, result, revealAnswers }: { assignment: DbAssignment; result: InteractiveAssignmentResult; revealAnswers: boolean }) {
  const content = assignment.interactive_content as InteractiveAssignmentContent | null | undefined;
  if (!content?.questions.length) return null;
  return <div className="interactive-feedback-list"><strong>Correção detalhada</strong>{content.questions.map((question, index) => {
    const userAnswer = result.answers[question.id] ?? '';
    const correct = normalizeQuestionAnswer(question, userAnswer) === normalizeQuestionAnswer(question, question.answer);
    return <article key={question.id} className={correct ? 'correct' : 'incorrect'}><div><span>{correct ? <Check size={14} /> : <X size={14} />}{correct ? 'Correta' : 'Revisar'}</span><h4>{index + 1}. {question.prompt}</h4></div><p><b>Sua resposta:</b> {userAnswer ? displayInteractiveAnswer(question, userAnswer) : 'Sem resposta'}</p>{revealAnswers && !correct && <p><b>Resposta correta:</b> {displayInteractiveAnswer(question, question.answer)}</p>}{revealAnswers && question.explanation && <small>{question.explanation}</small>}{!revealAnswers && !correct && <small>O gabarito será liberado após a última tentativa.</small>}</article>;
  })}</div>;
}

function InteractiveSubmissionReview({ assignment }: { assignment: DbAssignment }) {
  const result = assignment.interactive_result as InteractiveAssignmentResult | null | undefined;
  const content = assignment.interactive_content as InteractiveAssignmentContent | null | undefined;
  const attempts = interactiveAttempts(result);
  const maxAttempts = interactiveMaxAttempts(content);
  const revealAnswers = shouldRevealInteractiveAnswers(content, result);
  return <div className="submission-preview student-submission-review"><div><strong>{assignment.assignment_type === 'interactive' ? 'Resultado da atividade' : 'Sua resposta'}</strong>{assignment.submitted_at && <small>Enviada em {new Date(assignment.submitted_at).toLocaleDateString('pt-BR')}</small>}</div>{result && <><div className="interactive-result-card"><strong>{result.percentage}%</strong><span>{result.score}/{result.total} acertos</span><small>Tentativa {attempts.length}{maxAttempts ? ` de ${maxAttempts}` : ' · ilimitadas'}</small></div>{attempts.length > 1 && <div className="interactive-attempt-list">{attempts.map((attempt, index) => <span key={`${attempt.submittedAt}-${index}`}>Tentativa {index + 1}: <b>{attempt.percentage}%</b></span>)}</div>}<InteractiveDetailedFeedback assignment={assignment} result={result} revealAnswers={revealAnswers} /></>}<p>{assignment.submission_text || 'Nenhuma resposta em texto.'}</p>{assignment.submission_file_url && <a className="submission-file-link" href={assignment.submission_file_url} target="_blank" rel="noreferrer"><FileText size={15} />{assignment.submission_file_name || 'PDF anexado'}<ExternalLink size={13} /></a>}{assignment.status === 'submitted' && <div className="awaiting-review"><Clock3 size={15} />Aguardando correção do professor</div>}{assignment.feedback && <div className="teacher-feedback"><strong>Feedback do professor</strong><p>{assignment.feedback}</p>{assignment.grade !== null && <span>Nota: <b>{assignment.grade}</b>/100</span>}</div>}</div>;
}


function StudentAssignments({ assignments, materials, mode = 'tasks', onAssignmentsChange, readOnly = false }: { assignments: DbAssignment[]; materials: DbMaterial[]; mode?: 'tasks' | 'quiz'; onAssignmentsChange: React.Dispatch<React.SetStateAction<DbAssignment[]>>; readOnly?: boolean }) {
  type TaskFilter = 'all' | 'pending' | 'submitted' | 'reviewed';
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [interactiveAnswers, setInteractiveAnswers] = useState<Record<string, Record<string, string>>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [openAssignmentId, setOpenAssignmentId] = useState<string | null>(null);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isOverdue = (assignment: DbAssignment) => assignment.status === 'pending' && new Date(`${assignment.due_date}T12:00:00`) < today;
  const ordered = [...assignments].sort((a, b) => {
    const priority = (item: DbAssignment) => isOverdue(item) ? 0 : item.status === 'pending' ? 1 : item.status === 'submitted' ? 2 : 3;
    return priority(a) - priority(b) || a.due_date.localeCompare(b.due_date);
  });
  const visible = filter === 'all' ? ordered : ordered.filter((assignment) => assignment.status === filter);
  const counts = {
    pending: assignments.filter((assignment) => assignment.status === 'pending').length,
    submitted: assignments.filter((assignment) => assignment.status === 'submitted').length,
    reviewed: assignments.filter((assignment) => assignment.status === 'reviewed').length,
  };
  const copy = mode === 'quiz'
    ? { eyebrow: 'QUIZ', title: 'Meus quizzes', description: 'Responda atividades interativas, acompanhe suas tentativas e revise a correção.', listTitle: 'Lista de quizzes', open: 'Abrir quiz', empty: 'Nenhum quiz por enquanto', emptyFiltered: 'Nenhum quiz neste filtro', emptyText: 'Os quizzes enviados pelo professor aparecerão aqui.', icon: FileQuestion }
    : { eyebrow: 'ATIVIDADES', title: 'Minhas tarefas', description: 'Organize suas entregas, acesse os materiais e acompanhe o feedback do professor.', listTitle: 'Lista de tarefas', open: 'Abrir tarefa', empty: 'Nenhuma tarefa por enquanto', emptyFiltered: 'Nenhuma tarefa neste filtro', emptyText: 'As atividades enviadas pelo professor aparecerão aqui.', icon: ClipboardList };
  const submittedLabel = mode === 'quiz' ? 'Realizados' : 'Enviadas';
  const reviewedLabel = mode === 'quiz' ? 'Corrigidos' : 'Corrigidas';
  const EmptyIcon = copy.icon;
  const submit = async (assignment: DbAssignment) => {
    const text = (drafts[assignment.id] ?? '').trim();
    const file = files[assignment.id] ?? null;
    if (readOnly) { setMessage('Modo de visualização: o envio de tarefas está desativado.'); return; }
    if (!text && !file) { setMessage('Escreva sua resposta ou anexe um PDF antes de enviar.'); return; }
    if (file && (file.type !== 'application/pdf' || file.size > 10 * 1024 * 1024)) { setMessage('O anexo precisa ser um PDF de até 10 MB.'); return; }
    setSendingId(assignment.id); setMessage('');
    let uploadedPath: string | null = null;
    let signedUrl = '';
    try {
      if (file) {
        const safeName = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-');
        uploadedPath = `${assignment.student_id}/${assignment.id}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase!.storage.from('assignment-submissions').upload(uploadedPath, file, { contentType: 'application/pdf', upsert: false });
        if (uploadError) throw new Error(`Falha no upload: ${uploadError.message}`);
        const { data: signed } = await supabase!.storage.from('assignment-submissions').createSignedUrl(uploadedPath, 60 * 60);
        signedUrl = signed?.signedUrl ?? '';
      }
      const submittedAt = new Date().toISOString();
      const payload = {
        submission_text: text,
        submitted_at: submittedAt,
        status: 'submitted',
        submission_file_path: uploadedPath,
        submission_file_name: file?.name ?? null,
        submission_file_size: file?.size ?? null,
        submission_file_mime_type: file?.type ?? null,
      };
      const { data, error } = await supabase!.from('assignments').update(payload).eq('id', assignment.id).eq('student_id', assignment.student_id).select('*').single();
      if (error) throw new Error(error.message);
      const submitted = { ...(data as DbAssignment), submission_file_url: signedUrl };
      onAssignmentsChange((current) => current.map((item) => item.id === assignment.id ? submitted : item));
      setMessage('Tarefa enviada com sucesso.');
      setDrafts((current) => ({ ...current, [assignment.id]: '' }));
      setFiles((current) => ({ ...current, [assignment.id]: null }));
    } catch (error) {
      if (uploadedPath) await supabase!.storage.from('assignment-submissions').remove([uploadedPath]);
      setMessage((error as Error).message);
    }
    setSendingId(null);
  };
  const submitInteractive = async (assignment: DbAssignment) => {
    if (readOnly) { setMessage('Modo de visualização: o envio de quizzes está desativado.'); return; }
    const content = assignment.interactive_content as InteractiveAssignmentContent | null | undefined;
    const previousResult = assignment.interactive_result as InteractiveAssignmentResult | null | undefined;
    if (!canAttemptInteractive(content, previousResult)) { setMessage('Você já usou todas as tentativas deste quiz.'); return; }
    const answers = interactiveAnswers[assignment.id] ?? {};
    const questions = content?.questions ?? [];
    if (!questions.length) { setMessage('Esta atividade interativa ainda não possui questões.'); return; }
    if (questions.some((question) => !answers[question.id])) { setMessage('Responda todas as questões antes de enviar.'); return; }
    const result = scoreInteractiveAssignment(content, answers);
    setSendingId(assignment.id); setMessage('');
    try {
      const submittedAt = new Date().toISOString();
      const attempt = { ...result, submittedAt };
      const attempts = [...interactiveAttempts(previousResult), attempt];
      const interactiveResult = { ...result, attempts };
      const payload = { submission_text: `Quiz interativo: ${result.score}/${result.total} acertos (${result.percentage}%). Tentativa ${attempts.length}.`, submitted_at: submittedAt, status: 'submitted', interactive_result: interactiveResult };
      const { data, error } = await supabase!.from('assignments').update(payload).eq('id', assignment.id).eq('student_id', assignment.student_id).select('*').single();
      if (error) throw new Error(error.message);
      onAssignmentsChange((current) => current.map((item) => item.id === assignment.id ? data as DbAssignment : item));
      setInteractiveAnswers((current) => ({ ...current, [assignment.id]: {} }));
      setMessage(`Atividade enviada. Resultado: ${result.score}/${result.total} (${result.percentage}%).`);
    } catch (error) {
      setMessage((error as Error).message);
    }
    setSendingId(null);
  };
  const materialFor = (id: string | null) => materials.find((material) => material.id === id);
  const dueLabel = (assignment: DbAssignment) => {
    const date = new Date(`${assignment.due_date}T12:00:00`);
    const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
    if (isOverdue(assignment)) return `Atrasada · ${date.toLocaleDateString('pt-BR')}`;
    if (diff === 0) return 'Entrega hoje';
    if (diff === 1) return 'Entrega amanhã';
    return `Prazo: ${date.toLocaleDateString('pt-BR')}`;
  };
  return <div className="student-page student-tasks-page">
    <section className="student-task-summary">
      <div><p className="eyebrow">{copy.eyebrow}</p><h2>{copy.title}</h2><p>{copy.description}</p></div>
      <div className="student-task-metrics"><article><Clock3 size={19} /><span>Pendentes</span><strong>{counts.pending}</strong></article><article><ClipboardList size={19} /><span>{submittedLabel}</span><strong>{counts.submitted}</strong></article><article><Check size={19} /><span>{reviewedLabel}</span><strong>{counts.reviewed}</strong></article></div>
    </section>
    <section className="student-panel">
      <div className="student-section-heading task-heading"><div><h2>{copy.listTitle}</h2><span>{visible.length} de {assignments.length}</span></div><div className="student-task-filters"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Todas</button><button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>Pendentes</button><button className={filter === 'submitted' ? 'active' : ''} onClick={() => setFilter('submitted')}>{submittedLabel}</button><button className={filter === 'reviewed' ? 'active' : ''} onClick={() => setFilter('reviewed')}>{reviewedLabel}</button></div></div>
      {message && <div className="auth-message">{message}</div>}
      <div className="student-assignment-list">{visible.length ? visible.map((assignment) => {
        const material = materialFor(assignment.material_id);
        const overdue = isOverdue(assignment);
        const isOpen = openAssignmentId === assignment.id;
        const interactiveContent = assignment.interactive_content as InteractiveAssignmentContent | null | undefined;
        const interactiveResult = assignment.interactive_result as InteractiveAssignmentResult | null | undefined;
        const questionCount = interactiveContent?.questions.length ?? 0;
        const canRetryInteractive = assignment.assignment_type === 'interactive' && canAttemptInteractive(interactiveContent, interactiveResult);
        const attempts = interactiveAttempts(interactiveResult);
        const maxAttempts = interactiveMaxAttempts(interactiveContent);
        return <article key={assignment.id} className={`${overdue ? 'overdue' : ''} ${isOpen ? 'open' : ''}`}>
          <div className="student-assignment-heading"><div><div className="task-status-row"><span className={`assignment-status ${assignment.status}`}>{assignment.status === 'pending' ? 'Pendente' : assignment.status === 'submitted' ? 'Entregue' : 'Corrigida'}</span>{assignment.assignment_type === 'interactive' && <span className="task-kind-badge">Quiz{questionCount ? ` · ${questionCount} questão(ões)` : ''}{attempts.length ? ` · ${attempts.length}/${maxAttempts || '∞'} tentativa(s)` : ''}</span>}{overdue && <span className="task-overdue-badge">Atrasada</span>}</div><h3>{assignment.title}</h3><p>{assignment.instructions}</p></div><div className="student-assignment-meta"><strong className={overdue ? 'overdue-text' : ''}>{dueLabel(assignment)}</strong><button type="button" onClick={() => setOpenAssignmentId(isOpen ? null : assignment.id)}>{isOpen ? 'Fechar' : copy.open}</button></div></div>
          {isOpen && <div className="student-assignment-details"><div className="task-instructions"><strong>Instruções</strong><p>{assignment.instructions}</p></div>
          {material && <a className="task-material-link" href={material.url} target="_blank" rel="noreferrer"><FileText size={16} /><span><strong>{material.title}</strong><small>Abrir material de apoio</small></span><ExternalLink size={14} /></a>}
          {assignment.assignment_type === 'interactive' && interactiveResult && <InteractiveSubmissionReview assignment={assignment} />}
          {assignment.assignment_type === 'interactive' && canRetryInteractive && <InteractiveAssignmentForm assignment={assignment} answers={interactiveAnswers[assignment.id] ?? {}} onAnswer={(questionId, answer) => setInteractiveAnswers((current) => ({ ...current, [assignment.id]: { ...(current[assignment.id] ?? {}), [questionId]: answer } }))} onSubmit={() => submitInteractive(assignment)} busy={sendingId === assignment.id} />}
          {assignment.assignment_type !== 'interactive' && (assignment.status === 'pending' ? <div className="task-response-box"><div className="task-response-header"><div><label htmlFor={`assignment-${assignment.id}`}>Sua resposta</label></div><span className="task-response-count">{(drafts[assignment.id] ?? '').length} caracteres</span></div><textarea className="task-response-input" id={`assignment-${assignment.id}`} rows={6} value={drafts[assignment.id] ?? ''} onChange={(event) => setDrafts((current) => ({ ...current, [assignment.id]: event.target.value }))} placeholder="Digite sua resposta ou descreva o que realizou." /><label className="task-pdf-upload"><span>Anexo em PDF <small>(opcional)</small></span><input type="file" accept="application/pdf,.pdf" onChange={(event) => setFiles((current) => ({ ...current, [assignment.id]: event.target.files?.[0] ?? null }))} />{files[assignment.id] && <em>{files[assignment.id]?.name} · {(((files[assignment.id]?.size ?? 0) / 1024 / 1024).toFixed(1))} MB</em>}</label><div className="task-submit-row"><small>Você pode enviar texto, PDF ou os dois.</small><button className="student-primary" disabled={sendingId === assignment.id} onClick={() => submit(assignment)}>{sendingId === assignment.id ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />}{sendingId === assignment.id ? 'Enviando...' : 'Enviar tarefa'}</button></div></div> : <InteractiveSubmissionReview assignment={assignment} />)}</div>}
        </article>;
      }) : <EmptyPortal icon={EmptyIcon} title={assignments.length ? copy.emptyFiltered : copy.empty} text={assignments.length ? 'Escolha outro filtro para visualizar suas atividades.' : copy.emptyText} />}</div>
    </section>
  </div>;
}



function StudentGoals({ profile, goals, onGoalsChange, onChanged, readOnly = false }: { profile: Profile; goals: LearningGoal[]; onGoalsChange: React.Dispatch<React.SetStateAction<LearningGoal[]>>; onChanged: () => Promise<void>; readOnly?: boolean }) {
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const active = goals.filter((goal) => goal.status === 'active');
  const completed = goals.filter((goal) => goal.status === 'completed');

  const createGoal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (readOnly) { setMessage('Modo de visualização: alterações estão desativadas.'); return; }
    if (saving) return;
    if (!supabase || !profile.teacher_id) return;
    setMessage('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaving(true);
    const { data, error } = await supabase.from('learning_goals').insert({
      student_id: profile.id,
      teacher_id: profile.teacher_id,
      title: String(form.get('title') ?? '').trim(),
      description: String(form.get('description') ?? '').trim(),
      category: String(form.get('category') ?? 'Geral'),
      target_date: String(form.get('targetDate') ?? '') || null,
      progress: 0,
      status: 'active',
    }).select('*').single();
    if (error) setMessage(error.message);
    else if (data) {
      const newGoal = data as LearningGoal;
      onGoalsChange((current) => [newGoal, ...current.filter((goal) => goal.id !== newGoal.id)]);
      formElement.reset();
      setCreating(false);
      setMessage('Meta criada com sucesso.');
      await onChanged();
    }
    setSaving(false);
  };

  const updateProgress = async (goal: LearningGoal, progress: number) => {
    if (!supabase) return;
    setBusyId(goal.id);
    const normalized = Math.max(0, Math.min(100, progress));
    const nextGoal = {
      ...goal,
      progress: normalized,
      status: normalized === 100 ? 'completed' as const : 'active' as const,
      updated_at: new Date().toISOString(),
    };
    const previousGoals = goals;
    onGoalsChange((current) => current.map((item) => item.id === goal.id ? nextGoal : item));
    const { error } = await supabase.from('learning_goals').update({
      progress: nextGoal.progress,
      status: nextGoal.status,
      updated_at: nextGoal.updated_at,
    }).eq('id', goal.id).eq('student_id', profile.id);
    if (error) {
      onGoalsChange(previousGoals);
      setMessage(error.message);
    } else {
      setMessage(normalized === 100 ? 'Meta concluída.' : 'Progresso atualizado.');
      await onChanged();
    }
    setBusyId(null);
  };

  const deleteGoal = async (goalId: string) => {
    if (readOnly) { setMessage('Modo de visualização: alterações estão desativadas.'); return; }
    if (!supabase || !window.confirm('Excluir esta meta?')) return;
    const previousGoals = goals;
    onGoalsChange((current) => current.filter((goal) => goal.id !== goalId));
    const { error } = await supabase.from('learning_goals').delete().eq('id', goalId).eq('student_id', profile.id);
    if (error) {
      onGoalsChange(previousGoals);
      setMessage(error.message);
    } else await onChanged();
  };

  return <div className="student-page student-goals-page">
    <section className="student-goals-hero"><div><p className="eyebrow">PLANO DE APRENDIZAGEM</p><h2>Minhas metas</h2><p>Transforme seus objetivos em pequenos passos e acompanhe cada conquista.</p></div><button className="student-primary" onClick={() => readOnly ? setMessage('Modo de visualização: alterações estão desativadas.') : setCreating((value) => !value)}><Plus size={16} />Nova meta</button></section>
    <section className="student-goal-stats"><article><Flag size={20} /><span>Em andamento</span><strong>{active.length}</strong></article><article><Check size={20} /><span>Concluídas</span><strong>{completed.length}</strong></article><article><Target size={20} /><span>Progresso médio</span><strong>{goals.length ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length) : 0}%</strong></article></section>
    {message && <div className="auth-message">{message}</div>}
    {creating && <section className="student-panel"><form className="student-interactive-form" onSubmit={createGoal}><label>Título da meta<input name="title" required placeholder="Ex.: Melhorar minha conversação" /></label><label>Categoria<select name="category" defaultValue="Speaking"><option>Speaking</option><option>Listening</option><option>Reading</option><option>Writing</option><option>Grammar</option><option>Vocabulary</option><option>Geral</option></select></label><label className="full-field">Como você pretende alcançar essa meta?<textarea name="description" rows={3} placeholder="Ex.: Praticar 15 minutos três vezes por semana." /></label><label>Data-alvo <span>(opcional)</span><input name="targetDate" type="date" /></label><div className="form-actions"><button type="button" className="cancel-button" disabled={saving} onClick={() => setCreating(false)}>Cancelar</button><button className="primary-button" disabled={saving}>{saving ? <LoaderCircle className="spin" size={15} /> : <Plus size={15} />}{saving ? 'Criando...' : 'Criar meta'}</button></div></form></section>}
    <section className="student-panel"><div className="student-section-heading"><div><p className="eyebrow">EM ANDAMENTO</p><h2>Objetivos atuais</h2></div></div><div className="student-goal-list">{active.length ? active.map((goal) => <article key={goal.id}><div className="goal-card-heading"><div><span>{goal.category}</span><h3>{goal.title}</h3></div><button className="icon-button danger" onClick={() => deleteGoal(goal.id)}><Trash2 size={15} /></button></div>{goal.description && <p>{goal.description}</p>}<div className="goal-progress-heading"><span>Progresso</span><strong>{goal.progress}%</strong></div><i><b style={{ width: `${goal.progress}%` }} /></i><div className="goal-progress-actions"><button disabled={busyId === goal.id || goal.progress === 0} onClick={() => updateProgress(goal, goal.progress - 10)}>−10%</button><button disabled={busyId === goal.id || goal.progress === 100} onClick={() => updateProgress(goal, goal.progress + 10)}>+10%</button><button className="goal-complete-button" disabled={busyId === goal.id} onClick={() => updateProgress(goal, 100)}><Check size={14} />Concluir</button></div>{goal.target_date && <small><CalendarDays size={13} />Data-alvo: {new Date(`${goal.target_date}T12:00:00`).toLocaleDateString('pt-BR')}</small>}</article>) : <EmptyPortal icon={Flag} title="Nenhuma meta em andamento" text="Crie uma meta pequena e específica para orientar seus estudos." />}</div></section>
    {completed.length > 0 && <section className="student-panel"><div className="student-section-heading"><div><p className="eyebrow">CONQUISTAS</p><h2>Metas concluídas</h2></div></div><div className="completed-goals-list">{completed.map((goal) => <article key={goal.id}><Check size={17} /><div><strong>{goal.title}</strong><small>{goal.category} · concluída em {new Date(goal.updated_at).toLocaleDateString('pt-BR')}</small></div><button onClick={() => updateProgress(goal, 90)}>Reabrir</button></article>)}</div></section>}
  </div>;
}

function StudentJournal({ profile, entries, lessons, onEntriesChange, onChanged, readOnly = false }: { profile: Profile; entries: LearningJournalEntry[]; lessons: DbLesson[]; onEntriesChange: React.Dispatch<React.SetStateAction<LearningJournalEntry[]>>; onChanged: () => Promise<void>; readOnly?: boolean }) {
  const [creating, setCreating] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LearningJournalEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const totalMinutes = entries.reduce((sum, entry) => sum + entry.study_minutes, 0);
  const totalWords = entries.reduce((sum, entry) => sum + entry.new_words.length, 0);
  const moodLabel: Record<LearningJournalEntry['mood'], string> = { great: 'Excelente', good: 'Bem', neutral: 'Normal', hard: 'Difícil' };
  const lessonOptions = [...lessons].sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const lessonLabel = (lesson: DbLesson) => `${new Date(lesson.starts_at).toLocaleDateString('pt-BR')} · ${lesson.topic || 'Aula sem tema'}`;

  const closeForm = () => {
    setCreating(false);
    setEditingEntry(null);
  };

  const openEdit = (entry: LearningJournalEntry) => {
    if (readOnly) { setMessage('Modo de visualização: alterações estão desativadas.'); return; }
    setCreating(false);
    setEditingEntry(entry);
    setMessage('');
  };

  const saveEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (readOnly) { setMessage('Modo de visualização: alterações estão desativadas.'); return; }
    if (saving) return;
    if (!supabase || !profile.teacher_id) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const words = String(form.get('newWords') ?? '').split(',').map((word) => word.trim()).filter(Boolean);
    const payload = {
      lesson_id: String(form.get('lessonId') ?? '') || null,
      title: String(form.get('title') ?? '').trim(),
      content: String(form.get('content') ?? '').trim(),
      mood: String(form.get('mood') ?? 'good') as LearningJournalEntry['mood'],
      study_minutes: Number(form.get('studyMinutes') ?? 0),
      new_words: words,
    };
    setSaving(true);
    const query = editingEntry
      ? supabase.from('learning_journal_entries').update(payload).eq('id', editingEntry.id).eq('student_id', profile.id).select('*').single()
      : supabase.from('learning_journal_entries').insert({ ...payload, student_id: profile.id, teacher_id: profile.teacher_id }).select('*').single();
    const { data, error } = await query;
    if (error) setMessage(error.message);
    else if (data) {
      const savedEntry = data as LearningJournalEntry;
      onEntriesChange((current) => [savedEntry, ...current.filter((entry) => entry.id !== savedEntry.id)].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      formElement.reset();
      closeForm();
      setMessage(editingEntry ? 'Registro atualizado no diário.' : 'Registro adicionado ao seu diário.');
      await onChanged();
    }
    setSaving(false);
  };

  const deleteEntry = async (entryId: string) => {
    if (readOnly) { setMessage('Modo de visualização: alterações estão desativadas.'); return; }
    if (!supabase || !window.confirm('Excluir este registro do diário?')) return;
    const previousEntries = entries;
    onEntriesChange((current) => current.filter((entry) => entry.id !== entryId));
    const { error } = await supabase.from('learning_journal_entries').delete().eq('id', entryId).eq('student_id', profile.id);
    if (error) {
      onEntriesChange(previousEntries);
      setMessage(error.message);
    } else await onChanged();
  };

  return <div className="student-page student-journal-page">
    <section className="student-journal-hero"><div><p className="eyebrow">REFLEXÃO E AUTONOMIA</p><h2>Diário de aprendizagem</h2><p>Registre o que estudou, suas dificuldades, descobertas e dúvidas para a próxima aula.</p></div><button className="student-primary" onClick={() => readOnly ? setMessage('Modo de visualização: alterações estão desativadas.') : (setEditingEntry(null), setCreating((value) => !value))}><NotebookPen size={16} />Novo registro</button></section>
    <section className="student-journal-stats"><article><NotebookPen size={20} /><span>Registros</span><strong>{entries.length}</strong></article><article><Clock3 size={20} /><span>Tempo estudado</span><strong>{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}min</strong></article><article><Sparkles size={20} /><span>Novas palavras</span><strong>{totalWords}</strong></article></section>
    {message && <div className="auth-message">{message}</div>}
    {(creating || editingEntry) && <section className="student-panel"><form className="student-interactive-form journal-form" onSubmit={saveEntry}><label>Título<input name="title" required defaultValue={editingEntry?.title ?? ''} placeholder="Ex.: Revisão de Past Simple" /></label><label>Como foi o estudo?<select name="mood" defaultValue={editingEntry?.mood ?? 'good'}><option value="great">Excelente</option><option value="good">Bem</option><option value="neutral">Normal</option><option value="hard">Difícil</option></select></label><label className="full-field">Aula relacionada <span>(opcional)</span><select name="lessonId" defaultValue={editingEntry?.lesson_id ?? ''}><option value="">Sem aula relacionada</option>{lessonOptions.map((lesson) => <option key={lesson.id} value={lesson.id}>{lessonLabel(lesson)}</option>)}</select></label><label className="full-field">O que você estudou ou aprendeu?<textarea name="content" rows={5} required defaultValue={editingEntry?.content ?? ''} placeholder="Conte o que praticou, o que entendeu e o que ainda ficou difícil." /></label><label>Tempo de estudo (minutos)<input name="studyMinutes" type="number" min="0" max="1440" defaultValue={editingEntry?.study_minutes ?? 20} /></label><label>Novas palavras <span>(separe por vírgulas)</span><input name="newWords" defaultValue={editingEntry?.new_words.join(', ') ?? ''} placeholder="borrow, lend, save" /></label><div className="form-actions full-field"><button type="button" className="cancel-button" disabled={saving} onClick={closeForm}>Cancelar</button><button className="primary-button" disabled={saving}>{saving ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />}{saving ? 'Salvando...' : editingEntry ? 'Salvar alterações' : 'Salvar registro'}</button></div></form></section>}
    <section className="student-panel"><div className="student-section-heading"><div><p className="eyebrow">HISTÓRICO</p><h2>Seus registros</h2></div></div><div className="student-journal-list">{entries.length ? entries.map((entry) => { const linkedLesson = entry.lesson_id ? lessonById.get(entry.lesson_id) : null; return <article key={entry.id}><div className="journal-entry-heading"><div><time>{new Date(entry.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</time><h3>{entry.title}</h3>{linkedLesson && <small className="journal-linked-lesson"><BookOpen size={13} />{lessonLabel(linkedLesson)}</small>}</div><div><span className={`journal-mood ${entry.mood}`}>{moodLabel[entry.mood]}</span><button className="icon-button" title="Editar registro" onClick={() => openEdit(entry)}><Edit3 size={15} /></button><button className="icon-button danger" title="Excluir registro" onClick={() => deleteEntry(entry.id)}><Trash2 size={15} /></button></div></div><p>{entry.content}</p><footer>{entry.study_minutes > 0 && <span><Clock3 size={13} />{entry.study_minutes} min</span>}{entry.new_words.length > 0 && <div className="journal-word-tags">{entry.new_words.map((word) => <span key={word}>{word}</span>)}</div>}</footer></article>; }) : <EmptyPortal icon={NotebookPen} title="Seu diário está vazio" text="Depois de estudar, registre o que aprendeu e as dúvidas que deseja levar à próxima aula." />}</div></section>
  </div>;
}

type FlashcardRating = 'again' | 'hard' | 'good' | 'easy';

function StudentFlashcards({ profile, onActivity, readOnly = false }: { profile: Profile; onActivity: () => Promise<void>; readOnly?: boolean }) {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [reviews, setReviews] = useState<FlashcardReview[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [studyIndex, setStudyIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [creatingDeck, setCreatingDeck] = useState(false);
  const [creatingDeckBusy, setCreatingDeckBusy] = useState(false);
  const [creatingCard, setCreatingCard] = useState(false);
  const [creatingCardBusy, setCreatingCardBusy] = useState(false);
  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId) ?? null;

  const loadFlashcards = async () => {
    if (!supabase) return;
    setLoading(true);
    setMessage('');
    const deckResult = await supabase.from('flashcard_decks').select('*').eq('user_id', profile.id).order('updated_at', { ascending: false });
    const deckRows = (deckResult.data ?? []) as FlashcardDeck[];
    const deckIds = deckRows.map((deck) => deck.id);
    const [cardResult, reviewResult] = await Promise.all([
      deckIds.length ? supabase.from('flashcards').select('*').in('deck_id', deckIds).order('created_at', { ascending: true }) : Promise.resolve({ data: [], error: null }),
      supabase.from('flashcard_reviews').select('*').eq('user_id', profile.id),
    ]);
    if (deckResult.error || cardResult.error || reviewResult.error) {
      setMessage(deckResult.error?.message ?? cardResult.error?.message ?? reviewResult.error?.message ?? 'Não foi possível carregar os flashcards.');
    } else {
      setDecks(deckRows);
      setCards((cardResult.data ?? []) as Flashcard[]);
      setReviews((reviewResult.data ?? []) as FlashcardReview[]);
    }
    setLoading(false);
  };

  useEffect(() => { void loadFlashcards(); }, [profile.id]);

  const reviewByCard = useMemo(() => new Map(reviews.map((review) => [review.card_id, review])), [reviews]);
  const now = Date.now();
  const dueCards = cards.filter((card) => {
    const review = reviewByCard.get(card.id);
    return !review || new Date(review.due_at).getTime() <= now;
  });
  const learnedCount = reviews.filter((review) => review.repetitions > 0).length;
  const deckCards = selectedDeckId ? cards.filter((card) => card.deck_id === selectedDeckId) : [];
  const deckDueCards = selectedDeckId ? dueCards.filter((card) => card.deck_id === selectedDeckId) : dueCards;

  const openDeckCreator = () => {
    if (readOnly) { setMessage('Modo de visualização: alterações estão desativadas.'); return; }
    setMessage('');
    setSelectedDeckId(null);
    setCreatingCard(false);
    setCreatingDeck(true);
  };

  const createDeck = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (readOnly) { setMessage('Modo de visualização: alterações estão desativadas.'); return; }
    if (!supabase) return;
    setMessage('');
    setCreatingDeckBusy(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const { data, error } = await supabase.from('flashcard_decks').insert({
      user_id: profile.id,
      teacher_id: profile.teacher_id,
      title: String(form.get('title') || '').trim(),
      description: String(form.get('description') || '').trim(),
    }).select('*').single();
    if (error || !data) setMessage(error?.message ?? 'Não foi possível criar o baralho.');
    else {
      const createdDeck = data as FlashcardDeck;
      formElement.reset();
      setDecks((current) => [createdDeck, ...current.filter((deck) => deck.id !== createdDeck.id)]);
      setSelectedDeckId(createdDeck.id);
      setCreatingDeck(false);
      setMessage('Baralho criado! Adicione agora o primeiro cartão.');
    }
    setCreatingDeckBusy(false);
  };

  const deleteDeck = async (deckId: string) => {
    if (readOnly) { setMessage('Modo de visualização: alterações estão desativadas.'); return; }
    if (!supabase || !window.confirm('Excluir este baralho e todos os cartões?')) return;
    const { error } = await supabase.from('flashcard_decks').delete().eq('id', deckId);
    if (error) setMessage(error.message);
    else { setSelectedDeckId(null); await loadFlashcards(); }
  };

  const createCard = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (readOnly) { setMessage('Modo de visualização: alterações estão desativadas.'); return; }
    if (!supabase || !selectedDeckId) return;
    setMessage('');
    setCreatingCardBusy(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const { data, error } = await supabase.from('flashcards').insert({
      deck_id: selectedDeckId,
      front: String(form.get('front') || '').trim(),
      back: String(form.get('back') || '').trim(),
      example: String(form.get('example') || '').trim(),
    }).select('*').single();
    if (error || !data) setMessage(error?.message ?? 'Não foi possível salvar o cartão.');
    else {
      const createdCard = data as Flashcard;
      formElement.reset();
      setCards((current) => [...current.filter((card) => card.id !== createdCard.id), createdCard]);
      setMessage('Cartão salvo! Você pode adicionar outro ou começar a estudar.');
    }
    setCreatingCardBusy(false);
  };

  const deleteCard = async (cardId: string) => {
    if (readOnly) { setMessage('Modo de visualização: alterações estão desativadas.'); return; }
    if (!supabase || !window.confirm('Excluir este cartão?')) return;
    const { error } = await supabase.from('flashcards').delete().eq('id', cardId);
    if (error) setMessage(error.message); else await loadFlashcards();
  };

  const beginStudy = (scope: Flashcard[]) => {
    if (!scope.length) { setMessage('Nenhum cartão está programado para revisão agora.'); return; }
    setMessage('');
    setStudyCards([...scope].sort(() => Math.random() - 0.5));
    setStudyIndex(0);
    setShowAnswer(false);
  };

  const rateCard = async (rating: FlashcardRating) => {
    if (readOnly) { setMessage('Modo de visualização: avaliações de estudo estão desativadas.'); return; }
    if (!supabase) return;
    const card = studyCards[studyIndex];
    const previous = reviewByCard.get(card.id);
    const previousInterval = previous?.interval_days ?? 0;
    const previousEase = previous?.ease_factor ?? 2.5;
    const previousRepetitions = previous?.repetitions ?? 0;
    let repetitions = previousRepetitions + 1;
    let intervalDays = 1;
    let easeFactor = previousEase;

    if (rating === 'again') {
      repetitions = 0;
      intervalDays = 1;
      easeFactor = Math.max(1.3, previousEase - 0.2);
    } else if (rating === 'hard') {
      intervalDays = Math.max(1, Math.round(Math.max(1, previousInterval) * 1.2));
      easeFactor = Math.max(1.3, previousEase - 0.15);
    } else if (rating === 'good') {
      intervalDays = previousRepetitions === 0 ? 1 : previousRepetitions === 1 ? 3 : Math.max(4, Math.round(previousInterval * previousEase));
    } else {
      intervalDays = previousRepetitions === 0 ? 4 : Math.max(6, Math.round(Math.max(1, previousInterval) * previousEase * 1.3));
      easeFactor = Math.min(3.2, previousEase + 0.15);
    }

    const reviewedAt = new Date();
    const dueAt = new Date(reviewedAt.getTime() + intervalDays * 86400000);
    const { error } = await supabase.from('flashcard_reviews').upsert({
      card_id: card.id,
      user_id: profile.id,
      due_at: dueAt.toISOString(),
      interval_days: intervalDays,
      ease_factor: easeFactor,
      repetitions,
      last_reviewed_at: reviewedAt.toISOString(),
    }, { onConflict: 'card_id,user_id' });
    if (error) { setMessage(error.message); return; }

    if (studyIndex + 1 >= studyCards.length) {
      setStudyCards([]);
      setStudyIndex(0);
      setShowAnswer(false);
      setMessage(`Sessão concluída! ${studyCards.length} cartão(ões) revisado(s).`);
      await loadFlashcards();
      await onActivity();
    } else {
      setStudyIndex((current) => current + 1);
      setShowAnswer(false);
    }
  };

  if (loading) return <div className="auth-loading compact"><LoaderCircle className="spin" size={26} />Carregando seus flashcards...</div>;

  if (studyCards.length) {
    const card = studyCards[studyIndex];
    return <div className="student-page flashcard-study-page"><section className="student-panel flashcard-study-shell"><div className="flashcard-study-header"><button className="flashcard-back-button" onClick={() => { setStudyCards([]); setShowAnswer(false); }}><ArrowLeft size={16} />Sair da sessão</button><span>{studyIndex + 1} de {studyCards.length}</span></div><div className={`study-card ${showAnswer ? 'flipped' : ''}`} onClick={() => setShowAnswer(true)} role="button" tabIndex={0}><span>{showAnswer ? 'RESPOSTA' : 'PERGUNTA'}</span><h2>{showAnswer ? card.back : card.front}</h2>{showAnswer && card.example && <p>{card.example}</p>}{!showAnswer && <small>Toque no cartão para revelar a resposta</small>}</div>{showAnswer ? <div className="flashcard-ratings"><button className="again" onClick={() => rateCard('again')}>Errei<small>rever amanhã</small></button><button className="hard" onClick={() => rateCard('hard')}>Difícil<small>intervalo curto</small></button><button className="good" onClick={() => rateCard('good')}>Acertei<small>intervalo normal</small></button><button className="easy" onClick={() => rateCard('easy')}>Fácil<small>intervalo maior</small></button></div> : <button className="student-primary reveal-answer" onClick={() => setShowAnswer(true)}><RotateCcw size={16} />Mostrar resposta</button>}</section></div>;
  }

  const mastery = cards.length ? Math.round((learnedCount / cards.length) * 100) : 0;

  return <div className="student-page flashcards-page">
    <section className="student-goals-hero flashcards-goal-hero"><div><p className="eyebrow">REPETIÇÃO ESPAÇADA</p><h2>Meus flashcards</h2><p>Organize o que deseja memorizar e revise cada conteúdo no momento certo.</p></div><div className="flashcards-hero-actions"><button className="cancel-button" onClick={openDeckCreator}><Plus size={16} />Novo baralho</button><button className="student-primary" onClick={() => beginStudy(dueCards)} disabled={!dueCards.length}><Brain size={16} />Estudar agora ({dueCards.length})</button></div></section>
    <section className="student-goal-stats flashcard-stat-grid"><article><Layers3 size={20} /><span>Baralhos</span><strong>{decks.length}</strong></article><article><Clock3 size={20} /><span>Para revisar</span><strong>{dueCards.length}</strong></article><article><Sparkles size={20} /><span>Progresso de estudo</span><strong>{mastery}%</strong></article></section>
    {message && <div className="auth-message">{message}</div>}
    {creatingDeck && !selectedDeck && <section className="student-panel"><form className="student-interactive-form" onSubmit={createDeck}><label>Título do baralho<input name="title" required placeholder="Ex.: Phrasal verbs" /></label><label>Descrição <span>(opcional)</span><input name="description" placeholder="Ex.: Vocabulário da unidade 4" /></label><div className="form-actions full-field"><button type="button" className="cancel-button" disabled={creatingDeckBusy} onClick={() => setCreatingDeck(false)}>Cancelar</button><button className="primary-button" disabled={creatingDeckBusy}>{creatingDeckBusy ? <LoaderCircle className="spin" size={15} /> : <Plus size={15} />}{creatingDeckBusy ? 'Criando...' : 'Criar baralho'}</button></div></form></section>}
    {selectedDeck ? <section className="student-panel flashcard-deck-detail"><div className="student-section-heading"><div><button className="flashcard-back-button" onClick={() => setSelectedDeckId(null)}><ArrowLeft size={15} />Todos os baralhos</button><p className="eyebrow">BARALHO ATUAL</p><h2>{selectedDeck.title}</h2><p>{selectedDeck.description || 'Sem descrição.'}</p></div><div className="flashcard-deck-actions"><button className="cancel-button" onClick={() => beginStudy(deckDueCards)} disabled={!deckDueCards.length}><Brain size={15} />Estudar ({deckDueCards.length})</button><button className="danger-text-button" onClick={() => deleteDeck(selectedDeck.id)}><Trash2 size={15} />Excluir</button></div></div><div className="flashcard-deck-progress"><div><span>Cartões estudados</span><strong>{deckCards.filter((card) => reviewByCard.has(card.id)).length}/{deckCards.length}</strong></div><i><b style={{ width: `${deckCards.length ? (deckCards.filter((card) => reviewByCard.has(card.id)).length / deckCards.length) * 100 : 0}%` }} /></i></div><div className="flashcard-card-toolbar"><span>{deckCards.length} cartão(ões) · {deckDueCards.length} para revisar</span><button className="student-primary" onClick={() => setCreatingCard((value) => !value)}><Plus size={15} />Novo cartão</button></div>{creatingCard && <form className="student-interactive-form flashcard-editor" onSubmit={createCard}><label>Frente do cartão<textarea name="front" rows={3} required placeholder="Ex.: What does 'borrow' mean?" /></label><label>Verso do cartão<textarea name="back" rows={3} required placeholder="Ex.: Pedir algo emprestado" /></label><label className="full-field">Exemplo ou observação <span>(opcional)</span><textarea name="example" rows={2} placeholder="Ex.: Can I borrow your pencil?" /></label><div className="form-actions full-field"><button type="button" className="cancel-button" disabled={creatingCardBusy} onClick={() => setCreatingCard(false)}>Concluir</button><button className="primary-button" disabled={creatingCardBusy}>{creatingCardBusy ? <LoaderCircle className="spin" size={15} /> : <Plus size={15} />}{creatingCardBusy ? 'Salvando...' : 'Salvar cartão'}</button></div></form>}<div className="flashcard-list">{deckCards.length ? deckCards.map((card) => { const review = reviewByCard.get(card.id); return <article key={card.id}><div><span>{review ? `Próxima revisão: ${new Date(review.due_at).toLocaleDateString('pt-BR')}` : 'Novo cartão'}</span><h3>{card.front}</h3><p>{card.back}</p>{card.example && <small>{card.example}</small>}</div><button className="icon-button danger" title="Excluir cartão" onClick={() => deleteCard(card.id)}><Trash2 size={15} /></button></article>; }) : <EmptyPortal icon={Brain} title="Este baralho ainda está vazio" text="Adicione o primeiro cartão para começar seus estudos." />}</div></section> : <section className="student-panel"><div className="student-section-heading"><div><p className="eyebrow">SEUS BARALHOS</p><h2>Conteúdos em estudo</h2></div></div><div className="flashcard-deck-grid goal-inspired-decks">{decks.length ? decks.map((deck) => { const deckItems = cards.filter((card) => card.deck_id === deck.id); const due = dueCards.filter((card) => card.deck_id === deck.id).length; const studied = deckItems.filter((card) => reviewByCard.has(card.id)).length; const progress = deckItems.length ? Math.round((studied / deckItems.length) * 100) : 0; return <article key={deck.id}><button className="flashcard-deck-open" onClick={() => setSelectedDeckId(deck.id)}><div className="goal-card-heading"><div><span>{due ? `${due} PARA REVISAR` : 'EM DIA'}</span><h3>{deck.title}</h3></div><Brain size={20} /></div><p>{deck.description || 'Baralho pessoal'}</p><div className="goal-progress-heading"><span>Cartões estudados</span><strong>{progress}%</strong></div><i><b style={{ width: `${progress}%` }} /></i><small>{deckItems.length} cartão(ões) · {studied} estudado(s)</small></button><div className="flashcard-deck-footer"><button onClick={() => setSelectedDeckId(deck.id)}>Abrir baralho</button><button disabled={!due} onClick={() => beginStudy(dueCards.filter((card) => card.deck_id === deck.id))}><Brain size={14} />Estudar</button></div></article>; }) : <EmptyPortal icon={Brain} title="Crie seu primeiro baralho" text="Organize palavras, expressões, perguntas e respostas para revisar com repetição espaçada." />}</div></section>}
  </div>;
}

function StudentProfilePage({ profile, record, email, theme, onThemeChange, onProfileChange, readOnly = false }: { profile: Profile; record: StudentRecord | null; email: string; theme: 'light' | 'dark'; onThemeChange: (theme: 'light' | 'dark') => void; onProfileChange: (profile: Profile) => void; readOnly?: boolean }) {
  const [message, setMessage] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const [avatar, setAvatar] = useState(profile.avatar_url || '');
  const [savingAvatar, setSavingAvatar] = useState(false);
  const selectAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) { setAvatarMessage('Escolha uma imagem JPG, PNG ou WebP de até 5 MB.'); return; }
    try { setAvatar(await resizeProfileImage(file)); setAvatarMessage('Pré-visualização pronta. Clique em salvar foto.'); }
    catch { setAvatarMessage('Não foi possível processar esta imagem.'); }
    event.target.value = '';
  };
  const saveAvatar = async () => {
    if (readOnly) { setAvatarMessage('Modo de visualização: alterações estão desativadas.'); return; }
    setSavingAvatar(true); setAvatarMessage('');
    const { data, error } = await supabase!.from('profiles').update({ avatar_url: avatar }).eq('id', profile.id).select('*').single();
    if (error) setAvatarMessage(error.message); else { const updated = data as Profile; onProfileChange(updated); setAvatarMessage('Foto de perfil atualizada.'); }
    setSavingAvatar(false);
  };
  const saveStudentDetails = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (readOnly) { setProfileMessage('Modo de visualização: alterações estão desativadas.'); return; }
    if (!supabase || !record) return;
    setSavingProfile(true); setProfileMessage('');
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get('fullName') || '').trim();
    const age = String(form.get('age') || '').trim();
    const goal = String(form.get('goal') || '').trim();
    const [{ data: updatedProfile, error: profileError }, { error: recordError }] = await Promise.all([
      supabase.from('profiles').update({ full_name: fullName }).eq('id', profile.id).select('*').single(),
      supabase.from('student_records').update({ age: age ? Number(age) : null, goal }).eq('student_id', profile.id),
    ]);
    if (profileError || recordError) setProfileMessage(profileError?.message ?? recordError?.message ?? 'Não foi possível salvar o perfil.');
    else { onProfileChange(updatedProfile as Profile); record.age = age ? Number(age) : null; record.goal = goal; setProfileMessage('Perfil atualizado com sucesso.'); }
    setSavingProfile(false);
  };
  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (readOnly) { setMessage('Modo de visualização: alterações estão desativadas.'); return; }
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') ?? '');
    const confirmation = String(form.get('confirmation') ?? '');
    if (password !== confirmation) { setMessage('As senhas não coincidem.'); return; }
    const { error } = await supabase!.auth.updateUser({ password });
    setMessage(error ? error.message : 'Senha atualizada com sucesso.');
    if (!error) event.currentTarget.reset();
  };
  return <div className="student-page student-profile-page">
    {readOnly && <div className="student-readonly-note"><Eye size={16} /><span>Visualização somente leitura. Os dados abaixo são os dados reais do aluno.</span></div>}
    <section className="student-profile-hero"><div className="student-avatar large editable-avatar">{avatar ? <img src={avatar} alt={`Avatar de ${profile.full_name}`} /> : initials(profile.full_name)}</div><div><p className="eyebrow">MEU PERFIL</p><h2>{profile.full_name}</h2><p>{email}</p><span>{record?.level ?? 'Nível não informado'} · {record?.goal || 'Objetivo ainda não definido'}</span></div><UserRound size={66} /></section>
    <div className="student-profile-layout">
      <section className="student-panel student-profile-information"><div className="student-section-heading"><div><p className="eyebrow">INFORMAÇÕES PESSOAIS</p><h2>Seus dados de aprendizagem</h2></div><UserRound size={19} /></div><p className="profile-section-description">Mantenha seus dados atualizados para que o professor acompanhe melhor seus objetivos.</p><form className="student-profile-form" onSubmit={saveStudentDetails}><label>Nome completo<input name="fullName" defaultValue={profile.full_name} required /></label><label>Idade<input name="age" type="number" min="1" max="120" defaultValue={record?.age ?? ''} /></label><label>Nível atual<input value={record?.level ?? 'Não informado'} disabled /></label><label>Objetivo de aprendizagem<input name="goal" defaultValue={record?.goal ?? ''} placeholder="Ex.: conversação, viagem..." /></label>{profileMessage && <div className="auth-message full-field">{profileMessage}</div>}<div className="profile-form-actions full-field"><button className="student-primary" disabled={savingProfile}>{savingProfile ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />}{savingProfile ? 'Salvando...' : 'Salvar perfil'}</button></div></form></section>
      <aside className="student-profile-side">
        <section className="student-panel profile-photo-card"><div className="student-section-heading"><div><p className="eyebrow">APARÊNCIA</p><h2>Foto de perfil</h2></div><ImagePlus size={19} /></div><div className="profile-photo-preview"><div className="student-avatar large editable-avatar">{avatar ? <img src={avatar} alt={`Pré-visualização de ${profile.full_name}`} /> : initials(profile.full_name)}</div><p>JPG, PNG ou WebP de até 5 MB.</p></div><div className="student-avatar-controls"><label><ImagePlus size={15} />Escolher foto<input type="file" accept="image/*" onChange={selectAvatar} /></label>{avatar && <button type="button" onClick={() => { setAvatar(''); setAvatarMessage('Foto removida da pré-visualização. Clique em salvar foto.'); }}><Ban size={14} />Remover</button>}<button type="button" className="student-primary" disabled={savingAvatar || avatar === profile.avatar_url} onClick={saveAvatar}>{savingAvatar ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />}{savingAvatar ? 'Salvando...' : 'Salvar foto'}</button></div>{avatarMessage && <div className="auth-message avatar-message">{avatarMessage}</div>}</section>
        <section className="student-panel student-interface-card"><div className="student-section-heading"><div><p className="eyebrow">INTERFACE</p><h2>Tema do portal</h2></div><Moon size={19} /></div><div className="theme-setting"><strong>Tema</strong><span>A mudança é aplicada imediatamente neste dispositivo.</span><div><button type="button" className={theme === 'light' ? 'active' : ''} onClick={() => onThemeChange('light')}><Sun size={16} />Claro</button><button type="button" className={theme === 'dark' ? 'active' : ''} onClick={() => onThemeChange('dark')}><Moon size={16} />Escuro</button></div></div></section>
        <section className="student-panel password-panel"><div className="student-section-heading"><div><p className="eyebrow">SEGURANÇA</p><h2>Alterar senha</h2></div><LockKeyhole size={19} /></div><p>Use pelo menos 6 caracteres para manter sua conta protegida.</p><form onSubmit={updatePassword}><PasswordField label="Nova senha" name="password" minLength={6} autoComplete="new-password" required /><PasswordField label="Confirmar nova senha" name="confirmation" minLength={6} autoComplete="new-password" required />{message && <div className="auth-message">{message}</div>}<button className="student-primary"><LockKeyhole size={15} />Atualizar senha</button></form></section>
      </aside>
    </div>
  </div>;
}

function CancellationModal({ lesson, profile, onClose, onSent }: { lesson: DbLesson; profile: Profile; onClose: () => void; onSent: () => void }) {
  const [message, setMessage] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const reason = String(new FormData(event.currentTarget).get('reason'));
    const { error } = await supabase!.from('cancellation_requests').insert({ lesson_id: lesson.id, student_id: profile.id, teacher_id: lesson.teacher_id, reason });
    if (error) setMessage(error.message); else onSent();
  };
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal cancel-request-modal" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow">SOLICITAÇÃO</p><h2>Pedir cancelamento</h2></div><button className="icon-button" onClick={onClose}>×</button></div><p className="cancel-lesson-summary"><strong>{lesson.topic}</strong><br />{formatPortalDate(lesson.starts_at)}</p><form className="form-grid" onSubmit={submit}><label className="full-field">Justificativa<textarea name="reason" rows={5} minLength={5} required placeholder="Conte ao professor por que você precisa cancelar esta aula." /></label>{message && <div className="auth-message full-field">{message}</div>}<div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Voltar</button><button className="primary-button">Enviar solicitação</button></div></form></section></div>;
}

function StatusBadge({ status }: { status: CancellationRequest['status'] }) {
  const labels = { pending: 'Aguardando', approved: 'Aprovado', rejected: 'Recusado' };
  return <span className={`request-status ${status}`}>{labels[status]}</span>;
}

function EmptyPortal({ icon: Icon, title, text }: { icon: typeof CalendarDays; title: string; text: string }) {
  return <div className="empty-state small"><Icon size={30} /><h3>{title}</h3><p>{text}</p></div>;
}

function shortPortalDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function formatPortalDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function googleCalendarUrl(lesson: DbLesson) {
  const start = new Date(lesson.starts_at);
  const end = new Date(start.getTime() + lesson.duration_minutes * 60000);
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({ action: 'TEMPLATE', text: lesson.topic, dates: `${stamp(start)}/${stamp(end)}`, details: lesson.online_url ?? '' });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}
