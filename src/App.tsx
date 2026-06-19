import {
  ArrowLeft,
  Award,
  Ban,
  Bell,
  BookOpen,
  CalendarPlus,
  CalendarDays,
  Check,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Copy,
  Download,
  Edit3, Eye,
  ExternalLink,
  FileAudio,
  FileQuestion,
  ClipboardList,
  FileText,
  Flame,
  FolderOpen,
  GraduationCap,
  ImagePlus,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Printer,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  Target,
  Trash2,
  TrendingUp,
  UsersRound,
  UserPlus,
  Video,
  WalletCards,
  CircleDollarSign,
  WifiOff,
  X,
} from 'lucide-react';
import { FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { APP_VERSION, can } from './config/env';
import { supabase } from './supabase';
import { mockStudents, mockSchedule, mockMaterials, mockSettings, resetToMockData, toDateInput, addDays, startOfWeek } from './config/mockData';

type Id = string;
export type Skill = 'Speaking' | 'Listening' | 'Reading' | 'Writing' | 'Grammar' | 'Vocabulary' | 'Pronunciation';
export type AttendanceStatus = 'Presente' | 'Ausente' | 'Remarcada';
export type Lesson = { id: Id; date: string; startTime?: string; duration?: number; topic: string; onlineUrl?: string; notes: string; strengths?: string; improvements?: string; homework: string; attendance?: AttendanceStatus; skillScores?: Partial<Record<Skill, number>> };
export type LessonStatus = 'Agendada' | 'Concluída' | 'Cancelada';
export type ScheduledLesson = { id: Id; studentId: Id; date: string; startTime: string; duration: number; topic: string; onlineUrl?: string; status: LessonStatus; notes: string; strengths?: string; improvements?: string; homework: string; attendance?: AttendanceStatus; skillScores?: Partial<Record<Skill, number>> };
export type ScheduledLessonInput = Pick<ScheduledLesson, 'studentId' | 'date' | 'startTime' | 'duration' | 'topic' | 'onlineUrl'>;
export type LessonRecordInput = { date: string; startTime: string; duration: number; topic: string; onlineUrl?: string; notes: string; strengths: string; improvements: string; homework: string; attendance: AttendanceStatus; skillScores: Record<Skill, number> };
export type MaterialType = 'PDF' | 'Vídeo' | 'Áudio' | 'Link' | 'Atividade';
export type Material = { id: Id; title: string; type: MaterialType; level: string; skill: Skill; url: string; description: string; createdAt: string; assignedStudentIds?: Id[]; storagePath?: string; fileName?: string; fileSize?: number; source?: 'link' | 'upload' };
export type MaterialInput = Omit<Material, 'id' | 'createdAt' | 'assignedStudentIds'> & { file?: File };
export type AssignmentStatus = 'Pendente' | 'Entregue' | 'Corrigida';
export type InteractiveQuestionType = 'multiple_choice' | 'fill_blank' | 'true_false' | 'ordering';
export type InteractiveQuestion = { id: Id; type: InteractiveQuestionType; prompt: string; options: string[]; answer: string; explanation?: string };
export type InteractiveAssignmentSettings = { maxAttempts: number; revealAnswers: 'after_each' | 'after_last' };
export type InteractiveAssignmentContent = { questions: InteractiveQuestion[]; settings?: InteractiveAssignmentSettings };
export type InteractiveAttempt = { answers: Record<Id, string>; score: number; total: number; percentage: number; submittedAt: string };
export type InteractiveAssignmentResult = { answers: Record<Id, string>; score: number; total: number; percentage: number; attempts?: InteractiveAttempt[] };
export type Assignment = { id: Id; teacherId?: Id; studentId: Id; materialId?: Id; title: string; instructions: string; dueDate: string; status: AssignmentStatus; submissionText?: string; submittedAt?: string; submissionFileName?: string; submissionFileUrl?: string; feedback?: string; grade?: number; createdAt: string; assignmentType?: 'regular' | 'interactive'; interactiveContent?: InteractiveAssignmentContent | null; interactiveResult?: InteractiveAssignmentResult | null };
export type AssignmentInput = Pick<Assignment, 'studentId' | 'materialId' | 'title' | 'instructions' | 'dueDate' | 'assignmentType' | 'interactiveContent'>;
export type QuestionBankLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type QuestionBankCategory = 'Grammar';
export type QuestionBankItem = { id: Id; teacherId?: Id; level: QuestionBankLevel; category: QuestionBankCategory; type: InteractiveQuestionType; prompt: string; options: string[]; answer: string; explanation?: string; createdAt: string };
export type QuestionBankInput = Omit<QuestionBankItem, 'id' | 'teacherId' | 'createdAt'>;
export type PaymentStatus = 'Pendente' | 'Pago' | 'Atrasado';
export type Payment = { id: Id; studentId: Id; description: string; amount: number; dueDate: string; status: PaymentStatus; paidAt?: string; createdAt: string };
export type PaymentInput = Pick<Payment, 'studentId' | 'description' | 'amount' | 'dueDate'>;
export type PlatformSettings = { teacherName: string; email: string; schoolName: string; avatar: string; defaultDuration: number; defaultOnlineUrl: string; compactMode: boolean; theme: 'light' | 'dark'; confirmCancellations: boolean };
export type AccountAccessInfo = { label: string; description: string; status: 'permanent' | 'active' | 'inactive' };
export type Student = {
  id: Id;
  name: string;
  email: string;
  age?: string;
  level: string;
  goal: string;
  status: 'Ativo' | 'Pausado';
  progress: number;
  nextClass: string;
  notes: string;
  skills: Record<Skill, number>;
  lessons: Lesson[];
  currentStreak?: number;
  bestStreak?: number;
  achievementCount?: number;
};
export type StudentCreateInput = { name: string; email: string; age?: string; level: string; goal: string; notes: string; status: 'Ativo' | 'Pausado'; firstLessonDate?: string; firstLessonTime?: string; firstLessonDuration?: number; firstLessonTopic?: string; firstLessonOnlineUrl?: string };
type StudentAccountResult = { temporaryPassword: string; studentId?: Id };

type NotificationKind = 'lesson' | 'assignment' | 'quiz' | 'payment' | 'cancellation' | 'mission' | 'system';
export type AppNotification = { id: string; kind: NotificationKind; title: string; description: string; date: string; target: View; urgent?: boolean; readAt?: string | null };
type View = 'Visão geral' | 'Notificações' | 'Alunos' | 'Aulas' | 'Materiais' | 'Tarefas' | 'Quiz' | 'Financeiro' | 'Progresso' | 'Relatórios' | 'Configurações';
type AssignmentFormMode = 'regular' | 'interactive';

const skills: Skill[] = ['Speaking', 'Listening', 'Reading', 'Writing', 'Grammar', 'Vocabulary', 'Pronunciation'];
const questionBankLevels: QuestionBankLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const defaultSkills = (): Record<Skill, number> => ({ Speaking: 50, Listening: 50, Reading: 50, Writing: 50, Grammar: 50, Vocabulary: 50, Pronunciation: 50 });
const interactiveResultSummary = (result?: InteractiveAssignmentResult | null) => result ? `${result.score}/${result.total} acertos (${result.percentage}%)` : '';

// Use mock settings if mock data is enabled, otherwise use empty defaults
const defaultSettings: PlatformSettings = can.useMockData() ? mockSettings : { teacherName: '', email: '', schoolName: '', avatar: '', defaultDuration: 60, defaultOnlineUrl: '', compactMode: false, theme: 'light', confirmCancellations: true };

const navigation: { label: View; icon: typeof LayoutDashboard }[] = [
  { label: 'Visão geral', icon: LayoutDashboard },
  { label: 'Notificações', icon: Bell },
  { label: 'Alunos', icon: UsersRound },
  { label: 'Aulas', icon: CalendarDays },
  { label: 'Materiais', icon: BookOpen },
  { label: 'Tarefas', icon: ClipboardList },
  { label: 'Quiz', icon: FileQuestion },
  { label: 'Financeiro', icon: WalletCards },
  { label: 'Progresso', icon: ChartNoAxesCombined },
  { label: 'Relatórios', icon: FileText },
  { label: 'Configurações', icon: Settings },
];

function App({ onLogout, onInviteStudent, onInviteTeacher, onManageTeachers, onCreateStudentAccount, onOpenCancellationRequests, cancellationRequestCount = 0, initialSettings, onProfileSettingsChange, authenticatedMode = false, accountAccess, initialStudents, initialSchedule, initialMaterials, initialAssignments, initialQuestionBank, initialPayments, initialNotifications, onMarkNotificationRead, onMarkAllNotificationsRead, onCreateScheduledLesson, onUpdateScheduledLesson, onCancelScheduledLesson, onCompleteScheduledLesson, onCreateLessonRecord, onUpdateLessonRecord, onDeleteLessonRecord, onUpdateStudentSkills, onUpdateStudentProfile, onDeleteStudent, onPreviewStudent, onCreateMaterial, onDeleteMaterial, onAssignMaterial, onCreateAssignment, onDeleteAssignment, onReviewAssignment, onCreateQuestionBankItem, onDeleteQuestionBankItem, onCreatePayment, onUpdatePaymentStatus, onDeletePayment }: { onLogout?: () => void; onInviteStudent?: () => void; onInviteTeacher?: () => void; onManageTeachers?: () => void; onCreateStudentAccount?: (data: StudentCreateInput) => Promise<StudentAccountResult>; onOpenCancellationRequests?: () => void; cancellationRequestCount?: number; initialSettings?: Partial<PlatformSettings>; onProfileSettingsChange?: (settings: PlatformSettings) => void | Promise<void>; authenticatedMode?: boolean; accountAccess?: AccountAccessInfo; initialStudents?: Student[]; initialSchedule?: ScheduledLesson[]; onCreateScheduledLesson?: (lesson: ScheduledLessonInput) => Promise<ScheduledLesson>; onUpdateScheduledLesson?: (id: Id, lesson: ScheduledLessonInput) => Promise<ScheduledLesson>; onCancelScheduledLesson?: (id: Id) => Promise<void>; onCompleteScheduledLesson?: (id: Id, record: LessonRecordInput) => Promise<void>; onCreateLessonRecord?: (studentId: Id, record: LessonRecordInput) => Promise<ScheduledLesson>; onUpdateLessonRecord?: (id: Id, record: LessonRecordInput) => Promise<ScheduledLesson>; onDeleteLessonRecord?: (id: Id) => Promise<void>; onUpdateStudentSkills?: (studentId: Id, skills: Record<Skill, number>) => Promise<void>; onUpdateStudentProfile?: (student: Student) => Promise<void>; onDeleteStudent?: (studentId: Id) => Promise<void>; onPreviewStudent?: (student: Student) => void; initialMaterials?: Material[]; onCreateMaterial?: (material: MaterialInput) => Promise<Material>; onDeleteMaterial?: (id: Id) => Promise<void>; onAssignMaterial?: (materialId: Id, studentIds: Id[]) => Promise<void>; initialAssignments?: Assignment[]; initialQuestionBank?: QuestionBankItem[]; onCreateAssignment?: (assignment: AssignmentInput) => Promise<Assignment>; onDeleteAssignment?: (id: Id) => Promise<void>; onReviewAssignment?: (id: Id, feedback: string, grade?: number) => Promise<void>; onCreateQuestionBankItem?: (question: QuestionBankInput) => Promise<QuestionBankItem>; onDeleteQuestionBankItem?: (id: Id) => Promise<void>; initialPayments?: Payment[]; initialNotifications?: AppNotification[]; onMarkNotificationRead?: (id: Id) => Promise<void>; onMarkAllNotificationsRead?: (ids: Id[]) => Promise<void>; onCreatePayment?: (payment: PaymentInput) => Promise<Payment>; onUpdatePaymentStatus?: (id: Id, status: PaymentStatus) => Promise<void>; onDeletePayment?: (id: Id) => Promise<void> }) {
  const [active, setActive] = useState<View>('Visão geral');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [students, setStudents] = useState<Student[]>(() => {
    if (authenticatedMode) return initialStudents ?? [];
    const saved = localStorage.getItem('linguaboard.students');
    return saved ? JSON.parse(saved) : (can.useMockData() ? mockStudents : []);
  });
  const [schedule, setSchedule] = useState<ScheduledLesson[]>(() => {
    if (authenticatedMode) return initialSchedule ?? [];
    const saved = localStorage.getItem('linguaboard.schedule');
    if (!saved) return can.useMockData() ? mockSchedule() : [];

    const parsed = JSON.parse(saved) as ScheduledLesson[];
    const seedIds = new Set(['lesson-101', 'lesson-102', 'lesson-103', 'lesson-104']);
    const isUntouchedDemoSeed = can.useMockData()
      && parsed.length === seedIds.size
      && parsed.every((lesson) => seedIds.has(lesson.id));
    const hasFutureLesson = parsed.some((lesson) =>
      lesson.status === 'Agendada'
      && new Date(`${lesson.date}T${lesson.startTime}`) >= new Date()
    );

    // Refresh only the original demonstration seed when all of its dates have
    // expired. Manually created lessons are preserved.
    return isUntouchedDemoSeed && !hasFutureLesson ? mockSchedule() : parsed;
  });
  const [materials, setMaterials] = useState<Material[]>(() => {
    if (authenticatedMode) return initialMaterials ?? [];
    const saved = localStorage.getItem('linguaboard.materials');
    return saved ? JSON.parse(saved) : (can.useMockData() ? mockMaterials : []);
  });
  const [assignments, setAssignments] = useState<Assignment[]>(() => authenticatedMode ? (initialAssignments ?? []) : []);
  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>(() => authenticatedMode ? (initialQuestionBank ?? []) : []);
  const [payments, setPayments] = useState<Payment[]>(() => authenticatedMode ? (initialPayments ?? []) : []);
  const [settings, setSettings] = useState<PlatformSettings>(() => {
    const saved = localStorage.getItem('linguaboard.settings');
    const stored = saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    const normalized = { ...stored, schoolName: ['LinguaBoard', 'langSpot'].includes(stored.schoolName) ? 'LangSpot' : stored.schoolName };
    return { ...normalized, ...initialSettings };
  });
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<Id | null>(null);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonToEdit, setLessonToEdit] = useState<ScheduledLesson | null>(null);
  const [lessonToComplete, setLessonToComplete] = useState<ScheduledLesson | null>(null);
  const [creatingLessonRecord, setCreatingLessonRecord] = useState(false);
  const [lessonRecordToEdit, setLessonRecordToEdit] = useState<Lesson | null>(null);
  const [lessonRecordToDelete, setLessonRecordToDelete] = useState<Lesson | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  const [materialToAssign, setMaterialToAssign] = useState<Material | null>(null);
  const [temporaryAccess, setTemporaryAccess] = useState<{ name: string; email: string; password: string } | null>(null);
  const [assignmentFormMode, setAssignmentFormMode] = useState<AssignmentFormMode | null>(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);
  const [assignmentToReview, setAssignmentToReview] = useState<Assignment | null>(null);
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('langspot.readNotifications') ?? '[]'); }
    catch { return []; }
  });

  useEffect(() => { if (!authenticatedMode) localStorage.setItem('linguaboard.students', JSON.stringify(students)); }, [students, authenticatedMode]);
  useEffect(() => { if (!authenticatedMode) localStorage.setItem('linguaboard.schedule', JSON.stringify(schedule)); }, [schedule, authenticatedMode]);
  useEffect(() => { if (authenticatedMode && initialStudents) setStudents(initialStudents); }, [authenticatedMode, initialStudents]);
  useEffect(() => { if (authenticatedMode && initialSchedule) setSchedule(initialSchedule); }, [authenticatedMode, initialSchedule]);
  useEffect(() => { if (!authenticatedMode) localStorage.setItem('linguaboard.materials', JSON.stringify(materials)); }, [materials, authenticatedMode]);
  useEffect(() => { if (authenticatedMode && initialMaterials) setMaterials(initialMaterials); }, [authenticatedMode, initialMaterials]);
  useEffect(() => { if (authenticatedMode && initialAssignments) setAssignments(initialAssignments); }, [authenticatedMode, initialAssignments]);
  useEffect(() => { if (authenticatedMode && initialQuestionBank) setQuestionBank(initialQuestionBank); }, [authenticatedMode, initialQuestionBank]);
  useEffect(() => { if (authenticatedMode && initialPayments) setPayments(initialPayments); }, [authenticatedMode, initialPayments]);
  useEffect(() => localStorage.setItem('langspot.readNotifications', JSON.stringify(readNotificationIds)), [readNotificationIds]);
  useEffect(() => localStorage.setItem('linguaboard.settings', JSON.stringify(settings)), [settings]);
  useEffect(() => { if (initialSettings) setSettings((current) => ({ ...current, ...initialSettings })); }, [initialSettings]);
  useEffect(() => { document.body.classList.toggle('compact-mode', settings.compactMode); }, [settings.compactMode]);
  useEffect(() => { document.body.classList.toggle('dark-theme', settings.theme === 'dark'); }, [settings.theme]);

  const selected = students.find((student) => student.id === selectedId) ?? null;
  const filteredStudents = useMemo(() => students.filter((student) => `${student.name} ${student.level} ${student.goal}`.toLowerCase().includes(query.toLowerCase())), [students, query]);
  const averageProgress = students.length ? Math.round(students.reduce((sum, student) => sum + student.progress, 0) / students.length) : 0;
  const automaticNotifications = useMemo<AppNotification[]>(() => {
    const now = new Date();
    const endOfTomorrow = new Date(now);
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 2);
    endOfTomorrow.setHours(0, 0, 0, 0);
    const studentName = (id: Id) => students.find((student) => student.id === id)?.name ?? 'Aluno';
    const items: AppNotification[] = [];

    schedule.forEach((lesson) => {
      if (lesson.status !== 'Agendada') return;
      const startsAt = new Date(`${lesson.date}T${lesson.startTime}:00`);
      if (startsAt < now || startsAt >= endOfTomorrow) return;
      const isToday = startsAt.toDateString() === now.toDateString();
      items.push({
        id: `lesson-${lesson.id}-${lesson.date}-${lesson.startTime}`,
        kind: 'lesson',
        title: isToday ? 'Aula hoje' : 'Aula amanhã',
        description: `${studentName(lesson.studentId)} · ${lesson.startTime} · ${lesson.topic || 'Aula sem tema'}`,
        date: startsAt.toISOString(),
        target: 'Aulas',
        urgent: isToday,
      });
    });

    assignments.forEach((assignment) => {
      const due = new Date(`${assignment.dueDate}T23:59:59`);
      const assignmentTarget = assignment.assignmentType === 'interactive' ? 'Quiz' : 'Tarefas';
      const reviewTitle = assignment.assignmentType === 'interactive' ? 'Quiz aguardando correção' : 'Tarefa aguardando correção';
      const overdueTitle = assignment.assignmentType === 'interactive' ? 'Quiz atrasado' : 'Tarefa atrasada';
      const kind = assignment.assignmentType === 'interactive' ? 'quiz' : 'assignment';
      if (assignment.status === 'Entregue') {
        items.push({ id: `assignment-review-${assignment.id}`, kind, title: reviewTitle, description: `${studentName(assignment.studentId)} entregou “${assignment.title}”.`, date: assignment.submittedAt ?? assignment.createdAt, target: assignmentTarget, urgent: true });
      } else if (assignment.status === 'Pendente' && due < now) {
        items.push({ id: `assignment-overdue-${assignment.id}`, kind, title: overdueTitle, description: `${studentName(assignment.studentId)} ainda não entregou “${assignment.title}”.`, date: due.toISOString(), target: assignmentTarget, urgent: true });
      }
    });

    payments.forEach((payment) => {
      const due = new Date(`${payment.dueDate}T23:59:59`);
      if (payment.status !== 'Pago' && due < now) {
        items.push({ id: `payment-${payment.id}`, kind: 'payment', title: 'Cobrança atrasada', description: `${studentName(payment.studentId)} · ${payment.description} · ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}`, date: due.toISOString(), target: 'Financeiro', urgent: true });
      }
    });

    if (cancellationRequestCount > 0) items.push({ id: `cancellations-${cancellationRequestCount}`, kind: 'cancellation', title: 'Solicitações de cancelamento', description: `${cancellationRequestCount} solicitação(ões) aguardando sua análise.`, date: now.toISOString(), target: 'Aulas', urgent: true });
    return items.sort((a, b) => Number(Boolean(b.urgent)) - Number(Boolean(a.urgent)) || new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [students, schedule, assignments, payments, cancellationRequestCount]);
  const notifications = useMemo(() => initialNotifications ?? automaticNotifications, [initialNotifications, automaticNotifications]);
  const notificationReadIds = useMemo(() => {
    if (initialNotifications) return initialNotifications.filter((item) => item.readAt).map((item) => item.id);
    return readNotificationIds;
  }, [initialNotifications, readNotificationIds]);
  const unreadNotificationCount = notifications.filter((item) => !notificationReadIds.includes(item.id)).length;

  const addStudent = async (data: StudentCreateInput) => {
    const account = onCreateStudentAccount ? await onCreateStudentAccount(data) : null;
    const studentId = account?.studentId ?? crypto.randomUUID();
    let createdLesson: ScheduledLesson | null = null;
    if (data.firstLessonDate && data.firstLessonTime && data.firstLessonTopic) {
      const lessonInput = { studentId, date: data.firstLessonDate, startTime: data.firstLessonTime, duration: data.firstLessonDuration ?? settings.defaultDuration, topic: data.firstLessonTopic, onlineUrl: data.firstLessonOnlineUrl || settings.defaultOnlineUrl };
      createdLesson = onCreateScheduledLesson ? await onCreateScheduledLesson(lessonInput) : { ...lessonInput, id: crypto.randomUUID(), status: 'Agendada', notes: '', homework: '' };
      setSchedule((current) => [...current, createdLesson!]);
    }
    const student: Student = { id: studentId, name: data.name, email: data.email, age: data.age, level: data.level, goal: data.goal, status: data.status, nextClass: createdLesson ? formatNextLesson(createdLesson) : '', notes: data.notes, progress: 50, skills: defaultSkills(), lessons: [] };
    setStudents((current) => [student, ...current]);
    setShowStudentForm(false);
    setActive('Alunos');
    setSelectedId(student.id);
    if (account) setTemporaryAccess({ name: data.name, email: data.email, password: account.temporaryPassword });
  };

  const saveStudentProfile = async (student: Student) => {
    await onUpdateStudentProfile?.(student);
    setStudents((current) => current.map((item) => item.id === student.id ? student : item));
    setStudentToEdit(null);
  };

  const addLesson = (lesson: Omit<Lesson, 'id'>) => {
    if (!selected) return;
    setStudents((current) => current.map((student) => student.id === selected.id ? { ...student, lessons: [{ ...lesson, id: crypto.randomUUID() }, ...student.lessons] } : student));
    setShowLessonForm(false);
  };

  const updateSkill = (skill: Skill, value: number) => {
    if (!selected) return;
    setStudents((current) => current.map((student) => {
      if (student.id !== selected.id) return student;
      const updatedSkills = { ...student.skills, [skill]: value };
      const progress = Math.round(Object.values(updatedSkills).reduce((sum, score) => sum + score, 0) / skills.length);
      void onUpdateStudentSkills?.(student.id, updatedSkills);
      return { ...student, skills: updatedSkills, progress };
    }));
  };

  const saveScheduledLesson = async (data: ScheduledLessonInput) => {
    const created = onCreateScheduledLesson ? await onCreateScheduledLesson(data) : { ...data, id: crypto.randomUUID(), status: 'Agendada' as const, notes: '', homework: '' };
    setSchedule((current) => [created, ...current]);
    setLessonToEdit(null);
  };

  const editScheduledLesson = async (data: ScheduledLessonInput) => {
    if (!lessonToEdit) return;
    const updated = onUpdateScheduledLesson ? await onUpdateScheduledLesson(lessonToEdit.id, data) : { ...lessonToEdit, ...data };
    setSchedule((current) => current.map((lesson) => lesson.id === lessonToEdit.id ? updated : lesson));
    setLessonToEdit(null);
  };

  const cancelScheduledLesson = async (id: Id) => {
    if (settings.confirmCancellations && !window.confirm('Cancelar esta aula?')) return;
    try {
      await onCancelScheduledLesson?.(id);
      setSchedule((current) => current.map((lesson) => lesson.id === id ? { ...lesson, status: 'Cancelada' } : lesson));
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Erro desconhecido.';
      window.alert(`Não foi possível cancelar a aula. ${detail}`);
    }
  };

  const completeScheduledLesson = async (record: LessonRecordInput) => {
    if (!lessonToComplete) return;
    await onCompleteScheduledLesson?.(lessonToComplete.id, record);
    const completed = { ...lessonToComplete, ...record, status: 'Concluída' as const };
    setSchedule((current) => current.map((lesson) => lesson.id === lessonToComplete.id ? completed : lesson));
    setStudents((current) => current.map((student) => student.id === lessonToComplete.studentId ? { ...student, lessons: [scheduledToHistory(completed), ...student.lessons.filter((lesson) => lesson.id !== completed.id)], skills: record.skillScores, progress: averageSkillScore(record.skillScores) } : student));
    setLessonToComplete(null);
  };

  const updateLessonRecord = async (record: LessonRecordInput) => {
    if (!selected || !lessonRecordToEdit) return;
    const fallback: ScheduledLesson = { id: lessonRecordToEdit.id, studentId: selected.id, status: 'Concluída', ...record };
    const updated = onUpdateLessonRecord ? await onUpdateLessonRecord(lessonRecordToEdit.id, record) : fallback;
    const history = scheduledToHistory(updated);
    setSchedule((current) => current.map((lesson) => lesson.id === updated.id ? updated : lesson));
    setStudents((current) => current.map((student) => student.id === selected.id ? { ...student, lessons: student.lessons.map((lesson) => lesson.id === history.id ? history : lesson), skills: record.skillScores, progress: averageSkillScore(record.skillScores) } : student));
    setLessonRecordToEdit(null);
  };

  const createLessonRecord = async (record: LessonRecordInput) => {
    if (!selected) return;
    const fallback: ScheduledLesson = { id: crypto.randomUUID(), studentId: selected.id, status: 'Concluída', ...record };
    const created = onCreateLessonRecord ? await onCreateLessonRecord(selected.id, record) : fallback;
    const history = scheduledToHistory(created);
    setSchedule((current) => [created, ...current]);
    setStudents((current) => current.map((student) => student.id === selected.id ? { ...student, lessons: [history, ...student.lessons], skills: record.skillScores, progress: averageSkillScore(record.skillScores) } : student));
    setCreatingLessonRecord(false);
  };

  const deleteLessonRecord = async () => {
    if (!selected || !lessonRecordToDelete) return;
    if (!window.confirm('Excluir este registro de aula? Esta ação não pode ser desfeita.')) return;
    await onDeleteLessonRecord?.(lessonRecordToDelete.id);
    setSchedule((current) => current.filter((lesson) => lesson.id !== lessonRecordToDelete.id));
    setStudents((current) => current.map((student) => student.id === selected.id ? { ...student, lessons: student.lessons.filter((lesson) => lesson.id !== lessonRecordToDelete.id) } : student));
    setLessonRecordToDelete(null);
  };

  const deleteStudent = async () => {
    if (!studentToDelete) return;
    await onDeleteStudent?.(studentToDelete.id);
    setStudents((current) => current.filter((student) => student.id !== studentToDelete.id));
    setSchedule((current) => current.filter((lesson) => lesson.studentId !== studentToDelete.id));
    setSelectedId(null);
    setStudentToDelete(null);
    setActive('Alunos');
  };

  const addMaterial = async (data: MaterialInput) => {
    try {
      const material = onCreateMaterial ? await onCreateMaterial(data) : { ...data, url: data.file ? URL.createObjectURL(data.file) : data.url, fileName: data.file?.name, fileSize: data.file?.size, source: data.file ? ('upload' as const) : ('link' as const), id: crypto.randomUUID(), createdAt: toDateInput(new Date()), assignedStudentIds: [] };
      setMaterials((current) => [material, ...current]);
      setShowMaterialForm(false);
    } catch (error) { window.alert(`Não foi possível salvar o material. ${error instanceof Error ? error.message : ''}`); }
  };

  const deleteMaterial = async () => {
    if (!materialToDelete) return;
    try { await onDeleteMaterial?.(materialToDelete.id); setMaterials((current) => current.filter((material) => material.id !== materialToDelete.id)); setMaterialToDelete(null); }
    catch (error) { window.alert(`Não foi possível excluir o material. ${error instanceof Error ? error.message : ''}`); }
  };

  const assignMaterial = async (studentIds: Id[]) => {
    if (!materialToAssign) return;
    try { await onAssignMaterial?.(materialToAssign.id, studentIds); setMaterials((current) => current.map((m) => m.id === materialToAssign.id ? { ...m, assignedStudentIds: studentIds } : m)); setMaterialToAssign(null); }
    catch (error) { window.alert(`Não foi possível compartilhar o material. ${error instanceof Error ? error.message : ''}`); }
  };

  const newLessonDraft = (): ScheduledLesson => ({ id: '', studentId: students[0]?.id ?? '', date: toDateInput(new Date()), startTime: '14:00', duration: settings.defaultDuration, topic: '', onlineUrl: settings.defaultOnlineUrl, status: 'Agendada', notes: '', homework: '' });

  const exportData = () => {
    const data = JSON.stringify({ exportedAt: new Date().toISOString(), students, schedule, materials, settings }, null, 2);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    link.download = `langspot-backup-${toDateInput(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const resetData = () => {
    if (!can.resetData()) {
      console.warn('Data reset is not allowed in this environment');
      return;
    }
    const mockData = resetToMockData();
    setStudents(mockData.students);
    setSchedule(mockData.schedule);
    setMaterials(mockData.materials);
    setSettings(mockData.settings);
    setSelectedId(null);
    setActive('Visão geral');
  };

  const addAssignment = async (input: AssignmentInput) => {
    try {
      const created = onCreateAssignment ? await onCreateAssignment(input) : { ...input, id: crypto.randomUUID(), status: 'Pendente' as AssignmentStatus, createdAt: new Date().toISOString() };
      setAssignments((current) => [created, ...current]); setAssignmentFormMode(null);
    } catch (error) { window.alert(error instanceof Error ? error.message : 'Não foi possível criar a tarefa.'); }
  };
  const deleteAssignment = async () => { if (!assignmentToDelete) return; try { await onDeleteAssignment?.(assignmentToDelete.id); setAssignments((current) => current.filter((item) => item.id !== assignmentToDelete.id)); setAssignmentToDelete(null); } catch (error) { window.alert(error instanceof Error ? error.message : 'Não foi possível excluir a tarefa.'); } };
  const reviewAssignment = async (feedback: string, grade?: number) => { if (!assignmentToReview) return; try { await onReviewAssignment?.(assignmentToReview.id, feedback, grade); setAssignments((current) => current.map((item) => item.id === assignmentToReview.id ? { ...item, feedback, grade, status: 'Corrigida' } : item)); setAssignmentToReview(null); } catch (error) { window.alert(error instanceof Error ? error.message : 'Não foi possível salvar o feedback.'); } };
  const addQuestionBankItem = async (input: QuestionBankInput) => { try { const created = onCreateQuestionBankItem ? await onCreateQuestionBankItem(input) : { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() }; setQuestionBank((current) => [created, ...current]); } catch (error) { window.alert(error instanceof Error ? error.message : 'Não foi possível salvar a questão.'); } };
  const deleteQuestionBankItem = async (id: Id) => { if (!window.confirm('Excluir esta questão do banco?')) return; try { await onDeleteQuestionBankItem?.(id); setQuestionBank((current) => current.filter((item) => item.id !== id)); } catch (error) { window.alert(error instanceof Error ? error.message : 'Não foi possível excluir a questão.'); } };

  const createPayment = async (input: PaymentInput) => { try { const payment = onCreatePayment ? await onCreatePayment(input) : { ...input, id: crypto.randomUUID(), status: 'Pendente' as const, createdAt: new Date().toISOString() }; setPayments((current) => [payment, ...current]); setShowPaymentForm(false); } catch (error) { window.alert(error instanceof Error ? error.message : 'Não foi possível criar a cobrança.'); } };
  const updatePaymentStatus = async (id: Id, status: PaymentStatus) => { try { await onUpdatePaymentStatus?.(id, status); setPayments((current) => current.map((item) => item.id === id ? { ...item, status, paidAt: status === 'Pago' ? new Date().toISOString() : undefined } : item)); } catch (error) { window.alert(error instanceof Error ? error.message : 'Não foi possível atualizar o pagamento.'); } };
  const deletePayment = async (id: Id) => { if (!window.confirm('Excluir esta cobrança?')) return; try { await onDeletePayment?.(id); setPayments((current) => current.filter((item) => item.id !== id)); } catch (error) { window.alert(error instanceof Error ? error.message : 'Não foi possível excluir a cobrança.'); } };

  const saveSettings = (next: PlatformSettings) => { setSettings(next); void onProfileSettingsChange?.(next); };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileMenuOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', closeOnEscape); };
  }, [mobileMenuOpen]);

  const markNotificationRead = (id: string) => {
    setReadNotificationIds((current) => current.includes(id) ? current : [...current, id]);
    void onMarkNotificationRead?.(id);
  };
  const markAllNotificationsRead = () => {
    const ids = notifications.map((item) => item.id);
    setReadNotificationIds((current) => Array.from(new Set([...current, ...ids])));
    void onMarkAllNotificationsRead?.(ids);
  };
  const openNotification = (notification: AppNotification) => { markNotificationRead(notification.id); setActive(notification.target); setSelectedId(null); setMobileMenuOpen(false); setMobileMoreOpen(false); setAccountMenuOpen(false); };
  const navigateTo = (label: View) => { setActive(label); setSelectedId(null); setMobileMenuOpen(false); setMobileMoreOpen(false); setAccountMenuOpen(false); };

  const topbarPrimaryAction = !selected ? (
    active === 'Visão geral'
      ? { label: 'Nova aula', run: () => setLessonToEdit(newLessonDraft()) }
      : active === 'Alunos'
        ? { label: 'Novo aluno', run: () => setShowStudentForm(true) }
        : active === 'Materiais'
          ? { label: 'Novo material', run: () => setShowMaterialForm(true) }
          : null
  ) : null;

  const pageTitle = selected ? selected.name : active;
  const teacherPrimaryNavigation = navigation.filter((item) => ['Visão geral', 'Alunos', 'Aulas', 'Quiz'].includes(item.label));
  const teacherMoreNavigation = navigation.filter((item) => !teacherPrimaryNavigation.some((primary) => primary.label === item.label));
  const teacherMoreActive = !selected && teacherMoreNavigation.some((item) => item.label === active);

  return (
    <div className="app-shell">
      {mobileMenuOpen && <button className="sidebar-backdrop" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)} />}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="brand"><div className="brand-mark"><GraduationCap size={24} /></div><div><strong>LangSpot</strong><span>Teacher Workspace</span></div><button className="mobile-menu-close" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)}><X size={20} /></button></div>
        <nav className="desktop-nav">{navigation.map(({ label, icon: Icon }) => <button key={label} className={active === label && !selected ? 'nav-item active' : 'nav-item'} onClick={() => navigateTo(label)}><Icon size={19} /><span>{label}</span>{label === 'Notificações' && unreadNotificationCount > 0 && <b className="nav-badge">{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</b>}</button>)}</nav>
        <nav className="mobile-bottom-nav">{teacherPrimaryNavigation.map(({ label, icon: Icon }) => <button key={label} className={active === label && !selected ? 'nav-item active' : 'nav-item'} onClick={() => navigateTo(label)}><Icon size={19} /><span>{label}</span></button>)}<button type="button" className={teacherMoreActive || mobileMoreOpen ? 'nav-item active mobile-more-button' : 'nav-item mobile-more-button'} onClick={() => setMobileMoreOpen((open) => !open)}><MoreHorizontal size={19} /><span>Mais</span>{teacherMoreNavigation.some((item) => item.label === 'Notificações') && unreadNotificationCount > 0 && <b className="nav-badge">{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</b>}</button>{mobileMoreOpen && <div className="mobile-more-menu">{teacherMoreNavigation.map(({ label, icon: Icon }) => <button key={label} type="button" className={active === label && !selected ? 'active' : ''} onClick={() => navigateTo(label)}><Icon size={17} /><span>{label}</span>{label === 'Notificações' && unreadNotificationCount > 0 && <b className="nav-badge">{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</b>}</button>)}</div>}</nav>
        <div className="sidebar-footer"><button className={active === 'Configurações' ? 'nav-item active' : 'nav-item'} onClick={() => navigateTo('Configurações')}><Settings size={19} /><span>Configurações</span></button>{onLogout && <button className="compact-logout-button" onClick={onLogout} title="Sair da conta" aria-label="Sair da conta"><LogOut size={19} /><span>Sair</span></button>}<div className="profile-card">{settings.avatar ? <img className="teacher-avatar" src={settings.avatar} alt={`Avatar de ${settings.teacherName}`} /> : <CircleUserRound size={34} />}<div><strong>{settings.teacherName}</strong><span>Professor</span></div>{onLogout && <button onClick={onLogout} title="Sair da conta" aria-label="Sair da conta"><LogOut size={16} /></button>}</div></div>
      </aside>

      <main>
        <header className="topbar">
          <button className="mobile-menu-button" aria-label="Abrir menu" onClick={() => setMobileMenuOpen(true)}><Menu size={21} /></button>
          <div className="topbar-title">{selected && <button className="back-button" onClick={() => setSelectedId(null)}><ArrowLeft size={16} /> Voltar para alunos</button>}<p className="eyebrow">PAINEL DO PROFESSOR</p><h1>{pageTitle}</h1></div>
          {active !== 'Configurações' && <div className="topbar-actions"><button className="notification-button" aria-label="Abrir notificações" title="Notificações" onClick={() => navigateTo('Notificações')}><Bell size={19} />{unreadNotificationCount > 0 && <span>{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</span>}</button>{onOpenCancellationRequests && active === 'Aulas' && !selected && <button className="invite-button" onClick={onOpenCancellationRequests}><Bell size={17} />Solicitações{cancellationRequestCount > 0 ? ` (${cancellationRequestCount})` : ''}</button>}{active === 'Alunos' && !selected && <button className="invite-button" onClick={onInviteStudent ?? (() => setShowStudentForm(true))}><UsersRound size={17} />Convidar aluno</button>}{active !== 'Notificações' && topbarPrimaryAction && <button className="primary-button" onClick={topbarPrimaryAction.run}><Plus size={18} />{topbarPrimaryAction.label}</button>}</div>}
          <div className="teacher-account-menu"><button type="button" className="teacher-account-avatar" aria-label="Abrir menu do perfil" aria-expanded={accountMenuOpen} onClick={() => setAccountMenuOpen((open) => !open)}>{settings.avatar ? <img src={settings.avatar} alt={`Avatar de ${settings.teacherName}`} /> : <CircleUserRound size={22} />}</button>{accountMenuOpen && <div className="student-account-popover teacher-account-popover"><div><strong>{settings.teacherName || 'Professor'}</strong><span>{settings.email || settings.schoolName || 'Teacher Workspace'}</span></div><button type="button" onClick={() => navigateTo('Configurações')}><Settings size={16} />Perfil e configurações</button>{onLogout && <button type="button" className="student-account-logout" onClick={onLogout}><LogOut size={16} />Sair</button>}</div>}</div>
        </header>

        {!isOnline && <div className="offline-banner" role="status"><WifiOff size={17} /><span>Você está offline. Alterações que dependem do Supabase podem não ser salvas até a conexão voltar.</span></div>}

        {selected ? <StudentProfile student={selected} onNewLesson={() => setCreatingLessonRecord(true)} onSkillChange={updateSkill} onEdit={() => setStudentToEdit(selected)} onDelete={() => setStudentToDelete(selected)} onPreview={() => onPreviewStudent?.(selected)} onEditLesson={setLessonRecordToEdit} onDeleteLesson={setLessonRecordToDelete} /> : active === 'Visão geral' ? <Dashboard teacherName={settings.teacherName} students={students} schedule={schedule} averageProgress={averageProgress} authenticatedMode={authenticatedMode} onOpenStudent={(id) => { setSelectedId(id); setActive('Alunos'); }} onOpenSchedule={() => setActive('Aulas')} /> : active === 'Notificações' ? <NotificationsPage notifications={notifications} readIds={notificationReadIds} onOpen={openNotification} onMarkAll={markAllNotificationsRead} /> : active === 'Alunos' ? <StudentsPage students={filteredStudents} schedule={schedule} query={query} setQuery={setQuery} onOpen={setSelectedId} /> : active === 'Aulas' ? <LessonsPage students={students} lessons={schedule} onNew={(date) => setLessonToEdit({ ...newLessonDraft(), date: date ?? toDateInput(new Date()) })} onEdit={setLessonToEdit} onComplete={setLessonToComplete} onCancel={cancelScheduledLesson} /> : active === 'Materiais' ? <MaterialsPage materials={materials} onNew={() => setShowMaterialForm(true)} onDelete={setMaterialToDelete} onAssign={setMaterialToAssign} /> : active === 'Tarefas' ? <AssignmentsPage assignments={assignments.filter((assignment) => assignment.assignmentType !== 'interactive')} students={students} mode="tasks" onNew={() => setAssignmentFormMode('regular')} onDelete={setAssignmentToDelete} onReview={setAssignmentToReview} /> : active === 'Quiz' ? <AssignmentsPage assignments={assignments.filter((assignment) => assignment.assignmentType === 'interactive')} students={students} mode="quiz" onNew={() => setAssignmentFormMode('interactive')} onManageBank={() => setShowQuestionBank(true)} onDelete={setAssignmentToDelete} onReview={setAssignmentToReview} /> : active === 'Financeiro' ? <FinancePage payments={payments} students={students} onNew={() => setShowPaymentForm(true)} onStatus={updatePaymentStatus} onDelete={deletePayment} /> : active === 'Progresso' ? <ProgressPage students={students} onOpenStudent={(id) => { setSelectedId(id); setActive('Alunos'); }} /> : active === 'Relatórios' ? <ReportsPage students={students} schedule={schedule} assignments={assignments} /> : active === 'Configurações' ? <SettingsPage settings={settings} authenticatedMode={authenticatedMode} accountAccess={accountAccess} onSave={saveSettings} counts={{ students: students.length, lessons: schedule.length, materials: materials.length }} onExport={exportData} onReset={resetData} onInviteTeacher={onInviteTeacher} onManageTeachers={onManageTeachers} /> : <PlaceholderPage title={active} />}
      </main>

      {showStudentForm && <StudentModal onClose={() => setShowStudentForm(false)} onSave={addStudent} defaultDuration={settings.defaultDuration} defaultOnlineUrl={settings.defaultOnlineUrl} />}
      {studentToEdit && <StudentEditModal student={studentToEdit} onClose={() => setStudentToEdit(null)} onSave={saveStudentProfile} />}
      {showLessonForm && selected && <LessonModal studentName={selected.name} onClose={() => setShowLessonForm(false)} onSave={addLesson} />}
      {lessonToEdit && <ScheduleLessonModal students={students} lesson={lessonToEdit.id ? lessonToEdit : undefined} onClose={() => setLessonToEdit(null)} onSave={lessonToEdit.id ? editScheduledLesson : saveScheduledLesson} />}
      {lessonToComplete && <CompleteLessonModal lesson={lessonToComplete} student={students.find((student) => student.id === lessonToComplete.studentId)} onClose={() => setLessonToComplete(null)} onSave={completeScheduledLesson} />}
      {creatingLessonRecord && selected && <LessonRecordModal lesson={{ id: '', date: toDateInput(new Date()), startTime: '12:00', duration: settings.defaultDuration, topic: '', onlineUrl: settings.defaultOnlineUrl, notes: '', strengths: '', improvements: '', homework: '', skillScores: selected.skills }} student={selected} onClose={() => setCreatingLessonRecord(false)} onSave={createLessonRecord} />}
      {lessonRecordToEdit && selected && <LessonRecordModal lesson={lessonRecordToEdit} student={selected} onClose={() => setLessonRecordToEdit(null)} onSave={updateLessonRecord} />}
      {lessonRecordToDelete && <ConfirmLessonDelete lesson={lessonRecordToDelete} onClose={() => setLessonRecordToDelete(null)} onConfirm={deleteLessonRecord} />}
      {studentToDelete && <DeleteStudentModal student={studentToDelete} scheduledLessons={schedule.filter((lesson) => lesson.studentId === studentToDelete.id).length} onClose={() => setStudentToDelete(null)} onConfirm={deleteStudent} />}
      {showMaterialForm && <MaterialModal onClose={() => setShowMaterialForm(false)} onSave={addMaterial} />}
      {materialToDelete && <DeleteMaterialModal material={materialToDelete} onClose={() => setMaterialToDelete(null)} onConfirm={deleteMaterial} />}
      {materialToAssign && <AssignMaterialModal material={materialToAssign} students={students} onClose={() => setMaterialToAssign(null)} onSave={assignMaterial} />}
      {temporaryAccess && <TemporaryAccessModal access={temporaryAccess} onClose={() => setTemporaryAccess(null)} />}
      {assignmentFormMode && <AssignmentModal students={students} materials={materials} questionBank={questionBank} mode={assignmentFormMode} onClose={() => setAssignmentFormMode(null)} onSave={addAssignment} />}
      {showQuestionBank && <QuestionBankModal questions={questionBank} onClose={() => setShowQuestionBank(false)} onCreate={addQuestionBankItem} onDelete={deleteQuestionBankItem} />}
      {assignmentToDelete && <ConfirmAssignmentDelete assignment={assignmentToDelete} onClose={() => setAssignmentToDelete(null)} onConfirm={deleteAssignment} />}
      {showPaymentForm && <PaymentModal students={students} onClose={() => setShowPaymentForm(false)} onSave={createPayment} />}{assignmentToReview && <ReviewAssignmentModal assignment={assignmentToReview} onClose={() => setAssignmentToReview(null)} onSave={reviewAssignment} />}
    </div>
  );
}

function NotificationsPage({ notifications, readIds, onOpen, onMarkAll }: { notifications: AppNotification[]; readIds: string[]; onOpen: (notification: AppNotification) => void; onMarkAll: () => void }) {
  const unread = notifications.filter((item) => !readIds.includes(item.id)).length;
  const iconFor = (kind: NotificationKind) => kind === 'lesson' ? CalendarDays : kind === 'assignment' ? ClipboardList : kind === 'quiz' ? FileQuestion : kind === 'payment' ? CircleDollarSign : kind === 'mission' ? Target : kind === 'system' ? Bell : Ban;
  return <section className="notifications-page">
    <div className="panel notifications-panel">
      <div className="panel-heading notifications-heading"><div><p className="eyebrow">CENTRAL</p><h3>Notificações</h3><p>Acompanhe o que precisa da sua atenção agora.</p></div>{unread > 0 && <button className="secondary-button compact" onClick={onMarkAll}><Check size={16} />Marcar todas como lidas</button>}</div>
      <div className="notification-summary"><div><Bell size={22} /><span><strong>{unread}</strong><small>não lida(s)</small></span></div><div><CalendarDays size={22} /><span><strong>{notifications.filter((item) => item.kind === 'lesson').length}</strong><small>aulas próximas</small></span></div><div><Target size={22} /><span><strong>{notifications.filter((item) => item.urgent).length}</strong><small>itens prioritários</small></span></div></div>
      {notifications.length ? <div className="notification-list">{notifications.map((notification) => { const Icon = iconFor(notification.kind); const isRead = readIds.includes(notification.id); return <button key={notification.id} className={`notification-card ${isRead ? 'read' : 'unread'} ${notification.urgent ? 'urgent' : ''}`} onClick={() => onOpen(notification)}><span className={`notification-icon ${notification.kind}`}><Icon size={20} /></span><span className="notification-copy"><span><strong>{notification.title}</strong>{!isRead && <i>Novo</i>}</span><p>{notification.description}</p><small>{formatNotificationDate(notification.date)}</small></span><ChevronRight size={18} /></button>; })}</div> : <div className="empty-state"><Check size={38} /><h3>Tudo em dia!</h3><p>Quando houver aulas próximas ou pendências, elas aparecerão aqui.</p></div>}
    </div>
  </section>;
}

function formatNotificationDate(value: string) {
  const date = new Date(value); const now = new Date();
  if (date.toDateString() === now.toDateString()) return `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) return `Amanhã, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Dashboard({ teacherName, students, schedule, averageProgress, authenticatedMode, onOpenStudent, onOpenSchedule }: { teacherName: string; students: Student[]; schedule: ScheduledLesson[]; averageProgress: number; authenticatedMode: boolean; onOpenStudent: (id: Id) => void; onOpenSchedule: () => void }) {
  const upcomingLessons = schedule
    .filter((lesson) => lesson.status === 'Agendada' && new Date(`${lesson.date}T${lesson.startTime}:00`) >= new Date())
    .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`))
    .slice(0, 3);

  return <>
    <section className="hero-card"><div><span className="pill">LANGSPOT MVP</span><h2>Olá, {teacherName}!</h2><p>Seus alunos, aulas e progresso agora estão no mesmo lugar.</p></div><button className="ghost-button" onClick={onOpenSchedule}>Ver agenda <ChevronRight size={18} /></button></section>
    <section className="stats-grid"><StatCard label="Alunos ativos" value={String(students.filter((s) => s.status === 'Ativo').length)} note="dados salvos localmente" /><StatCard label="Aulas registradas" value={String(students.reduce((sum, s) => sum + s.lessons.length, 0))} note="histórico do MVP" /><StatCard label="Perfis cadastrados" value={String(students.length)} note="incluindo pausados" /><StatCard label="Média de progresso" value={`${averageProgress}%`} note="média das habilidades" /></section>
    <section className="content-grid"><StudentPanel students={students.slice(0, 4)} schedule={schedule} onOpen={onOpenStudent} /><aside className="panel schedule-panel"><div className="panel-heading"><div><p className="eyebrow">AGENDA</p><h3>Próximas aulas</h3></div></div>{upcomingLessons.length ? upcomingLessons.map((lesson) => <Timeline key={lesson.id} time={lesson.startTime} name={students.find((student) => student.id === lesson.studentId)?.name ?? 'Aluno'} topic={lesson.topic} />) : <div className="empty-state small"><CalendarDays size={34} /><h3>Nenhuma aula agendada</h3><p>Suas próximas aulas cadastradas aparecerão aqui.</p></div>}<button className="secondary-button" onClick={onOpenSchedule}>Abrir calendário</button></aside></section>
  </>;
}

function StudentsPage({ students, schedule, query, setQuery, onOpen }: { students: Student[]; schedule: ScheduledLesson[]; query: string; setQuery: (value: string) => void; onOpen: (id: Id) => void }) {
  return <section className="panel"><div className="panel-heading"><div><p className="eyebrow">GESTÃO</p><h3>Todos os alunos</h3></div><div className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome, nível ou objetivo" /></div></div>{students.length ? <StudentList students={students} schedule={schedule} onOpen={onOpen} /> : <div className="empty-state"><UsersRound size={38} /><h3>Nenhum aluno encontrado</h3><p>Tente outra busca ou cadastre um novo aluno.</p></div>}</section>;
}

function SettingsPage({ settings, authenticatedMode, accountAccess, onSave, counts, onExport, onReset, onInviteTeacher, onManageTeachers }: { settings: PlatformSettings; authenticatedMode: boolean; accountAccess?: AccountAccessInfo; onSave: (settings: PlatformSettings) => void; counts: { students: number; lessons: number; materials: number }; onExport: () => void; onReset: () => void; onInviteTeacher?: () => void; onManageTeachers?: () => void }) {
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const update = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const updateInterface = <K extends 'compactMode' | 'theme'>(key: K, value: PlatformSettings[K]) => { update(key, value); onSave({ ...draft, [key]: value }); };
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSave(draft); setSaved(true); window.setTimeout(() => setSaved(false), 1800); };
  const reset = () => { if (window.confirm('Restaurar os dados de exemplo? Seus dados atuais serão substituídos.')) onReset(); };
  const selectAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setAvatarMessage('Selecione um arquivo de imagem.'); return; }
    if (file.size > 5 * 1024 * 1024) { setAvatarMessage('A imagem deve ter no máximo 5 MB.'); return; }
    try {
      update('avatar', await resizeAvatar(file));
      setAvatarMessage('Nova foto pronta. Salve as alterações para aplicar.');
    } catch {
      setAvatarMessage('Não foi possível processar esta imagem.');
    }
    event.target.value = '';
  };

  return <form className="settings-page" onSubmit={submit}>
    <section className="settings-hero"><div><p className="eyebrow">PERSONALIZAÇÃO</p><h2>Configure seu espaço de trabalho</h2><p>{authenticatedMode ? 'Seu perfil é sincronizado com o Supabase; preferências visuais permanecem neste navegador.' : 'As preferências do modo demonstração ficam salvas neste navegador.'}</p></div><button className="settings-save" type="submit"><Save size={17} />{saved ? 'Salvo!' : 'Salvar alterações'}</button></section>
    <div className="settings-grid">
      <section className="panel settings-card"><div className="settings-card-heading"><div className="settings-card-icon"><CircleUserRound size={21} /></div><div><h3>Perfil do professor</h3><p>Informações usadas na interface e relatórios.</p></div></div><div className="avatar-setting wide-setting"><div className="avatar-preview">{draft.avatar ? <img src={draft.avatar} alt="Pré-visualização do avatar" /> : <CircleUserRound size={40} />}</div><div><strong>Foto de perfil</strong><span>JPG, PNG ou WebP de até 5 MB.</span><div className="avatar-actions"><label><ImagePlus size={15} />Escolher imagem<input type="file" accept="image/*" onChange={selectAvatar} /></label>{draft.avatar && <button type="button" onClick={() => { update('avatar', ''); setAvatarMessage('Foto removida. Salve as alterações para aplicar.'); }}><Trash2 size={14} />Remover</button>}</div>{avatarMessage && <small>{avatarMessage}</small>}</div></div><div className="settings-fields"><label>Nome<input value={draft.teacherName} onChange={(event) => update('teacherName', event.target.value)} required /></label><label>E-mail<input type="email" value={draft.email} onChange={(event) => update('email', event.target.value)} placeholder="professor@email.com" /></label><label className="wide-setting">Nome da escola ou marca<input value={draft.schoolName} onChange={(event) => update('schoolName', event.target.value)} /></label></div>{accountAccess && <div className={`account-access-card account-access-${accountAccess.status}`}><ShieldCheck size={19} /><div><span>Status da conta</span><strong>{accountAccess.label}</strong><p>{accountAccess.description}</p></div></div>}</section>
      <section className="panel settings-card"><div className="settings-card-heading"><div className="settings-card-icon"><CalendarDays size={21} /></div><div><h3>Padrões das aulas</h3><p>Valores preenchidos ao agendar uma nova aula.</p></div></div><div className="settings-fields"><label>Duração padrão<select value={draft.defaultDuration} onChange={(event) => update('defaultDuration', Number(event.target.value))}><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="50">50 minutos</option><option value="60">60 minutos</option><option value="90">90 minutos</option></select></label><label className="wide-setting">Link padrão da aula online<input type="url" value={draft.defaultOnlineUrl} onChange={(event) => update('defaultOnlineUrl', event.target.value)} placeholder="https://meet.google.com/..." /></label><ToggleSetting label="Confirmar cancelamentos" note="Evita cancelamentos acidentais na agenda." checked={draft.confirmCancellations} onChange={(value) => update('confirmCancellations', value)} /></div></section>
      <section className="panel settings-card"><div className="settings-card-heading"><div className="settings-card-icon"><Settings size={21} /></div><div><h3>Interface</h3><p>Ajuste o tema e a densidade visual da plataforma.</p></div></div><div className="settings-fields"><div className="theme-setting wide-setting"><strong>Tema</strong><span>A mudança é aplicada imediatamente.</span><div><button type="button" className={draft.theme === 'light' ? 'active' : ''} onClick={() => updateInterface('theme', 'light')}><Sun size={16} />Claro</button><button type="button" className={draft.theme === 'dark' ? 'active' : ''} onClick={() => updateInterface('theme', 'dark')}><Moon size={16} />Escuro</button></div></div><ToggleSetting label="Modo compacto" note="Reduz espaçamentos para mostrar mais conteúdo." checked={draft.compactMode} onChange={(value) => updateInterface('compactMode', value)} /></div></section>
      {onInviteTeacher && onManageTeachers && <section className="panel settings-card administration-card"><div className="settings-card-heading"><div className="settings-card-icon"><UserPlus size={21} /></div><div><h3>Administração</h3><p>Gerencie acessos e permissões da plataforma.</p></div></div><div className="settings-fields"><div className="admin-actions"><button type="button" className="primary-button" onClick={onInviteTeacher}><UserPlus size={16} />Convidar professor</button><button type="button" className="secondary-button" onClick={onManageTeachers}><UsersRound size={16} />Gerenciar professores</button></div><small className="admin-description">Convide professores, consulte contas cadastradas e controle o acesso à plataforma.</small></div></section>}
      <section className="panel settings-card data-settings"><div className="settings-card-heading"><div className="settings-card-icon"><ShieldCheck size={21} /></div><div><h3>Dados e segurança</h3><p>{authenticatedMode ? 'Alunos, aulas e recursos são sincronizados com o Supabase.' : 'Os dados do modo demonstração ficam somente neste navegador.'}</p></div></div><div className="data-summary"><span><strong>{counts.students}</strong> alunos</span><span><strong>{counts.lessons}</strong> aulas</span><span><strong>{counts.materials}</strong> materiais</span></div><div className="data-actions"><button type="button" className="export-button" onClick={onExport}><Download size={16} />Exportar backup</button>{can.resetData() && <button type="button" className="danger-button" onClick={reset}><Trash2 size={16} />Restaurar exemplos</button>}</div><small className="app-version">LangSpot {APP_VERSION}</small></section>
    </div>
  </form>;
}

function ToggleSetting({ label, note, checked, onChange }: { label: string; note: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="toggle-setting wide-setting"><div><strong>{label}</strong><span>{note}</span></div><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><i /></label>;
}

function resizeAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const size = Math.min(image.width, image.height);
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 320;
      const context = canvas.getContext('2d');
      if (!context) { URL.revokeObjectURL(url); reject(); return; }
      context.drawImage(image, (image.width - size) / 2, (image.height - size) / 2, size, size, 0, 0, 320, 320);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(); };
    image.src = url;
  });
}

function MaterialsPage({ materials, onNew, onDelete, onAssign }: { materials: Material[]; onNew: () => void; onDelete: (material: Material) => void; onAssign: (material: Material) => void }) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<MaterialType | 'Todos'>('Todos');
  const [levelFilter, setLevelFilter] = useState('Todos');
  const visible = materials.filter((material) => {
    const matchesQuery = `${material.title} ${material.description} ${material.skill}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (typeFilter === 'Todos' || material.type === typeFilter) && (levelFilter === 'Todos' || material.level === levelFilter);
  });

  return <div className="materials-layout">
    <section className="materials-hero"><div><p className="eyebrow">BIBLIOTECA</p><h2>Recursos para suas próximas aulas</h2><p>Organize links, atividades, áudios e referências por nível e habilidade.</p></div><div className="materials-total"><strong>{materials.length}</strong><span>materiais salvos</span></div></section>
    <section className="panel materials-toolbar"><div className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar título, habilidade..." /></div><div className="material-filters"><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as MaterialType | 'Todos')}><option>Todos</option><option>PDF</option><option>Vídeo</option><option>Áudio</option><option>Link</option><option>Atividade</option></select><select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}><option>Todos</option><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option></select></div></section>
    {visible.length ? <section className="materials-grid">{visible.map((material) => <MaterialCard material={material} onDelete={onDelete} onAssign={onAssign} key={material.id} />)}</section> : <section className="panel empty-state"><FolderOpen size={42} /><h3>Nenhum material encontrado</h3><p>Ajuste os filtros ou adicione um novo recurso à biblioteca.</p><button className="secondary-button compact" onClick={onNew}><Plus size={16} />Novo material</button></section>}
  </div>;
}

function MaterialCard({ material, onDelete, onAssign }: { material: Material; onDelete: (material: Material) => void; onAssign: (material: Material) => void }) {
  const Icon = materialIcon(material.type);
  return <article className="material-card"><div className={`material-icon type-${material.type.toLowerCase().replace('í', 'i').replace('á', 'a')}`}><Icon size={23} /></div><div className="material-tags"><span>{material.type}</span><span>{material.level}</span><span>{material.skill}</span></div><h3>{material.title}</h3><p>{material.description || 'Sem descrição.'}</p><small>Adicionado em {formatDate(material.createdAt)}</small><div className="material-actions"><button onClick={() => onAssign(material)} title="Compartilhar com alunos"><UsersRound size={15} />{material.assignedStudentIds?.length ?? 0}</button><a href={material.url} target="_blank" rel="noreferrer"><ExternalLink size={15} />{material.source === 'upload' ? 'Visualizar PDF' : 'Abrir material'}</a><button onClick={() => onDelete(material)} title="Excluir material"><Trash2 size={15} /></button></div></article>;
}

function ProgressPage({ students, onOpenStudent }: { students: Student[]; onOpenStudent: (id: Id) => void }) {
  const [levelFilter, setLevelFilter] = useState('Todos');
  const visible = students.filter((student) => levelFilter === 'Todos' || student.level === levelFilter);
  const average = visible.length ? Math.round(visible.reduce((sum, student) => sum + student.progress, 0) / visible.length) : 0;
  const strongest = visible.length ? skills.map((skill) => ({ skill, value: skillAverage(visible, skill) })).sort((a, b) => b.value - a.value)[0] : undefined;
  const attention = visible.length ? skills.map((skill) => ({ skill, value: skillAverage(visible, skill) })).sort((a, b) => a.value - b.value)[0] : undefined;
  const topStudent = [...visible].sort((a, b) => b.progress - a.progress)[0];

  return <div className="progress-page">
    <section className="progress-hero"><div><p className="eyebrow">ACOMPANHAMENTO</p><h2>Panorama de desenvolvimento</h2><p>Compare habilidades e identifique onde cada aluno precisa de mais atenção.</p></div><div className="progress-score"><strong>{average}%</strong><span>média da turma</span></div></section>
    <section className="progress-stats"><ProgressInsight icon={Award} label="Maior destaque" value={topStudent?.name ?? '—'} note={topStudent ? `${topStudent.progress}% de progresso geral` : 'Nenhum aluno'} /><ProgressInsight icon={TrendingUp} label="Habilidade mais forte" value={strongest?.skill ?? '—'} note={strongest ? `${strongest.value}% de média` : 'Sem dados'} /><ProgressInsight icon={Target} label="Ponto de atenção" value={attention?.skill ?? '—'} note={attention ? `${attention.value}% de média` : 'Sem dados'} /></section>
    <section className="progress-grid">
      <article className="panel skill-overview"><div className="panel-heading"><div><p className="eyebrow">MÉDIA DA TURMA</p><h3>Desempenho por habilidade</h3></div><select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}><option>Todos</option><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option></select></div><div className="skill-chart">{skills.map((skill) => <SkillBar skill={skill} value={skillAverage(visible, skill)} key={skill} />)}</div></article>
      <article className="panel level-overview"><div className="panel-heading"><div><p className="eyebrow">DISTRIBUIÇÃO</p><h3>Alunos por nível</h3></div></div><div className="level-list">{['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => { const count = students.filter((student) => student.level === level).length; return <div className="level-row" key={level}><strong>{level}</strong><div><span style={{ width: `${students.length ? (count / students.length) * 100 : 0}%` }} /></div><em>{count}</em></div>; })}</div></article>
    </section>
    <section className="panel student-progress-panel"><div className="panel-heading"><div><p className="eyebrow">INDIVIDUAL</p><h3>Progresso dos alunos</h3></div><span className="results-count">{visible.length} aluno(s)</span></div>{visible.length ? <div className="progress-student-grid">{[...visible].sort((a, b) => b.progress - a.progress).map((student) => <ProgressStudentCard student={student} onOpen={onOpenStudent} key={student.id} />)}</div> : <div className="empty-state small"><ChartNoAxesCombined size={34} /><h3>Nenhum aluno neste nível</h3><p>Selecione outro nível para comparar.</p></div>}</section>
  </div>;
}

function ProgressInsight({ icon: Icon, label, value, note }: { icon: typeof Award; label: string; value: string; note: string }) {
  return <article><div><Icon size={20} /></div><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function SkillBar({ skill, value }: { skill: Skill; value: number }) {
  return <div className="skill-bar"><div><strong>{skill}</strong><span>{value}%</span></div><div className="skill-bar-track"><span style={{ width: `${value}%` }} /></div></div>;
}

function ProgressStudentCard({ student, onOpen }: { student: Student; onOpen: (id: Id) => void }) {
  const strongest = skills.reduce((best, skill) => student.skills[skill] > student.skills[best] ? skill : best, skills[0]);
  return <article className="progress-student-card"><div className="progress-student-heading"><div className="avatar">{initials(student.name)}</div><div><strong>{student.name}</strong><span>{student.level} · {student.goal}</span></div><b>{student.progress}%</b></div><div className="student-progress-track"><span style={{ width: `${student.progress}%` }} /></div><div className="progress-student-meta"><span>Destaque: <strong>{strongest}</strong></span><span>{student.lessons.length} aula(s)</span></div><button onClick={() => onOpen(student.id)}>Ver perfil <ChevronRight size={15} /></button></article>;
}

function ReportsPage({ students, schedule, assignments }: { students: Student[]; schedule: ScheduledLesson[]; assignments: Assignment[] }) {
  const now = new Date();
  const [tab, setTab] = useState<'Resumo' | 'Individual'>('Resumo');
  const [startDate, setStartDate] = useState(() => toDateInput(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [endDate, setEndDate] = useState(() => toDateInput(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
  const [studentId, setStudentId] = useState<Id>(() => students[0]?.id ?? '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!students.some((student) => student.id === studentId)) setStudentId(students[0]?.id ?? '');
  }, [students, studentId]);

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - Math.max(days - 1, 0));
    setStartDate(toDateInput(start));
    setEndDate(toDateInput(end));
  };

  const periodLessons = schedule.filter((lesson) => lesson.date >= startDate && lesson.date <= endDate);
  const periodAssignments = assignments.filter((assignment) => assignment.createdAt.slice(0, 10) <= endDate && assignment.dueDate >= startDate);
  const completed = periodLessons.filter((lesson) => lesson.status === 'Concluída');
  const cancelled = periodLessons.filter((lesson) => lesson.status === 'Cancelada');
  const scheduled = periodLessons.filter((lesson) => lesson.status === 'Agendada');
  const completionRate = periodLessons.length ? Math.round((completed.length / periodLessons.length) * 100) : 0;
  const attendanceLessons = completed.filter((lesson) => lesson.attendance === 'Presente' || lesson.attendance === 'Ausente');
  const attendanceRate = attendanceLessons.length ? Math.round((attendanceLessons.filter((lesson) => lesson.attendance === 'Presente').length / attendanceLessons.length) * 100) : 0;
  const submittedAssignments = periodAssignments.filter((assignment) => assignment.status !== 'Pendente');
  const assignmentRate = periodAssignments.length ? Math.round((submittedAssignments.length / periodAssignments.length) * 100) : 0;
  const gradedAssignments = periodAssignments.filter((assignment) => typeof assignment.grade === 'number');
  const averageGrade = gradedAssignments.length ? Math.round(gradedAssignments.reduce((sum, assignment) => sum + (assignment.grade ?? 0), 0) / gradedAssignments.length) : undefined;
  const selectedStudent = students.find((student) => student.id === studentId) ?? students[0];
  const studentSchedule = selectedStudent ? periodLessons.filter((lesson) => lesson.studentId === selectedStudent.id) : [];
  const studentHistory = selectedStudent ? selectedStudent.lessons.filter((lesson) => lesson.date >= startDate && lesson.date <= endDate) : [];
  const studentAssignments = selectedStudent ? periodAssignments.filter((assignment) => assignment.studentId === selectedStudent.id) : [];
  const strongest = selectedStudent ? skills.reduce((best, skill) => selectedStudent.skills[skill] > selectedStudent.skills[best] ? skill : best, skills[0]) : undefined;
  const attention = selectedStudent ? skills.reduce((lowest, skill) => selectedStudent.skills[skill] < selectedStudent.skills[lowest] ? skill : lowest, skills[0]) : undefined;

  const copySummary = async () => {
    if (!selectedStudent) return;
    const text = studentReportText(selectedStudent, studentHistory, strongest!, attention!, startDate, endDate, studentSchedule, studentAssignments);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return <div className="reports-page">
    <section className="reports-controls panel no-print">
      <div className="report-tabs"><button className={tab === 'Resumo' ? 'active' : ''} onClick={() => setTab('Resumo')}>Resumo do período</button><button className={tab === 'Individual' ? 'active' : ''} onClick={() => setTab('Individual')}>Relatório individual</button></div>
      <div className="report-presets"><span>Período rápido</span><button onClick={() => applyPreset(30)}>30 dias</button><button onClick={() => applyPreset(90)}>90 dias</button><button onClick={() => applyPreset(180)}>Semestre</button></div>
      <div className="report-filters"><label>De<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label>Até<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>{tab === 'Individual' && <label>Aluno<select value={studentId} onChange={(event) => setStudentId(event.target.value)}>{students.map((student) => <option value={student.id} key={student.id}>{student.name}</option>)}</select></label>}<button className="print-button" onClick={() => window.print()}><Printer size={16} />Imprimir / PDF</button>{tab === 'Individual' && <button className="copy-button" onClick={copySummary}><Copy size={16} />{copied ? 'Copiado!' : 'Copiar resumo'}</button>}</div>
    </section>
    {tab === 'Resumo' ? <PeriodReport students={students} lessons={periodLessons} assignments={periodAssignments} completed={completed.length} cancelled={cancelled.length} scheduled={scheduled.length} completionRate={completionRate} attendanceRate={attendanceRate} assignmentRate={assignmentRate} averageGrade={averageGrade} startDate={startDate} endDate={endDate} /> : selectedStudent ? <IndividualReport student={selectedStudent} scheduledLessons={studentSchedule} history={studentHistory} assignments={studentAssignments} strongest={strongest!} attention={attention!} startDate={startDate} endDate={endDate} /> : <section className="panel empty-state"><UsersRound size={38} /><h3>Nenhum aluno cadastrado</h3><p>Cadastre um aluno para gerar o relatório individual.</p></section>}
  </div>;
}

function PeriodReport({ students, lessons, assignments, completed, cancelled, scheduled, completionRate, attendanceRate, assignmentRate, averageGrade, startDate, endDate }: { students: Student[]; lessons: ScheduledLesson[]; assignments: Assignment[]; completed: number; cancelled: number; scheduled: number; completionRate: number; attendanceRate: number; assignmentRate: number; averageGrade?: number; startDate: string; endDate: string }) {
  const activity = [...students].map((student) => ({ student, lessons: lessons.filter((lesson) => lesson.studentId === student.id), assignments: assignments.filter((assignment) => assignment.studentId === student.id) })).sort((a, b) => b.lessons.length - a.lessons.length);
  const statusData = [{ label: 'Concluídas', value: completed }, { label: 'Agendadas', value: scheduled }, { label: 'Canceladas', value: cancelled }];
  return <section className="report-sheet"><ReportHeader title="Resumo do período" startDate={startDate} endDate={endDate} /><div className="report-metrics report-metrics-advanced"><ReportMetric label="Aulas no período" value={String(lessons.length)} /><ReportMetric label="Conclusão de aulas" value={`${completionRate}%`} /><ReportMetric label="Frequência" value={`${attendanceRate}%`} /><ReportMetric label="Entrega de tarefas" value={`${assignmentRate}%`} /><ReportMetric label="Média das tarefas" value={averageGrade === undefined ? '—' : String(averageGrade)} /><ReportMetric label="Alunos ativos" value={String(students.filter((student) => student.status === 'Ativo').length)} /></div><div className="report-dashboard-grid"><article className="report-block"><h3>Situação das aulas</h3><StatusBars data={statusData} /></article><article className="report-block"><h3>Média por habilidade</h3><div className="report-skills">{skills.map((skill) => <SkillBar skill={skill} value={skillAverage(students, skill)} key={skill} />)}</div></article></div><article className="report-block"><div className="report-section-heading"><div><h3>Atividade por aluno</h3><p>Aulas, tarefas e progresso no período selecionado.</p></div><span>{activity.length} aluno(s)</span></div><div className="report-activity-table"><div className="report-activity-head"><span>Aluno</span><span>Aulas</span><span>Tarefas</span><span>Progresso</span></div>{activity.map(({ student, lessons: studentLessons, assignments: studentTasks }) => <div className="report-activity-row" key={student.id}><div><strong>{student.name}</strong><small>{student.level} · {student.goal}</small></div><b>{studentLessons.length}</b><b>{studentTasks.filter((assignment) => assignment.status !== 'Pendente').length}/{studentTasks.length}</b><div className="report-mini-progress"><span><i style={{ width: `${student.progress}%` }} /></span><b>{student.progress}%</b></div></div>)}</div></article></section>;
}

function IndividualReport({ student, scheduledLessons, history, assignments, strongest, attention, startDate, endDate }: { student: Student; scheduledLessons: ScheduledLesson[]; history: Lesson[]; assignments: Assignment[]; strongest: Skill; attention: Skill; startDate: string; endDate: string }) {
  const completedLessons = scheduledLessons.filter((lesson) => lesson.status === 'Concluída');
  const attendanceBase = completedLessons.filter((lesson) => lesson.attendance === 'Presente' || lesson.attendance === 'Ausente');
  const attendanceRate = attendanceBase.length ? Math.round(attendanceBase.filter((lesson) => lesson.attendance === 'Presente').length / attendanceBase.length * 100) : 0;
  const delivered = assignments.filter((assignment) => assignment.status !== 'Pendente').length;
  const taskRate = assignments.length ? Math.round(delivered / assignments.length * 100) : 0;
  const graded = assignments.filter((assignment) => typeof assignment.grade === 'number');
  const averageGrade = graded.length ? Math.round(graded.reduce((sum, assignment) => sum + (assignment.grade ?? 0), 0) / graded.length) : undefined;
  const studyMinutes = completedLessons.reduce((sum, lesson) => sum + lesson.duration, 0);
  const trend = completedLessons.filter((lesson) => lesson.skillScores && Object.keys(lesson.skillScores).length).sort((a, b) => a.date.localeCompare(b.date)).slice(-8).map((lesson) => ({ label: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(`${lesson.date}T12:00:00`)), value: Math.round(Object.values(lesson.skillScores ?? {}).reduce((sum, value) => sum + Number(value), 0) / Math.max(Object.values(lesson.skillScores ?? {}).length, 1)) }));
  const reportHistory = history.length ? history : completedLessons.map(scheduledToHistory);
  return <section className="report-sheet"><ReportHeader title={`Relatório individual · ${student.name}`} startDate={startDate} endDate={endDate} /><div className="individual-report-header"><div className="avatar large">{initials(student.name)}</div><div><span className="status-badge">{student.status}</span><h2>{student.name}</h2><p>{student.level} · {student.goal} · {student.email}</p></div><strong>{student.progress}%</strong></div><div className="report-metrics report-metrics-advanced"><ReportMetric label="Aulas concluídas" value={String(completedLessons.length || history.length)} /><ReportMetric label="Carga horária" value={formatStudyTime(studyMinutes)} /><ReportMetric label="Frequência" value={`${attendanceRate}%`} /><ReportMetric label="Tarefas entregues" value={`${delivered}/${assignments.length}`} /><ReportMetric label="Média das tarefas" value={averageGrade === undefined ? '—' : String(averageGrade)} /><ReportMetric label="Progresso geral" value={`${student.progress}%`} /></div><div className="report-dashboard-grid"><article className="report-block"><h3>Evolução nas avaliações</h3><p className="report-block-description">Média das habilidades registradas ao concluir cada aula.</p><EvolutionChart points={trend} fallback={student.progress} /></article><article className="report-block"><h3>Indicadores de acompanhamento</h3><div className="report-kpis"><ReportKpi label="Frequência" value={attendanceRate} /><ReportKpi label="Entrega de tarefas" value={taskRate} /><ReportKpi label="Progresso atual" value={student.progress} /></div></article></div><div className="report-columns"><article className="report-block"><h3>Progresso por habilidade</h3><div className="report-skills">{skills.map((skill) => <SkillBar skill={skill} value={student.skills[skill]} key={skill} />)}</div><div className="report-insight-pills"><span><Award size={14} />Destaque: <b>{strongest}</b></span><span><Target size={14} />Atenção: <b>{attention}</b></span></div></article><article className="report-block"><h3>Observações do professor</h3><p className="report-note">{student.notes || 'Nenhuma observação geral registrada.'}</p><h3>Tarefas no período</h3><div className="report-task-list">{assignments.length ? assignments.slice(0, 6).map((assignment) => <div key={assignment.id}><span className={`assignment-status ${assignment.status.toLowerCase()}`}>{assignment.status}</span><div><strong>{assignment.title}</strong><small>Prazo: {formatDate(assignment.dueDate)}{typeof assignment.grade === 'number' ? ` · Nota ${assignment.grade}` : ''}</small></div></div>) : <p className="report-note">Nenhuma tarefa no período.</p>}</div></article></div><article className="report-block"><h3>Histórico de aulas</h3><div className="report-history report-history-grid">{reportHistory.length ? reportHistory.map((lesson) => <div key={lesson.id}><time>{formatDate(lesson.date)}</time><strong>{lesson.topic}</strong><p>{lesson.notes || 'Sem observações.'}</p><div className="lesson-meta">{lesson.attendance && <span>Presença: {lesson.attendance}</span>}{lesson.homework && <small>Tarefa: {lesson.homework}</small>}</div></div>) : <p className="report-note">Nenhuma aula registrada neste período.</p>}</div></article></section>;
}

function ReportHeader({ title, startDate, endDate }: { title: string; startDate: string; endDate: string }) { return <header className="report-header"><div><span>LANGSPOT</span><h2>{title}</h2><p>{formatDate(startDate)} a {formatDate(endDate)}</p></div><GraduationCap size={34} /></header>; }
function ReportMetric({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function StatusBars({ data }: { data: { label: string; value: number }[] }) { const total = Math.max(data.reduce((sum, item) => sum + item.value, 0), 1); return <div className="status-bars">{data.map((item) => <div key={item.label}><div><span>{item.label}</span><b>{item.value}</b></div><span><i style={{ width: `${Math.round(item.value / total * 100)}%` }} /></span></div>)}</div>; }
function EvolutionChart({ points, fallback }: { points: { label: string; value: number }[]; fallback: number }) { const data = points.length ? points : [{ label: 'Atual', value: fallback }]; return <div className="evolution-chart" role="img" aria-label="Gráfico de evolução das avaliações">{data.map((point) => <div className="evolution-column" key={`${point.label}-${point.value}`}><div className="evolution-value">{point.value}%</div><div className="evolution-track"><i style={{ height: `${Math.max(point.value, 6)}%` }} /></div><span>{point.label}</span></div>)}</div>; }
function ReportKpi({ label, value }: { label: string; value: number }) { return <div className="report-kpi"><div style={{ background: `conic-gradient(#7655f3 ${Math.max(0, Math.min(100, value)) * 3.6}deg, #ece9fb 0deg)` }}><span>{value}%</span></div><strong>{label}</strong></div>; }

function LessonsPage({ students, lessons, onNew, onEdit, onComplete, onCancel }: { students: Student[]; lessons: ScheduledLesson[]; onNew: (date?: string) => void; onEdit: (lesson: ScheduledLesson) => void; onComplete: (lesson: ScheduledLesson) => void; onCancel: (id: Id) => void }) {
  type CalendarView = 'week' | 'month';
  const [calendarView, setCalendarView] = useState<CalendarView>(() => {
    const saved = localStorage.getItem('langspot-calendar-view');
    return saved === 'month' ? 'month' : 'week';
  });
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [studentFilter, setStudentFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState<LessonStatus | 'Todos'>('Todos');
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('langspot-calendar-view', calendarView);
    setExpandedDay(null);
  }, [calendarView]);

  const filteredLessons = lessons.filter((lesson) =>
    (studentFilter === 'Todos' || lesson.studentId === studentFilter)
    && (statusFilter === 'Todos' || lesson.status === statusFilter),
  );

  const weekStart = startOfWeek(calendarDate);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const weekVisible = filteredLessons.filter((lesson) => lesson.date >= toDateInput(weekStart) && lesson.date <= toDateInput(weekDays[6]));

  const monthStart = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
  const monthGridStart = startOfWeek(monthStart);
  const monthDays = Array.from({ length: 42 }, (_, index) => addDays(monthGridStart, index));
  const monthGridEnd = monthDays[41];
  const monthVisible = filteredLessons.filter((lesson) => lesson.date >= toDateInput(monthGridStart) && lesson.date <= toDateInput(monthGridEnd));
  const visible = calendarView === 'week' ? weekVisible : monthVisible;

  const movePeriod = (direction: -1 | 1) => {
    if (calendarView === 'week') setCalendarDate(addDays(calendarDate, direction * 7));
    else setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + direction, 1));
  };

  const periodLabel = calendarView === 'week'
    ? formatWeekRange(weekStart)
    : new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(calendarDate);

  const selectedDayLessons = expandedDay
    ? monthVisible.filter((lesson) => lesson.date === expandedDay).sort((a, b) => a.startTime.localeCompare(b.startTime))
    : [];

  return <div className="agenda-layout">
    <section className="agenda-toolbar panel">
      <div className="week-controls"><button className="icon-button" onClick={() => movePeriod(-1)} aria-label={calendarView === 'week' ? 'Semana anterior' : 'Mês anterior'}><ChevronLeft size={18} /></button><button className="today-button" onClick={() => setCalendarDate(new Date())}>Hoje</button><button className="icon-button" onClick={() => movePeriod(1)} aria-label={calendarView === 'week' ? 'Próxima semana' : 'Próximo mês'}><ChevronRight size={18} /></button><div><p className="eyebrow">{calendarView === 'week' ? 'SEMANA' : 'MÊS'}</p><strong className="calendar-period-label">{periodLabel}</strong></div></div>
      <div className="agenda-toolbar-actions">
        <div className="calendar-view-switch" role="group" aria-label="Visualização da agenda"><button type="button" className={calendarView === 'week' ? 'active' : ''} onClick={() => setCalendarView('week')}>Semana</button><button type="button" className={calendarView === 'month' ? 'active' : ''} onClick={() => setCalendarView('month')}>Mês</button></div>
        <div className="agenda-filters"><select value={studentFilter} onChange={(event) => setStudentFilter(event.target.value)}><option>Todos</option>{students.map((student) => <option value={student.id} key={student.id}>{student.name}</option>)}</select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as LessonStatus | 'Todos')}><option>Todos</option><option>Agendada</option><option>Concluída</option><option>Cancelada</option></select><button className="primary-button compact" onClick={() => onNew()}><Plus size={16} />Nova aula</button></div>
      </div>
    </section>

    {calendarView === 'week' ? <section className="week-grid">
      {weekDays.map((day) => {
        const dayLessons = weekVisible.filter((lesson) => lesson.date === toDateInput(day)).sort((a, b) => a.startTime.localeCompare(b.startTime));
        const isToday = toDateInput(day) === toDateInput(new Date());
        return <article className={`day-column${isToday ? ' today' : ''}`} key={day.toISOString()}>
          <header><span>{new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(day).replace('.', '')}</span><strong>{day.getDate()}</strong></header>
          <div className="day-lessons">{dayLessons.map((lesson) => <AgendaLessonCard key={lesson.id} lesson={lesson} student={students.find((student) => student.id === lesson.studentId)} onEdit={onEdit} onComplete={onComplete} onCancel={onCancel} />)}{!dayLessons.length && <button className="free-day" onClick={() => onNew(toDateInput(day))}>Livre</button>}</div>
        </article>;
      })}
    </section> : <>
      <section className="month-calendar panel">
        <div className="month-weekdays">{['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => <span key={day}>{day}</span>)}</div>
        <div className="month-grid">
          {monthDays.map((day) => {
            const date = toDateInput(day);
            const dayLessons = monthVisible.filter((lesson) => lesson.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime));
            const isToday = date === toDateInput(new Date());
            const outside = day.getMonth() !== calendarDate.getMonth();
            return <article className={`month-day${isToday ? ' today' : ''}${outside ? ' outside' : ''}`} key={date} onDoubleClick={() => onNew(date)}>
              <button className="month-day-number" onClick={() => dayLessons.length ? setExpandedDay(date) : onNew(date)} aria-label={`${day.getDate()} de ${new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(day)}`}>{day.getDate()}</button>
              <div className="month-day-lessons">
                {dayLessons.slice(0, 3).map((lesson) => {
                  const student = students.find((item) => item.id === lesson.studentId);
                  return <button key={lesson.id} className={`month-lesson-chip ${lesson.status.toLowerCase().replace('í', 'i')}`} onClick={() => onEdit(lesson)} title={`${lesson.startTime} · ${student?.name ?? 'Aluno'} · ${lesson.topic}`}><span>{lesson.startTime}</span><strong>{student?.name ?? 'Aluno'}</strong></button>;
                })}
                {dayLessons.length > 3 && <button className="month-more" onClick={() => setExpandedDay(date)}>+{dayLessons.length - 3} aula(s)</button>}
              </div>
              {!dayLessons.length && <button className="month-add-lesson" onClick={() => onNew(date)} aria-label="Agendar aula neste dia"><Plus size={14} /></button>}
            </article>;
          })}
        </div>
      </section>
      {expandedDay && <section className="panel month-day-details"><div className="panel-heading"><div><p className="eyebrow">DETALHES DO DIA</p><h3>{formatDate(expandedDay)}</h3></div><div className="month-detail-actions"><button className="secondary-button compact" onClick={() => onNew(expandedDay)}><Plus size={16} />Nova aula</button><button className="icon-button" onClick={() => setExpandedDay(null)} aria-label="Fechar detalhes"><X size={17} /></button></div></div>{selectedDayLessons.length ? <div className="month-detail-list">{selectedDayLessons.map((lesson) => <AgendaLessonCard key={lesson.id} lesson={lesson} student={students.find((student) => student.id === lesson.studentId)} onEdit={onEdit} onComplete={onComplete} onCancel={onCancel} />)}</div> : <p className="free-day-text">Nenhuma aula neste dia.</p>}</section>}
    </>}

    {!visible.length && <section className="panel empty-state small"><CalendarDays size={34} /><h3>Nenhuma aula neste {calendarView === 'week' ? 'período' : 'mês'}</h3><p>Ajuste os filtros ou agende uma nova aula.</p><button className="secondary-button compact" onClick={() => onNew()}><Plus size={16} />Nova aula</button></section>}
  </div>;
}

function AgendaLessonCard({ lesson, student, onEdit, onComplete, onCancel }: { lesson: ScheduledLesson; student?: Student; onEdit: (lesson: ScheduledLesson) => void; onComplete: (lesson: ScheduledLesson) => void; onCancel: (id: Id) => void }) {
  return <div className={`agenda-card ${lesson.status.toLowerCase().replace('í', 'i')}`}>
    <div className="agenda-time"><Clock3 size={13} />{lesson.startTime} · {lesson.duration} min</div><strong>{student?.name ?? 'Aluno removido'}</strong><span>{student?.level} · {lesson.topic}</span><em>{lesson.status}</em>
    {lesson.status !== 'Cancelada' && <div className="lesson-links">{lesson.onlineUrl && <a href={lesson.onlineUrl} target="_blank" rel="noreferrer" title="Abrir sala online"><Video size={13} />Abrir sala <ExternalLink size={10} /></a>}<a href={googleCalendarUrl(lesson, student)} target="_blank" rel="noreferrer" title="Adicionar ao Google Calendar"><CalendarPlus size={13} />Google</a></div>}
    {lesson.status === 'Agendada' && <div className="agenda-actions"><button title="Concluir aula" onClick={() => onComplete(lesson)}><Check size={14} /></button><button title="Editar aula" onClick={() => onEdit(lesson)}><Edit3 size={14} /></button><button title="Cancelar aula" onClick={() => onCancel(lesson.id)}><Ban size={14} /></button></div>}
  </div>;
}

function nextScheduledLessonForStudent(studentId: Id, schedule: ScheduledLesson[]) {
  return schedule
    .filter((lesson) => lesson.studentId === studentId && lesson.status === 'Agendada' && new Date(`${lesson.date}T${lesson.startTime}`) >= new Date())
    .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`))[0];
}

function formatNextLesson(lesson?: ScheduledLesson) {
  if (!lesson) return 'Não agendada';
  const date = new Date(`${lesson.date}T${lesson.startTime}`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const lessonDay = new Date(date);
  lessonDay.setHours(0, 0, 0, 0);
  const prefix = lessonDay.getTime() === today.getTime()
    ? 'Hoje'
    : lessonDay.getTime() === tomorrow.getTime()
      ? 'Amanhã'
      : date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '');
  return `${prefix}, ${lesson.startTime}`;
}

function StudentPanel({ students, schedule, onOpen }: { students: Student[]; schedule: ScheduledLesson[]; onOpen: (id: Id) => void }) { return <div className="panel large-panel"><div className="panel-heading"><div><p className="eyebrow">ACOMPANHAMENTO</p><h3>Meus alunos</h3></div></div><StudentList students={students} schedule={schedule} onOpen={onOpen} /></div>; }
function StudentList({ students, schedule = [], onOpen }: { students: Student[]; schedule?: ScheduledLesson[]; onOpen: (id: Id) => void }) { return <div className="student-list">{students.map((student) => { const nextLesson = nextScheduledLessonForStudent(student.id, schedule); return <article className="student-row" key={student.id}><div className="avatar">{initials(student.name)}</div><div className="student-main"><strong>{student.name}</strong><span>{student.level} · {student.goal}</span>{Boolean(student.currentStreak) && <small className="teacher-streak"><Flame size={12} />{student.currentStreak} dia(s) de sequência</small>}</div><Progress value={student.progress} /><div className="next-class"><span>Próxima aula</span><strong>{formatNextLesson(nextLesson)}</strong></div><button className="icon-button" onClick={() => onOpen(student.id)} aria-label={`Abrir perfil de ${student.name}`}><ChevronRight size={18} /></button></article>; })}</div>; }

function StudentProfile({ student, onNewLesson, onSkillChange, onEdit, onDelete, onPreview, onEditLesson, onDeleteLesson }: { student: Student; onNewLesson: () => void; onSkillChange: (skill: Skill, value: number) => void; onEdit: () => void; onDelete: () => void; onPreview: () => void; onEditLesson: (lesson: Lesson) => void; onDeleteLesson: (lesson: Lesson) => void }) {
  return <div className="profile-layout">
    <section className="panel student-summary"><div className="profile-identity"><div className="avatar large">{initials(student.name)}</div><div><span className="status-badge">{student.status}</span><h2>{student.name}</h2><p>{student.email}</p></div></div><div className="detail-grid"><Detail label="Nível" value={student.level} /><Detail label="Objetivo" value={student.goal} /><Detail label="Sequência atual" value={`${student.currentStreak ?? 0} dia(s)`} /><Detail label="Melhor sequência" value={`${student.bestStreak ?? 0} dia(s)`} /><Detail label="Conquistas" value={`${student.achievementCount ?? 0}/5`} /><Detail label="Idade" value={student.age || '—'} /><Detail label="Próxima aula" value={student.nextClass || 'Não agendada'} /></div><div className="note-box"><strong>Observações</strong><p>{student.notes || 'Nenhuma observação adicionada.'}</p></div><div className="student-profile-actions"><button className="secondary-button compact" onClick={onPreview}><Eye size={16} />Visualizar como aluno</button><button className="secondary-button compact" onClick={onEdit}><Edit3 size={16} />Editar perfil</button><button className="danger-button student-delete" onClick={onDelete}><Trash2 size={16} />Excluir aluno</button></div></section>
    <section className="panel"><div className="panel-heading"><div><p className="eyebrow">AVALIAÇÃO</p><h3>Progresso por habilidade</h3></div><strong className="overall-score">{student.progress}%</strong></div><div className="skill-list">{skills.map((skill) => <label className="skill-row" key={skill}><div><strong>{skill}</strong><span>{student.skills[skill]}%</span></div><input type="range" min="0" max="100" value={student.skills[skill]} onChange={(e) => onSkillChange(skill, Number(e.target.value))} /></label>)}</div></section>
    <section className="panel lessons-panel"><div className="panel-heading"><div><p className="eyebrow">HISTÓRICO</p><h3>Aulas registradas</h3></div><button className="secondary-button compact" onClick={onNewLesson}><Plus size={16} />Registrar aula</button></div>{student.lessons.length ? <div className="lesson-list">{student.lessons.map((lesson) => <article className="lesson-card" key={lesson.id}><time>{formatDate(lesson.date)}</time><div><div className="lesson-card-heading"><strong>{lesson.topic}</strong><span>{lesson.startTime ?? 'Aula registrada'}</span></div>{lesson.notes && <p>{lesson.notes}</p>}<div className="lesson-feedback-grid"><div><span>Pontos fortes</span><p>{lesson.strengths || 'Ainda não informado.'}</p></div><div><span>Pontos a melhorar</span><p>{lesson.improvements || 'Ainda não informado.'}</p></div></div><div className="lesson-meta">{lesson.attendance && <span>Presença: {lesson.attendance}</span>}{lesson.homework && <small>Tarefa: {lesson.homework}</small>}</div><div className="lesson-card-actions"><button type="button" onClick={() => onEditLesson(lesson)}><Edit3 size={14} />Editar</button><button type="button" className="danger" onClick={() => onDeleteLesson(lesson)}><Trash2 size={14} />Excluir</button></div></div></article>)}</div> : <div className="empty-state small"><CalendarDays size={32} /><h3>Nenhuma aula registrada</h3><p>Registre a primeira aula deste aluno.</p></div>}</section>
  </div>;
}

function StudentModal({ onClose, onSave, defaultDuration, defaultOnlineUrl }: { onClose: () => void; onSave: (data: StudentCreateInput) => Promise<void>; defaultDuration: number; defaultOnlineUrl: string }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      await onSave({ name: String(form.get('name')), email: String(form.get('email')), age: String(form.get('age') || ''), level: String(form.get('level')), goal: String(form.get('goal')), status: 'Ativo', notes: String(form.get('notes')), firstLessonDate: String(form.get('firstLessonDate') || ''), firstLessonTime: String(form.get('firstLessonTime') || ''), firstLessonDuration: Number(form.get('firstLessonDuration') || defaultDuration), firstLessonTopic: String(form.get('firstLessonTopic') || ''), firstLessonOnlineUrl: String(form.get('firstLessonOnlineUrl') || '') });
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Não foi possível criar a conta do aluno.'); setBusy(false); }
  };
  return <Modal title="Cadastrar novo aluno" onClose={onClose}><form className="form-grid" onSubmit={submit}><div className="auth-message full-field">O aluno receberá uma conta com senha temporária para acessar o portal.</div><Field name="name" label="Nome completo" required /><Field name="email" label="E-mail" type="email" required /><Field name="age" label="Idade" type="number" min="1" max="120" /><SelectField name="level" label="Nível" options={['A1', 'A2', 'B1', 'B2', 'C1', 'C2']} /><Field name="goal" label="Objetivo" placeholder="Conversação, viagem..." required /><label className="full-field">Observações<textarea name="notes" rows={3} placeholder="Necessidades, interesses e pontos importantes" /></label><div className="form-section-title full-field"><strong>Primeira aula (opcional)</strong><span>Ao preencher data, horário e tema, a aula será salva na agenda.</span></div><Field name="firstLessonDate" label="Data" type="date" /><Field name="firstLessonTime" label="Horário" type="time" /><Field name="firstLessonTopic" label="Tema da aula" placeholder="Ex.: Aula de diagnóstico" /><label>Duração<select name="firstLessonDuration" defaultValue={defaultDuration}><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="50">50 minutos</option><option value="60">60 minutos</option><option value="90">90 minutos</option></select></label><Field name="firstLessonOnlineUrl" label="Link da aula online" type="url" defaultValue={defaultOnlineUrl} placeholder="https://meet.google.com/..." />{error && <div className="auth-message full-field">{error}</div>}<div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button" type="submit" disabled={busy}>{busy ? 'Criando conta...' : 'Salvar e criar acesso'}</button></div></form></Modal>;
}

function StudentEditModal({ student, onClose, onSave }: { student: Student; onClose: () => void; onSave: (student: Student) => Promise<void> }) {
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(''); const form = new FormData(event.currentTarget); try { await onSave({ ...student, name: String(form.get('name')), age: String(form.get('age') || ''), level: String(form.get('level')), goal: String(form.get('goal')), status: String(form.get('status')) as Student['status'], notes: String(form.get('notes')) }); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Não foi possível atualizar o perfil.'); setBusy(false); } };
  return <Modal title={`Editar perfil · ${student.name}`} onClose={onClose}><form className="form-grid" onSubmit={submit}><Field name="name" label="Nome completo" defaultValue={student.name} required /><Field name="email" label="E-mail de acesso" type="email" defaultValue={student.email} disabled /><Field name="age" label="Idade" type="number" min="1" max="120" defaultValue={student.age} /><label>Nível<select name="level" defaultValue={student.level}>{['A1','A2','B1','B2','C1','C2'].map((level) => <option key={level}>{level}</option>)}</select></label><Field name="goal" label="Objetivo" defaultValue={student.goal} required /><label>Status<select name="status" defaultValue={student.status}><option>Ativo</option><option>Pausado</option></select></label><label className="full-field">Observações<textarea name="notes" rows={4} defaultValue={student.notes} /></label>{error && <div className="auth-message full-field">{error}</div>}<div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={busy}>{busy ? 'Salvando...' : 'Salvar alterações'}</button></div></form></Modal>;
}

function TemporaryAccessModal({ access, onClose }: { access: { name: string; email: string; password: string }; onClose: () => void }) {
  const accessUrl = window.location.origin;
  const accessMessage = `Olá, ${access.name}! Tudo bem?

Seu acesso ao LangSpot já foi criado. A plataforma será nosso espaço para acompanhar aulas, materiais, tarefas, metas, flashcards e seu progresso nos estudos.

Acesse por aqui:
${accessUrl}

Dados de acesso:
E-mail: ${access.email}
Senha temporária: ${access.password}

Como entrar pela primeira vez:
1. Acesse o link acima.
2. Clique em entrar.
3. Use o e-mail e a senha temporária.
4. No primeiro acesso, você poderá atualizar seus dados e trocar sua foto de perfil.
5. Depois disso, use o menu do portal para acompanhar suas aulas, tarefas, materiais, metas e flashcards.

Dica:
Salve o link nos favoritos ou na tela inicial do celular para acessar mais rápido.

Se tiver qualquer dificuldade para entrar, me avise que eu te ajudo.`;
  const copy = () => navigator.clipboard.writeText(accessMessage);
  return <Modal title="Acesso do aluno criado" onClose={onClose}><div className="temporary-access"><p>Envie este tutorial para <strong>{access.name}</strong>. A senha será solicitada apenas no primeiro acesso e não ficará disponível novamente.</p><div><span>E-mail</span><strong>{access.email}</strong></div><div><span>Senha temporária</span><strong>{access.password}</strong></div><div className="access-message-preview"><span>Mensagem que será copiada</span><pre>{accessMessage}</pre></div><button className="primary-button" onClick={copy}><Copy size={16} />Copiar tutorial de acesso</button></div><div className="form-actions"><button className="cancel-button" onClick={onClose}>Concluir</button></div></Modal>;
}

function LessonModal({ studentName, onClose, onSave }: { studentName: string; onClose: () => void; onSave: (lesson: Omit<Lesson, 'id'>) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); onSave({ date: String(form.get('date')), topic: String(form.get('topic')), notes: String(form.get('notes')), strengths: String(form.get('strengths')), improvements: String(form.get('improvements')), homework: String(form.get('homework')) }); };
  return <Modal title={`Registrar aula · ${studentName}`} onClose={onClose}><form className="form-grid" onSubmit={submit}><Field name="date" label="Data" type="date" required /><Field name="topic" label="Tema da aula" required /><label className="full-field">Resumo da aula<textarea name="notes" rows={7} defaultValue={lessonRecordTemplate.notes} placeholder="Conteúdo trabalhado e contexto geral" /></label><label className="full-field">Pontos fortes<textarea name="strengths" rows={7} defaultValue={lessonRecordTemplate.strengths} placeholder="O que o aluno fez bem, avanços e conquistas" /></label><label className="full-field">Pontos a melhorar<textarea name="improvements" rows={7} defaultValue={lessonRecordTemplate.improvements} placeholder="Dificuldades, próximos focos e ajustes necessários" /></label><label className="full-field">Tarefa de casa<textarea name="homework" rows={6} defaultValue={lessonRecordTemplate.homework} placeholder="Atividade para a próxima aula" /></label><div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button" type="submit">Registrar aula</button></div></form></Modal>;
}

function ScheduleLessonModal({ students, lesson, onClose, onSave }: { students: Student[]; lesson?: ScheduledLesson; onClose: () => void; onSave: (lesson: ScheduledLessonInput) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); onSave({ studentId: String(form.get('studentId')), date: String(form.get('date')), startTime: String(form.get('startTime')), duration: Number(form.get('duration')), topic: String(form.get('topic')), onlineUrl: String(form.get('onlineUrl')).trim() }); };
  return <Modal title={lesson ? 'Editar aula' : 'Agendar nova aula'} onClose={onClose}><form className="form-grid" onSubmit={submit}><label>Aluno<select name="studentId" defaultValue={lesson?.studentId ?? students[0]?.id} required>{students.map((student) => <option value={student.id} key={student.id}>{student.name} · {student.level}</option>)}</select></label><Field name="topic" label="Tema da aula" defaultValue={lesson?.topic} required /><Field name="date" label="Data" type="date" defaultValue={lesson?.date ?? toDateInput(new Date())} required /><Field name="startTime" label="Horário" type="time" defaultValue={lesson?.startTime ?? '14:00'} required /><label>Duração<select name="duration" defaultValue={lesson?.duration ?? 60}><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="50">50 minutos</option><option value="60">60 minutos</option><option value="90">90 minutos</option></select></label><Field name="onlineUrl" label="Link da aula online" type="url" defaultValue={lesson?.onlineUrl} placeholder="https://meet.google.com/..." /><div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button" type="submit">{lesson ? 'Salvar alterações' : 'Agendar aula'}</button></div></form></Modal>;
}

function CompleteLessonModal({ lesson, student, onClose, onSave }: { lesson: ScheduledLesson; student?: Student; onClose: () => void; onSave: (record: LessonRecordInput) => void }) {
  return <LessonRecordForm title={`Concluir aula · ${student?.name ?? 'Aluno'}`} lesson={scheduledToHistory(lesson)} student={student} submitLabel="Concluir e registrar" submitIcon={<Check size={17} />} onClose={onClose} onSave={onSave} />;
}

function LessonRecordModal({ lesson, student, onClose, onSave }: { lesson: Lesson; student: Student; onClose: () => void; onSave: (record: LessonRecordInput) => void | Promise<void> }) {
  return <LessonRecordForm title={`Editar registro · ${student.name}`} lesson={lesson} student={student} submitLabel="Salvar registro" submitIcon={<Save size={17} />} onClose={onClose} onSave={onSave} />;
}

const lessonRecordTemplate = {
  notes: 'Conteúdo trabalhado:\n- \n\nAtividades realizadas:\n- \n\nParticipação e comportamento durante a aula:\n- ',
  strengths: 'O aluno demonstrou bom desempenho em:\n- \n\nEvoluções percebidas:\n- \n\nExemplos observados na aula:\n- ',
  improvements: 'Pontos que precisam de reforço:\n- \n\nEstratégia sugerida para as próximas aulas:\n- \n\nObservações para acompanhamento:\n- ',
  homework: 'Atividade para casa:\n- \n\nObjetivo da tarefa:\n- \n\nOrientações para entrega ou prática:\n- ',
};

function LessonRecordForm({ title, lesson, student, submitLabel, submitIcon, onClose, onSave }: { title: string; lesson: Lesson; student?: Student; submitLabel: string; submitIcon: ReactNode; onClose: () => void; onSave: (record: LessonRecordInput) => void | Promise<void> }) {
  const [attendance, setAttendance] = useState<AttendanceStatus>(lesson.attendance ?? 'Presente');
  const [skillScores, setSkillScores] = useState<Record<Skill, number>>(() => ({ ...(student?.skills ?? defaultSkills()), ...(lesson.skillScores ?? {}) }));
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    await onSave({
      date: String(form.get('date')),
      startTime: String(form.get('startTime') || lesson.startTime || '12:00'),
      duration: Number(form.get('duration') || lesson.duration || 60),
      topic: String(form.get('topic')),
      onlineUrl: String(form.get('onlineUrl') || '').trim(),
      notes: String(form.get('notes')),
      strengths: String(form.get('strengths')),
      improvements: String(form.get('improvements')),
      homework: String(form.get('homework')),
      attendance,
      skillScores,
    });
  };
  return <Modal title={title} onClose={onClose}><div className="completion-summary"><CalendarDays size={18} /><div><strong>{lesson.topic || 'Aula'}</strong><span>{formatDate(lesson.date)}{lesson.startTime ? ` às ${lesson.startTime}` : ''}</span></div></div><form className="form-grid" onSubmit={submit}><Field name="date" label="Data" type="date" defaultValue={lesson.date} required /><Field name="startTime" label="Horário" type="time" defaultValue={lesson.startTime ?? '12:00'} required /><label>Duração<select name="duration" defaultValue={lesson.duration ?? 60}><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="50">50 minutos</option><option value="60">60 minutos</option><option value="90">90 minutos</option></select></label><label>Presença<select value={attendance} onChange={(event) => setAttendance(event.target.value as AttendanceStatus)}><option>Presente</option><option>Ausente</option><option>Remarcada</option></select></label><Field name="topic" label="Tema da aula" defaultValue={lesson.topic} required /><Field name="onlineUrl" label="Link da aula online" type="url" defaultValue={lesson.onlineUrl} placeholder="https://meet.google.com/..." /><label className="full-field">Resumo da aula<textarea name="notes" rows={7} defaultValue={lesson.notes || lessonRecordTemplate.notes} placeholder="Conteúdo trabalhado e contexto geral" /></label><label className="full-field">Pontos fortes<textarea name="strengths" rows={7} defaultValue={lesson.strengths || lessonRecordTemplate.strengths} placeholder="O que o aluno fez bem, avanços e conquistas" /></label><label className="full-field">Pontos a melhorar<textarea name="improvements" rows={7} defaultValue={lesson.improvements || lessonRecordTemplate.improvements} placeholder="Dificuldades, próximos focos e ajustes necessários" /></label><label className="full-field">Tarefa de casa<textarea name="homework" rows={6} defaultValue={lesson.homework || lessonRecordTemplate.homework} placeholder="Atividade para a próxima aula" /></label><div className="full-field completion-skills"><div><strong>Avaliação rápida</strong><span>Atualize as habilidades observadas nesta aula.</span></div>{skills.map((skill) => <label className="skill-row" key={skill}><div><strong>{skill}</strong><span>{skillScores[skill]}%</span></div><input type="range" min="0" max="100" value={skillScores[skill]} onChange={(event) => setSkillScores((current) => ({ ...current, [skill]: Number(event.target.value) }))} /></label>)}</div><div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Voltar</button><button className="primary-button" type="submit" disabled={busy}>{busy ? 'Salvando...' : <>{submitIcon}{submitLabel}</>}</button></div></form></Modal>;
}

function ConfirmLessonDelete({ lesson, onClose, onConfirm }: { lesson: Lesson; onClose: () => void; onConfirm: () => void }) {
  return <Modal title="Excluir registro de aula" onClose={onClose}><div className="delete-warning"><div className="delete-warning-icon"><Trash2 size={22} /></div><div><strong>Excluir “{lesson.topic}”?</strong><p>O registro de {formatDate(lesson.date)} será removido do histórico do aluno. Esta ação não pode ser desfeita.</p></div></div><div className="form-actions"><button className="cancel-button" onClick={onClose}>Manter registro</button><button className="danger-button" onClick={onConfirm}><Trash2 size={16} />Excluir registro</button></div></Modal>;
}

function DeleteStudentModal({ student, scheduledLessons, onClose, onConfirm }: { student: Student; scheduledLessons: number; onClose: () => void; onConfirm: () => void }) {
  return <Modal title="Excluir aluno" onClose={onClose}><div className="delete-warning"><div className="delete-warning-icon"><Trash2 size={22} /></div><div><strong>Excluir {student.name} permanentemente?</strong><p>O perfil, {student.lessons.length} aula(s) do histórico e {scheduledLessons} aula(s) agendada(s) serão removidos. Esta ação não pode ser desfeita.</p></div></div><div className="form-actions"><button className="cancel-button" onClick={onClose}>Manter aluno</button><button className="danger-button" onClick={onConfirm}><Trash2 size={16} />Excluir aluno</button></div></Modal>;
}

function MaterialModal({ onClose, onSave }: { onClose: () => void; onSave: (material: MaterialInput) => void | Promise<void> }) {
  const [mode, setMode] = useState<'link' | 'upload'>('link');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (mode === 'upload' && !file) { setError('Selecione um arquivo PDF.'); return; }
    if (file && (file.type !== 'application/pdf' || file.size > 10 * 1024 * 1024)) { setError('Escolha um PDF de até 10 MB.'); return; }
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await onSave({ title: String(form.get('title')), type: mode === 'upload' ? 'PDF' : String(form.get('type')) as MaterialType, level: String(form.get('level')), skill: String(form.get('skill')) as Skill, url: mode === 'link' ? String(form.get('url')) : '', description: String(form.get('description')), source: mode, file: file ?? undefined });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível salvar o material.');
      setBusy(false);
    }
  };
  return <Modal title="Adicionar material" onClose={onClose}><form className="form-grid" onSubmit={submit}><div className="material-source-tabs full-field"><button type="button" className={mode === 'link' ? 'active' : ''} onClick={() => { setMode('link'); setFile(null); }}><ExternalLink size={16} />Adicionar link</button><button type="button" className={mode === 'upload' ? 'active' : ''} onClick={() => setMode('upload')}><FileText size={16} />Enviar PDF</button></div><Field name="title" label="Título" placeholder="Ex.: Past Simple Review" required /><label>Tipo<select name="type" disabled={mode === 'upload'} defaultValue={mode === 'upload' ? 'PDF' : 'Link'}><option>PDF</option><option>Vídeo</option><option>Áudio</option><option>Link</option><option>Atividade</option></select></label><label>Nível<select name="level"><option>Todos</option><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option></select></label><label>Habilidade<select name="skill">{skills.map((skill) => <option key={skill}>{skill}</option>)}</select></label>{mode === 'link' ? <Field name="url" label="Link do material" type="url" placeholder="https://..." required /> : <label className="full-field pdf-upload-field"><span>Arquivo PDF</span><input type="file" accept="application/pdf,.pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required />{file && <small>{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</small>}<em>Somente PDF, com tamanho máximo de 10 MB.</em></label>}<label className="full-field">Descrição<textarea name="description" rows={4} placeholder="Como este material pode ser utilizado na aula?" /></label>{error && <div className="auth-message full-field">{error}</div>}<div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button" type="submit" disabled={busy}><Plus size={17} />{busy ? 'Enviando...' : mode === 'upload' ? 'Enviar PDF' : 'Adicionar material'}</button></div></form></Modal>;
}

function AssignMaterialModal({ material, students, onClose, onSave }: { material: Material; students: Student[]; onClose: () => void; onSave: (studentIds: Id[]) => void }) {
  const [selected, setSelected] = useState<Id[]>(material.assignedStudentIds ?? []);
  const toggle = (id: Id) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  return <Modal title="Compartilhar material" onClose={onClose}><div className="assignment-copy"><strong>{material.title}</strong><p>Selecione os alunos que poderão acessar este material no portal.</p></div><div className="assignment-student-list">{students.length ? students.map((student) => <label key={student.id}><input type="checkbox" checked={selected.includes(student.id)} onChange={() => toggle(student.id)} /><span className="avatar">{initials(student.name)}</span><div><strong>{student.name}</strong><small>{student.level} · {student.goal}</small></div></label>) : <div className="empty-state small"><UsersRound size={30} /><h3>Nenhum aluno cadastrado</h3></div>}</div><div className="form-actions"><button className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button" onClick={() => onSave(selected)}><UsersRound size={16} />Compartilhar com {selected.length}</button></div></Modal>;
}

function DeleteMaterialModal({ material, onClose, onConfirm }: { material: Material; onClose: () => void; onConfirm: () => void }) {
  return <Modal title="Excluir material" onClose={onClose}><div className="delete-warning"><div className="delete-warning-icon"><Trash2 size={22} /></div><div><strong>Excluir “{material.title}”?</strong><p>O material será removido da sua biblioteca. O conteúdo original no link externo não será alterado.</p></div></div><div className="form-actions"><button className="cancel-button" onClick={onClose}>Manter material</button><button className="danger-button" onClick={onConfirm}><Trash2 size={16} />Excluir material</button></div></Modal>;
}

function Modal({ title, onClose, children, className = '' }: { title: string; onClose: () => void; children: React.ReactNode; className?: string }) { return <div className="modal-backdrop" onMouseDown={onClose}><section className={`modal ${className}`.trim()} onMouseDown={(e) => e.stopPropagation()}><div className="modal-header"><h2>{title}</h2><button className="icon-button" onClick={onClose}><X size={18} /></button></div>{children}</section></div>; }
function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) { return <label>{label}<input {...props} /></label>; }
function SelectField({ name, label, options }: { name: string; label: string; options: string[] }) { return <label>{label}<select name={name}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }

function AssignmentsPage({ assignments, students, mode, onNew, onManageBank, onDelete, onReview }: { assignments: Assignment[]; students: Student[]; mode: 'tasks' | 'quiz'; onNew: () => void; onManageBank?: () => void; onDelete: (assignment: Assignment) => void; onReview: (assignment: Assignment) => void }) {
  const [openAssignmentId, setOpenAssignmentId] = useState<Id | null>(null);
  const [previewAssignment, setPreviewAssignment] = useState<Assignment | null>(null);
  const ordered = [...assignments].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const studentName = (id: Id) => students.find((student) => student.id === id)?.name ?? 'Aluno';
  const statusCount = (status: AssignmentStatus) => assignments.filter((assignment) => assignment.status === status).length;
  const copy = mode === 'quiz'
    ? { eyebrow: 'QUIZ', title: 'Quizzes interativos', description: 'Crie atividades objetivas, acompanhe tentativas e revise os resultados.', button: 'Novo quiz', open: 'Abrir quiz', emptyTitle: 'Nenhum quiz criado', emptyText: 'Crie quizzes interativos para os alunos responderem na plataforma.', emptyButton: 'Criar primeiro quiz', review: 'Corrigir quiz', icon: FileQuestion }
    : { eyebrow: 'ATIVIDADES', title: 'Tarefas e entregas', description: 'Acompanhe prazos, respostas e correções dos alunos.', button: 'Nova tarefa', open: 'Abrir tarefa', emptyTitle: 'Nenhuma tarefa criada', emptyText: 'Crie atividades com prazo e acompanhe as entregas dos alunos.', emptyButton: 'Criar primeira tarefa', review: 'Corrigir tarefa', icon: ClipboardList };
  const deliveredLabel = mode === 'quiz' ? 'Realizados' : 'Entregues';
  const reviewedLabel = mode === 'quiz' ? 'Corrigidos' : 'Corrigidas';
  const EmptyIcon = copy.icon;
  return <>
    <div className="assignment-summary-grid">
      <article><ClipboardList size={18} /><span>Pendentes</span><strong>{statusCount('Pendente')}</strong></article>
      <article><Clock3 size={18} /><span>{deliveredLabel}</span><strong>{statusCount('Entregue')}</strong></article>
      <article><Check size={18} /><span>{reviewedLabel}</span><strong>{statusCount('Corrigida')}</strong></article>
    </div>
    <section className="panel assignments-panel">
      <div className="panel-heading assignments-heading"><div><p className="eyebrow">{copy.eyebrow}</p><h3>{copy.title}</h3><p>{copy.description}</p></div><div className="assignment-heading-actions">{mode === 'quiz' && onManageBank && <button className="secondary-button compact" onClick={onManageBank}><FolderOpen size={16} />Banco de questões</button>}<button className="secondary-button compact" onClick={onNew}><Plus size={16} />{copy.button}</button></div></div>
      {ordered.length ? <div className="assignment-board">{ordered.map((assignment) => { const isOpen = openAssignmentId === assignment.id; return <article className={`assignment-card ${isOpen ? 'open' : ''}`} key={assignment.id}>
        <div className="assignment-card-top">
          <div className="assignment-card-title"><div className="assignment-status-line"><span className={`assignment-status ${assignment.status.toLowerCase()}`}>{assignment.status}</span><span className="assignment-student-name">{studentName(assignment.studentId)}</span>{assignment.assignmentType === 'interactive' && <span className="assignment-kind-badge"><FileQuestion size={12} />Interativa</span>}</div><h3>{assignment.title}</h3><p>{assignment.instructions}</p></div>
          <div className="assignment-card-meta"><div className="assignment-due"><span>Prazo</span><strong>{new Date(`${assignment.dueDate}T12:00:00`).toLocaleDateString('pt-BR')}</strong></div><button type="button" onClick={() => setOpenAssignmentId(isOpen ? null : assignment.id)}>{isOpen ? 'Fechar' : copy.open}</button></div>
        </div>
        {isOpen && <div className="assignment-card-details"><div className="assignment-instructions"><span>Instruções</span><p>{assignment.instructions}</p></div>
        {(assignment.submissionText || assignment.submissionFileUrl || assignment.interactiveResult) && <div className="submission-preview"><strong>Resposta do aluno</strong>{assignment.interactiveResult && <p>Resultado do quiz: {interactiveResultSummary(assignment.interactiveResult)}</p>}{assignment.submissionText && <p>{assignment.submissionText}</p>}{assignment.submissionFileUrl && <a className="submission-file-link" href={assignment.submissionFileUrl} target="_blank" rel="noreferrer"><FileText size={15} />{assignment.submissionFileName || 'PDF anexado'}<ExternalLink size={13} /></a>}</div>}
        {assignment.feedback && <div className="feedback-preview"><strong>Feedback</strong><p>{assignment.feedback}</p>{assignment.grade !== undefined && <span className="assignment-grade">Nota: {assignment.grade}</span>}</div>}</div>}
        <div className="assignment-card-actions">{mode === 'quiz' && assignment.assignmentType === 'interactive' && <button className="assignment-preview-button" onClick={() => setPreviewAssignment(assignment)}><Eye size={15} />Pré-visualizar</button>}{assignment.status === 'Entregue' && <button className="assignment-review-button" onClick={() => onReview(assignment)}><Check size={15} />{copy.review}</button>}<button className="assignment-delete-button" onClick={() => onDelete(assignment)} aria-label={`Excluir ${assignment.title}`}><Trash2 size={15} />Excluir</button></div>
      </article>; })}</div> : <div className="empty-state"><EmptyIcon size={38} /><h3>{copy.emptyTitle}</h3><p>{copy.emptyText}</p><button className="primary-button" onClick={onNew}><Plus size={16} />{copy.emptyButton}</button></div>}
    </section>
    {previewAssignment && <QuizPreviewModal assignment={previewAssignment} onClose={() => setPreviewAssignment(null)} />}
  </>;
}

function AssignmentModal({ students, materials, questionBank, mode, onClose, onSave }: { students: Student[]; materials: Material[]; questionBank: QuestionBankItem[]; mode: AssignmentFormMode; onClose: () => void; onSave: (input: AssignmentInput) => void }) {
  const [assignmentType] = useState<'regular' | 'interactive'>(mode === 'interactive' ? 'interactive' : 'regular');
  const [questionCount, setQuestionCount] = useState(1);
  const [questionTypes, setQuestionTypes] = useState<Record<number, InteractiveQuestionType>>({});
  const [bankLevel, setBankLevel] = useState<QuestionBankLevel>('A1');
  const [autoQuestionCount, setAutoQuestionCount] = useState(5);
  const [selectedBankQuestions, setSelectedBankQuestions] = useState<QuestionBankItem[]>([]);
  const [aiTopic, setAiTopic] = useState('');
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<InteractiveQuestion[]>([]);
  const typeFor = (index: number) => questionTypes[index] ?? 'multiple_choice';
  const changeQuestionType = (index: number, type: InteractiveQuestionType) => setQuestionTypes((current) => ({ ...current, [index]: type }));
  const bankQuestions = questionBank.filter((question) => question.level === bankLevel && question.category === 'Grammar');
  const addBankQuestion = (question: QuestionBankItem) => setSelectedBankQuestions((current) => current.some((item) => item.id === question.id) ? current : [...current, question]);
  const removeBankQuestion = (id: Id) => setSelectedBankQuestions((current) => current.filter((item) => item.id !== id));
  const removeAiQuestion = (id: Id) => setAiQuestions((current) => current.filter((item) => item.id !== id));
  const buildAutomaticQuiz = () => {
    if (!bankQuestions.length) { window.alert(`Nenhuma questão Grammar cadastrada para ${bankLevel}.`); return; }
    const count = Math.max(1, Math.min(autoQuestionCount, bankQuestions.length));
    const shuffled = [...bankQuestions].sort(() => Math.random() - 0.5);
    setSelectedBankQuestions(shuffled.slice(0, count));
  };
  const generateAiQuestions = async () => {
    if (!supabase) { window.alert('Configure o Supabase para usar a geração com IA.'); return; }
    const topic = aiTopic.trim();
    if (!topic) { window.alert('Informe um tema para a IA gerar as questões.'); return; }
    setAiBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', { body: { topic, level: bankLevel, count: aiQuestionCount, category: 'Grammar' } });
      if (error) throw new Error(await functionInvokeErrorMessage(error, data));
      const questions = ((data as { questions?: InteractiveQuestion[] } | null)?.questions ?? []).map((question) => ({ ...question, id: question.id || crypto.randomUUID() }));
      if (!questions.length) throw new Error('A IA não retornou questões válidas.');
      setAiQuestions((current) => [...current, ...questions]);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Não foi possível gerar questões com IA.');
    } finally {
      setAiBusy(false);
    }
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const interactiveContent = assignmentType === 'interactive' ? buildInteractiveContent(form, questionCount, selectedBankQuestions, aiQuestions) : null;
    if (assignmentType === 'interactive' && !(interactiveContent?.questions.length)) { window.alert('Adicione pelo menos uma pergunta com enunciado e gabarito.'); return; }
    onSave({ studentId: String(form.get('studentId')), materialId: String(form.get('materialId') || '') || undefined, title: String(form.get('title')), instructions: String(form.get('instructions')), dueDate: String(form.get('dueDate')), assignmentType, interactiveContent });
  };
  return <Modal title={mode === 'interactive' ? 'Novo quiz' : 'Nova tarefa'} onClose={onClose}><form className="form-grid" onSubmit={submit}>
    <label>Aluno<select name="studentId" required defaultValue=""><option value="" disabled>Selecione</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>
    <label>Prazo<input name="dueDate" type="date" required min={toDateInput(new Date())} /></label>
    <label className="full-field">Título<input name="title" required placeholder={mode === 'interactive' ? 'Ex.: Present Perfect Quiz' : 'Ex.: Writing Practice'} /></label>
    <label className="full-field">Material vinculado <span>(opcional)</span><select name="materialId"><option value="">Nenhum</option>{materials.map((material) => <option key={material.id} value={material.id}>{material.title}</option>)}</select></label>
    <label className="full-field">Instruções<textarea name="instructions" rows={4} required placeholder={assignmentType === 'interactive' ? 'Ex.: Responda as questões abaixo.' : 'Explique o que o aluno deve fazer e como entregar.'} /></label>
    {assignmentType === 'interactive' && <div className="interactive-builder full-field"><div><strong>Configurações do quiz</strong><span>Defina tentativas e quando o aluno verá o gabarito.</span></div><div className="interactive-options-grid"><label>Tentativas permitidas<select name="interactiveMaxAttempts" defaultValue="1"><option value="1">1 tentativa</option><option value="2">2 tentativas</option><option value="3">3 tentativas</option><option value="0">Ilimitadas</option></select></label><label>Mostrar gabarito<select name="interactiveRevealAnswers" defaultValue="after_each"><option value="after_each">Depois de cada envio</option><option value="after_last">Apenas na última tentativa</option></select></label></div>
      <section className="ai-quiz-generator"><div><strong>Gerar com IA</strong><span>Crie um rascunho de questões de Grammar por tema e nível. Revise antes de enviar ao aluno.</span></div><div className="ai-quiz-controls"><label>Tema<input value={aiTopic} onChange={(event) => setAiTopic(event.target.value)} placeholder="Ex.: Present perfect with travel experiences" /></label><label>Quantidade<input type="number" min="1" max="20" value={aiQuestionCount} onChange={(event) => setAiQuestionCount(Math.max(1, Math.min(20, Number(event.target.value) || 1)))} /></label><button type="button" className="primary-button" disabled={aiBusy} onClick={generateAiQuestions}>{aiBusy ? <LoaderCircle className="spin" size={15} /> : <Sparkles size={15} />}{aiBusy ? 'Gerando...' : 'Gerar questões'}</button></div>{aiQuestions.length > 0 && <div className="quiz-bank-selected ai-generated-list"><strong>Questões geradas com IA</strong>{aiQuestions.map((question) => <span key={question.id}>IA · {questionTypeLabel(question.type)} · {question.prompt}<button type="button" onClick={() => removeAiQuestion(question.id)}><X size={12} /></button></span>)}</div>}</section>
      <section className="quiz-bank-picker"><div><strong>Banco de questões</strong><span>Use questões salvas por nível. Categoria disponível agora: Grammar.</span></div><div className="quiz-bank-toolbar"><label>Nível<select value={bankLevel} onChange={(event) => setBankLevel(event.target.value as QuestionBankLevel)}>{questionBankLevels.map((level) => <option key={level}>{level}</option>)}</select></label><label>Categoria<select value="Grammar" disabled><option>Grammar</option></select></label><span>{selectedBankQuestions.length} selecionada(s)</span></div><div className="quiz-auto-builder"><div><strong>Montagem automática</strong><small>Escolha a quantidade e deixe a plataforma sortear questões deste nível.</small></div><label>Quantidade<input type="number" min="1" value={autoQuestionCount} onChange={(event) => setAutoQuestionCount(Number(event.target.value) || 1)} /></label><button type="button" className="primary-button" onClick={buildAutomaticQuiz}><Sparkles size={15} />Montar quiz</button></div>{bankQuestions.length ? <div className="quiz-bank-list">{bankQuestions.slice(0, 8).map((question) => { const selected = selectedBankQuestions.some((item) => item.id === question.id); return <article key={question.id}><div><small>{question.level} · {question.category} · {questionTypeLabel(question.type)}</small><strong>{question.prompt}</strong></div><button type="button" disabled={selected} onClick={() => addBankQuestion(question)}>{selected ? <Check size={14} /> : <Plus size={14} />}{selected ? 'Adicionada' : 'Adicionar'}</button></article>; })}</div> : <p className="quiz-bank-empty">Nenhuma questão Grammar cadastrada para {bankLevel} ainda.</p>}{selectedBankQuestions.length > 0 && <div className="quiz-bank-selected"><strong>Questões adicionadas ao quiz</strong>{selectedBankQuestions.map((question) => <span key={question.id}>{question.level} · {question.prompt}<button type="button" onClick={() => removeBankQuestion(question.id)}><X size={12} /></button></span>)}</div>}</section>
      <section className="manual-questions-heading"><div><FileQuestion size={18} /><div><strong>Questões manuais</strong><span>Adicione perguntas específicas para este quiz ou combine com as questões do banco.</span></div></div><em>{questionCount} questão(ões)</em></section>{Array.from({ length: questionCount }).map((_, index) => {
      const currentType = typeFor(index);
      return <fieldset key={index}><legend>Questão {index + 1}</legend>
        <label>Tipo da pergunta<select name={`question-${index}-type`} value={currentType} onChange={(event) => changeQuestionType(index, event.target.value as InteractiveQuestionType)}><option value="multiple_choice">Múltipla escolha</option><option value="fill_blank">Complete a frase</option><option value="true_false">Verdadeiro ou falso</option><option value="ordering">Ordenar palavras/frases</option></select></label>
        <label>Enunciado<input name={`question-${index}`} placeholder={currentType === 'ordering' ? 'Ex.: Ordene as palavras para formar uma frase.' : 'Ex.: I ___ never been to Canada.'} /></label>
        {currentType === 'multiple_choice' && <><div className="interactive-options-grid">{['A', 'B', 'C', 'D'].map((option) => <label key={option}>Alternativa {option}<input name={`question-${index}-option-${option}`} placeholder={option === 'A' ? 'have' : option === 'B' ? 'did' : ''} /></label>)}</div><label>Gabarito<select name={`question-${index}-answer`} defaultValue="A"><option>A</option><option>B</option><option>C</option><option>D</option></select></label></>}
        {currentType === 'true_false' && <label>Gabarito<select name={`question-${index}-answer`} defaultValue="Verdadeiro"><option>Verdadeiro</option><option>Falso</option></select></label>}
        {currentType === 'fill_blank' && <label className="full-field">Resposta correta <span>Digite a palavra ou expressão esperada.</span><input name={`question-${index}-text-answer`} placeholder="Ex.: have" /></label>}
        {currentType === 'ordering' && <label className="full-field">Ordem correta <span>Separe palavras, trechos ou pontuações por /.</span><input name={`question-${index}-text-answer`} placeholder="Ex.: If / I / study, / I / will / pass" /></label>}
        <label>Explicação <span>(opcional)</span><input name={`question-${index}-explanation`} placeholder="Ex.: Usamos present perfect para experiências de vida." /></label>
      </fieldset>;
    })}<button type="button" className="secondary-button compact" onClick={() => setQuestionCount((count) => Math.min(8, count + 1))}><Plus size={15} />Adicionar questão manual</button></div>}
    <div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button">{mode === 'interactive' ? <FileQuestion size={16} /> : <ClipboardList size={16} />}{mode === 'interactive' ? 'Criar quiz' : 'Criar tarefa'}</button></div>
  </form></Modal>;
}

function questionTypeLabel(type: InteractiveQuestionType) {
  return type === 'multiple_choice' ? 'Múltipla escolha' : type === 'fill_blank' ? 'Complete a frase' : type === 'true_false' ? 'Verdadeiro ou falso' : 'Ordenação';
}

function splitOrderingSource(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return [];
  const parts = trimmed.includes('/') ? trimmed.split('/') : trimmed.split(',');
  return parts.map((item) => item.trim()).filter(Boolean);
}

function formatOrderingAnswer(items: string[]) {
  return items.join(' / ');
}

function displayQuestionAnswer(question: InteractiveQuestion | QuestionBankItem) {
  return question.type === 'ordering' ? splitOrderingSource(question.answer).join(' ') : question.answer;
}

async function functionInvokeErrorMessage(error: unknown, fallbackData: unknown) {
  const fallback = error instanceof Error ? error.message : 'Não foi possível executar a função.';
  const fallbackBody = fallbackData as { error?: string; message?: string } | null;
  if (fallbackBody?.error || fallbackBody?.message) return fallbackBody.error ?? fallbackBody.message ?? fallback;
  const context = (error as { context?: { json?: () => Promise<unknown>; text?: () => Promise<string>; status?: number } } | null)?.context;
  try {
    if (context?.json) {
      const body = await context.json() as { error?: string; message?: string; code?: string };
      if (body.error || body.message) return body.error ?? body.message ?? fallback;
      if (body.code) return body.code;
    }
  } catch {
    try {
      const text = await context?.text?.();
      if (text) return text;
    } catch {
      // Keep the SDK fallback message.
    }
  }
  return fallback;
}

function bankQuestionToInteractive(question: QuestionBankItem): InteractiveQuestion {
  return { id: crypto.randomUUID(), type: question.type, prompt: question.prompt, options: question.options, answer: question.answer, explanation: question.explanation };
}

function buildInteractiveContent(form: FormData, questionCount: number, bankQuestions: QuestionBankItem[] = [], generatedQuestions: InteractiveQuestion[] = []): InteractiveAssignmentContent {
  const maxAttempts = Number(form.get('interactiveMaxAttempts') || '1');
  const revealAnswers = String(form.get('interactiveRevealAnswers') || 'after_each') === 'after_last' ? 'after_last' : 'after_each';
  const manualQuestions: InteractiveQuestion[] = Array.from({ length: questionCount }).flatMap<InteractiveQuestion>((_, index) => {
    const prompt = String(form.get(`question-${index}`) || '').trim();
    const type = String(form.get(`question-${index}-type`) || 'multiple_choice') as InteractiveQuestionType;
    const labels = ['A', 'B', 'C', 'D'];
    const options = labels.map((label) => String(form.get(`question-${index}-option-${label}`) || '').trim()).filter(Boolean);
    const answerIndex = labels.indexOf(String(form.get(`question-${index}-answer`) || 'A'));
    const textAnswer = String(form.get(`question-${index}-text-answer`) || '').trim();
    const selectedAnswer = String(form.get(`question-${index}-answer`) || 'A');
    const explanation = String(form.get(`question-${index}-explanation`) || '').trim() || undefined;
    if (!prompt) return [];
    if (type === 'true_false') return [{ id: crypto.randomUUID(), type, prompt, options: ['Verdadeiro', 'Falso'], answer: selectedAnswer === 'Falso' ? 'Falso' : 'Verdadeiro', explanation }];
    if (type === 'fill_blank') return textAnswer ? [{ id: crypto.randomUUID(), type, prompt, options: [], answer: textAnswer, explanation }] : [];
    if (type === 'ordering') {
      const ordered = splitOrderingSource(textAnswer);
      const shuffled = [...ordered].sort(() => Math.random() - 0.5);
      return ordered.length > 1 ? [{ id: crypto.randomUUID(), type, prompt, options: shuffled, answer: formatOrderingAnswer(ordered), explanation }] : [];
    }
    if (options.length < 2 || !options[answerIndex]) return [];
    return [{ id: crypto.randomUUID(), type, prompt, options, answer: options[answerIndex], explanation }];
  });
  const questions = [...bankQuestions.map(bankQuestionToInteractive), ...generatedQuestions, ...manualQuestions];
  return { questions, settings: { maxAttempts: Number.isFinite(maxAttempts) ? maxAttempts : 1, revealAnswers } };
}

function QuizPreviewModal({ assignment, onClose }: { assignment: Assignment; onClose: () => void }) {
  const content = assignment.interactiveContent;
  const questions = content?.questions ?? [];
  const maxAttempts = content?.settings?.maxAttempts ?? 1;
  const reveal = content?.settings?.revealAnswers === 'after_last' ? 'Apenas na última tentativa' : 'Depois de cada envio';
  return <Modal title="Pré-visualizar quiz" onClose={onClose} className="quiz-preview-modal"><div className="quiz-preview">
    <section className="quiz-preview-hero"><div><p className="eyebrow">VISÃO DO ALUNO</p><h3>{assignment.title}</h3><p>{assignment.instructions || 'Sem instruções adicionais.'}</p></div><div><span>{questions.length}</span><small>questão(ões)</small></div></section>
    <div className="quiz-preview-settings"><span>Tentativas: <b>{maxAttempts ? maxAttempts : 'Ilimitadas'}</b></span><span>Gabarito: <b>{reveal}</b></span></div>
    {questions.length ? <div className="quiz-preview-question-list">{questions.map((question, index) => <article key={question.id}><div><span>Questão {index + 1}</span><strong>{question.prompt}</strong><small>{questionTypeLabel(question.type)}</small></div>{question.type === 'fill_blank' ? <div className="quiz-preview-answer-line">Campo de resposta curta</div> : question.type === 'ordering' ? <div className="ordering-drag-list preview">{question.options.map((option, optionIndex) => <button type="button" key={`${option}-${optionIndex}`}>{option}</button>)}</div> : <div className="quiz-preview-options">{question.options.map((option) => <label key={option}><input type="radio" disabled />{option}</label>)}</div>}<footer><span>Gabarito: <b>{displayQuestionAnswer(question)}</b></span>{question.explanation && <p>{question.explanation}</p>}</footer></article>)}</div> : <div className="empty-state small"><FileQuestion size={30} /><h3>Quiz sem questões</h3><p>Adicione questões antes de enviar para o aluno.</p></div>}
    <div className="form-actions"><button className="primary-button" onClick={onClose}><Check size={16} />Concluir prévia</button></div>
  </div></Modal>;
}

function QuestionBankModal({ questions, onClose, onCreate, onDelete }: { questions: QuestionBankItem[]; onClose: () => void; onCreate: (input: QuestionBankInput) => Promise<void> | void; onDelete: (id: Id) => Promise<void> | void }) {
  const [level, setLevel] = useState<QuestionBankLevel>('A1');
  const [type, setType] = useState<InteractiveQuestionType>('multiple_choice');
  const [saving, setSaving] = useState(false);
  const visible = questions.filter((question) => question.level === level && question.category === 'Grammar');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const prompt = String(form.get('prompt') || '').trim();
    const explanation = String(form.get('explanation') || '').trim() || undefined;
    const optionLabels = ['A', 'B', 'C', 'D'];
    const options = type === 'multiple_choice'
      ? optionLabels.map((label) => String(form.get(`option-${label}`) || '').trim()).filter(Boolean)
      : type === 'true_false'
        ? ['Verdadeiro', 'Falso']
        : type === 'ordering'
          ? splitOrderingSource(String(form.get('textAnswer') || ''))
          : [];
    const answer = type === 'multiple_choice'
      ? options[optionLabels.indexOf(String(form.get('answer') || 'A'))] ?? ''
      : type === 'true_false'
        ? String(form.get('answer') || 'Verdadeiro')
        : type === 'ordering'
          ? formatOrderingAnswer(options)
          : String(form.get('textAnswer') || '').trim();
    if (!prompt || !answer || (type === 'multiple_choice' && options.length < 2) || (type === 'ordering' && options.length < 2)) {
      window.alert('Preencha o enunciado, o gabarito e as alternativas necessárias.');
      return;
    }
    setSaving(true);
    await onCreate({ level, category: 'Grammar', type, prompt, options, answer, explanation });
    formElement.reset();
    setSaving(false);
  };
  return <Modal title="Banco de questões" onClose={onClose} className="question-bank-shell"><div className="question-bank-modal">
    <section className="question-bank-create"><div><p className="eyebrow">GRAMMAR</p><h3>Nova questão</h3><p>Cadastre questões reutilizáveis por nível para montar quizzes mais rápido.</p></div><form className="form-grid" onSubmit={submit}>
      <label>Nível<select value={level} onChange={(event) => setLevel(event.target.value as QuestionBankLevel)}>{questionBankLevels.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Tipo<select value={type} onChange={(event) => setType(event.target.value as InteractiveQuestionType)}><option value="multiple_choice">Múltipla escolha</option><option value="fill_blank">Complete a frase</option><option value="true_false">Verdadeiro ou falso</option><option value="ordering">Ordenar palavras/frases</option></select></label>
      <label className="full-field">Enunciado<input name="prompt" required placeholder={type === 'ordering' ? 'Ex.: Ordene as palavras para formar uma frase.' : 'Ex.: I ____ to Canada.'} /></label>
      {type === 'multiple_choice' && <><div className="interactive-options-grid full-field">{['A', 'B', 'C', 'D'].map((option) => <label key={option}>Alternativa {option}<input name={`option-${option}`} placeholder={option === 'A' ? 'have been' : option === 'B' ? 'has been' : ''} /></label>)}</div><label>Gabarito<select name="answer" defaultValue="A"><option>A</option><option>B</option><option>C</option><option>D</option></select></label></>}
      {type === 'true_false' && <label>Gabarito<select name="answer" defaultValue="Verdadeiro"><option>Verdadeiro</option><option>Falso</option></select></label>}
      {(type === 'fill_blank' || type === 'ordering') && <label className="full-field">{type === 'ordering' ? 'Ordem correta' : 'Resposta correta'}<span>{type === 'ordering' ? 'Separe palavras, trechos ou pontuações por /.' : 'Digite a palavra ou expressão esperada.'}</span><input name="textAnswer" required placeholder={type === 'ordering' ? 'Ex.: If / I / study, / I / will / pass' : 'Ex.: have been'} /></label>}
      <label className="full-field">Explicação <span>(opcional)</span><input name="explanation" placeholder="Ex.: Usamos present perfect para experiências de vida." /></label>
      <div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Fechar</button><button className="primary-button" disabled={saving}>{saving ? <Clock3 size={16} /> : <Plus size={16} />}{saving ? 'Salvando...' : 'Salvar questão'}</button></div>
    </form></section>
    <section className="question-bank-library"><div className="question-bank-library-heading"><div><p className="eyebrow">{level} · GRAMMAR</p><h3>Questões cadastradas</h3></div><span>{visible.length}</span></div>{visible.length ? <div className="question-bank-items">{visible.map((question) => <article key={question.id}><div><small>{questionTypeLabel(question.type)}</small><strong>{question.prompt}</strong><p>Gabarito: {displayQuestionAnswer(question)}</p></div><button type="button" className="icon-button danger" onClick={() => onDelete(question.id)}><Trash2 size={15} /></button></article>)}</div> : <div className="empty-state small"><FileQuestion size={30} /><h3>Nenhuma questão em {level}</h3><p>Crie a primeira questão Grammar para este nível.</p></div>}</section>
  </div></Modal>;
}

function ReviewAssignmentModal({ assignment, onClose, onSave }: { assignment: Assignment; onClose: () => void; onSave: (feedback: string, grade?: number) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); const raw = String(form.get('grade') || ''); onSave(String(form.get('feedback')), raw ? Number(raw) : undefined); };
  return <Modal title="Corrigir tarefa" onClose={onClose}><div className="submission-preview"><strong>Resposta do aluno</strong><p>{assignment.submissionText || 'Nenhuma resposta em texto.'}</p>{assignment.submissionFileUrl && <a className="submission-file-link" href={assignment.submissionFileUrl} target="_blank" rel="noreferrer"><FileText size={15} />{assignment.submissionFileName || 'PDF anexado'}<ExternalLink size={13} /></a>}</div><form className="form-grid" onSubmit={submit}><label className="full-field">Feedback<textarea name="feedback" rows={5} required defaultValue={assignment.feedback ?? ''} /></label><label>Nota <span>(opcional)</span><input name="grade" type="number" min="0" max="100" defaultValue={assignment.grade ?? ''} /></label><div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button"><Check size={16} />Salvar correção</button></div></form></Modal>;
}

function ConfirmAssignmentDelete({ assignment, onClose, onConfirm }: { assignment: Assignment; onClose: () => void; onConfirm: () => void }) { return <Modal title="Excluir tarefa" onClose={onClose}><p>Deseja excluir <strong>{assignment.title}</strong>? A entrega e o feedback também serão removidos.</p><div className="form-actions"><button className="cancel-button" onClick={onClose}>Voltar</button><button className="danger-button" onClick={onConfirm}><Trash2 size={16} />Excluir</button></div></Modal>; }


function FinancePage({ payments, students, onNew, onStatus, onDelete }: { payments: Payment[]; students: Student[]; onNew: () => void; onStatus: (id: Id, status: PaymentStatus) => void; onDelete: (id: Id) => void }) {
  const today = toDateInput(new Date());
  const normalized = payments.map((payment) => payment.status === 'Pendente' && payment.dueDate < today ? { ...payment, status: 'Atrasado' as PaymentStatus } : payment);
  const pending = normalized.filter((item) => item.status !== 'Pago').reduce((sum, item) => sum + item.amount, 0);
  const paid = normalized.filter((item) => item.status === 'Pago').reduce((sum, item) => sum + item.amount, 0);
  const studentName = (id: Id) => students.find((student) => student.id === id)?.name ?? 'Aluno';
  const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return <><div className="stats-grid finance-stats"><StatCard label="Recebido" value={money(paid)} note="Pagamentos registrados" /><StatCard label="A receber" value={money(pending)} note="Pendentes e atrasados" /><StatCard label="Cobranças" value={String(normalized.length)} note="Total cadastrado" /></div><section className="panel finance-panel"><div className="panel-heading finance-heading"><div><p className="eyebrow">FINANCEIRO</p><h3>Pagamentos e cobranças</h3></div><button className="secondary-button compact" onClick={onNew}><Plus size={16} />Nova cobrança</button></div>{normalized.length ? <div className="payment-list">{normalized.sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).map((payment)=><article className="payment-card" key={payment.id}><div className="payment-main"><span className={`payment-status ${payment.status.toLowerCase()}`}>{payment.status}</span><h3>{payment.description}</h3><p><strong>{studentName(payment.studentId)}</strong><span>Vencimento em {formatDate(payment.dueDate)}</span></p></div><div className="payment-amount"><span>Valor</span><strong>{money(payment.amount)}</strong></div><div className="payment-actions">{payment.status !== 'Pago' ? <button className="payment-paid-button" onClick={()=>onStatus(payment.id,'Pago')}><Check size={15}/>Marcar como pago</button> : <button className="payment-reopen-button" onClick={()=>onStatus(payment.id,'Pendente')}>Reabrir cobrança</button>}<button className="payment-delete-button" aria-label="Excluir cobrança" title="Excluir cobrança" onClick={()=>onDelete(payment.id)}><Trash2 size={16}/></button></div></article>)}</div> : <div className="empty-state"><CircleDollarSign size={40}/><h3>Nenhuma cobrança cadastrada</h3><p>Registre mensalidades, pacotes ou aulas avulsas e acompanhe os recebimentos.</p><button className="primary-button" onClick={onNew}><Plus size={16}/>Criar primeira cobrança</button></div>}</section></>;
}
function PaymentModal({ students, onClose, onSave }: { students: Student[]; onClose: () => void; onSave: (input: PaymentInput) => void }) {
  const submit=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();const form=new FormData(event.currentTarget);onSave({studentId:String(form.get('studentId')),description:String(form.get('description')),amount:Number(form.get('amount')),dueDate:String(form.get('dueDate'))});};
  return <Modal title="Nova cobrança" onClose={onClose}><form className="form-grid" onSubmit={submit}><label>Aluno<select name="studentId" required defaultValue=""><option value="" disabled>Selecione</option>{students.map(student=><option key={student.id} value={student.id}>{student.name}</option>)}</select></label><label>Valor (R$)<input name="amount" type="number" min="0.01" step="0.01" required /></label><label className="full-field">Descrição<input name="description" required placeholder="Ex.: Mensalidade de julho" /></label><label>Vencimento<input name="dueDate" type="date" required /></label><div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button"><CircleDollarSign size={16}/>Salvar cobrança</button></div></form></Modal>;
}

function PlaceholderPage({ title }: { title: string }) { return <section className="panel empty-state placeholder"><BookOpen size={44} /><h2>{title}</h2><p>Este módulo já está reservado na navegação e será implementado nas próximas etapas.</p></section>; }
function StatCard({ label, value, note }: { label: string; value: string; note: string }) { return <article className="stat-card"><span>{label}</span><strong>{value}</strong><small>{note}</small></article>; }
function Timeline({ time, name, topic }: { time: string; name: string; topic: string }) { return <div className="timeline-item"><div className="timeline-time">{time}</div><div className="timeline-dot" /><div><strong>{name}</strong><span>{topic}</span></div></div>; }
function Progress({ value }: { value: number }) { return <div className="progress-wrap"><div className="progress-meta"><span>Progresso</span><strong>{value}%</strong></div><div className="progress-track"><div style={{ width: `${value}%` }} /></div></div>; }
function Detail({ label, value }: { label: string; value: string }) { return <div className="detail"><span>{label}</span><strong>{value}</strong></div>; }
function initials(name: string) { return name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase(); }
function formatDate(date: string) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${date}T12:00:00`)); }
function formatWeekRange(date: Date) { const end = addDays(date, 6); const startText = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date); const endText = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(end); return `${startText} — ${endText}`; }
function skillAverage(students: Student[], skill: Skill) { return students.length ? Math.round(students.reduce((sum, student) => sum + student.skills[skill], 0) / students.length) : 0; }
function averageSkillScore(scores: Record<Skill, number>) { return Math.round(Object.values(scores).reduce((sum, value) => sum + value, 0) / skills.length); }
function scheduledToHistory(lesson: ScheduledLesson): Lesson { return { id: lesson.id, date: lesson.date, startTime: lesson.startTime, duration: lesson.duration, topic: lesson.topic, onlineUrl: lesson.onlineUrl, notes: lesson.notes, strengths: lesson.strengths ?? '', improvements: lesson.improvements ?? '', homework: lesson.homework, attendance: lesson.attendance, skillScores: lesson.skillScores }; }
function studentReportText(student: Student, history: Lesson[], strongest: Skill, attention: Skill, startDate: string, endDate: string, schedule: ScheduledLesson[], assignments: Assignment[]) {
  const completed = schedule.filter((lesson) => lesson.status === 'Concluída');
  const attendanceBase = completed.filter((lesson) => lesson.attendance === 'Presente' || lesson.attendance === 'Ausente');
  const attendance = attendanceBase.length ? Math.round(attendanceBase.filter((lesson) => lesson.attendance === 'Presente').length / attendanceBase.length * 100) : 0;
  const delivered = assignments.filter((assignment) => assignment.status !== 'Pendente').length;
  return `Relatório de progresso — ${student.name}\nPeríodo: ${formatDate(startDate)} a ${formatDate(endDate)}\nNível: ${student.level}\nObjetivo: ${student.goal}\nProgresso geral: ${student.progress}%\nHabilidade destaque: ${strongest} (${student.skills[strongest]}%)\nPonto de atenção: ${attention} (${student.skills[attention]}%)\nAulas concluídas no período: ${Math.max(history.length, completed.length)}\nFrequência: ${attendance}%\nTarefas entregues: ${delivered}/${assignments.length}\nObservações: ${student.notes || 'Nenhuma observação registrada.'}`;
}
function formatStudyTime(minutes: number) { if (!minutes) return '0h'; const hours = Math.floor(minutes / 60); const rest = minutes % 60; return rest ? `${hours}h ${rest}min` : `${hours}h`; }
function materialIcon(type: MaterialType) { if (type === 'Vídeo') return Video; if (type === 'Áudio') return FileAudio; if (type === 'Atividade') return FileQuestion; if (type === 'Link') return ExternalLink; return FileText; }
function googleCalendarUrl(lesson: ScheduledLesson, student?: Student) {
  const start = new Date(`${lesson.date}T${lesson.startTime}:00`);
  const end = new Date(start.getTime() + lesson.duration * 60_000);
  const formatGoogleDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({ action: 'TEMPLATE', text: `${lesson.topic} · ${student?.name ?? 'Aluno'}`, dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`, details: `Aula de idiomas no LangSpot.${lesson.onlineUrl ? `\n\nLink da aula: ${lesson.onlineUrl}` : ''}`, location: lesson.onlineUrl ?? '' });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default App;
