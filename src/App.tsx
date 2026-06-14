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
  Edit3,
  ExternalLink,
  FileAudio,
  FileQuestion,
  ClipboardList,
  FileText,
  FolderOpen,
  GraduationCap,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Printer,
  Save,
  Search,
  Settings,
  ShieldCheck,
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
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { APP_VERSION, can } from './config/env';
import { supabase } from './supabase';
import { mockStudents, mockSchedule, mockMaterials, mockSettings, resetToMockData, toDateInput, addDays, startOfWeek } from './config/mockData';

type Id = string;
export type Skill = 'Speaking' | 'Listening' | 'Reading' | 'Writing' | 'Grammar' | 'Vocabulary' | 'Pronunciation';
export type AttendanceStatus = 'Presente' | 'Ausente' | 'Remarcada';
export type Lesson = { id: Id; date: string; topic: string; notes: string; homework: string; attendance?: AttendanceStatus; skillScores?: Partial<Record<Skill, number>> };
export type LessonStatus = 'Agendada' | 'Concluída' | 'Cancelada';
export type ScheduledLesson = { id: Id; studentId: Id; date: string; startTime: string; duration: number; topic: string; onlineUrl?: string; status: LessonStatus; notes: string; homework: string; attendance?: AttendanceStatus; skillScores?: Partial<Record<Skill, number>> };
export type MaterialType = 'PDF' | 'Vídeo' | 'Áudio' | 'Link' | 'Atividade';
export type Material = { id: Id; title: string; type: MaterialType; level: string; skill: Skill; url: string; description: string; createdAt: string; assignedStudentIds?: Id[]; storagePath?: string; fileName?: string; fileSize?: number; source?: 'link' | 'upload' };
export type MaterialInput = Omit<Material, 'id' | 'createdAt' | 'assignedStudentIds'> & { file?: File };
export type AssignmentStatus = 'Pendente' | 'Entregue' | 'Corrigida';
export type Assignment = { id: Id; teacherId?: Id; studentId: Id; materialId?: Id; title: string; instructions: string; dueDate: string; status: AssignmentStatus; submissionText?: string; submittedAt?: string; feedback?: string; grade?: number; createdAt: string };
export type AssignmentInput = Pick<Assignment, 'studentId' | 'materialId' | 'title' | 'instructions' | 'dueDate'>;
export type PaymentStatus = 'Pendente' | 'Pago' | 'Atrasado';
export type Payment = { id: Id; studentId: Id; description: string; amount: number; dueDate: string; status: PaymentStatus; paidAt?: string; createdAt: string };
export type PaymentInput = Pick<Payment, 'studentId' | 'description' | 'amount' | 'dueDate'>;
export type PlatformSettings = { teacherName: string; email: string; schoolName: string; avatar: string; defaultDuration: number; defaultOnlineUrl: string; compactMode: boolean; theme: 'light' | 'dark'; confirmCancellations: boolean };
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
};
type StudentAccountResult = { temporaryPassword: string; studentId?: Id };

type NotificationKind = 'lesson' | 'assignment' | 'payment' | 'cancellation';
export type AppNotification = { id: string; kind: NotificationKind; title: string; description: string; date: string; target: View; urgent?: boolean };
type View = 'Visão geral' | 'Notificações' | 'Alunos' | 'Aulas' | 'Materiais' | 'Tarefas' | 'Financeiro' | 'Progresso' | 'Relatórios' | 'Configurações';

const skills: Skill[] = ['Speaking', 'Listening', 'Reading', 'Writing', 'Grammar', 'Vocabulary', 'Pronunciation'];
const defaultSkills = (): Record<Skill, number> => ({ Speaking: 50, Listening: 50, Reading: 50, Writing: 50, Grammar: 50, Vocabulary: 50, Pronunciation: 50 });

// Use mock settings if mock data is enabled, otherwise use empty defaults
const defaultSettings: PlatformSettings = can.useMockData() ? mockSettings : { teacherName: '', email: '', schoolName: '', avatar: '', defaultDuration: 60, defaultOnlineUrl: '', compactMode: false, theme: 'light', confirmCancellations: true };

const navigation: { label: View; icon: typeof LayoutDashboard }[] = [
  { label: 'Visão geral', icon: LayoutDashboard },
  { label: 'Notificações', icon: Bell },
  { label: 'Alunos', icon: UsersRound },
  { label: 'Aulas', icon: CalendarDays },
  { label: 'Materiais', icon: BookOpen },
  { label: 'Tarefas', icon: ClipboardList },
  { label: 'Financeiro', icon: WalletCards },
  { label: 'Progresso', icon: ChartNoAxesCombined },
  { label: 'Relatórios', icon: FileText },
];

function App({ onLogout, onInviteStudent, onInviteTeacher, onCreateStudentAccount, onOpenCancellationRequests, cancellationRequestCount = 0, initialSettings, onProfileSettingsChange, authenticatedMode = false, initialStudents, initialSchedule, initialMaterials, initialAssignments, initialPayments, onCreateScheduledLesson, onUpdateScheduledLesson, onCancelScheduledLesson, onCompleteScheduledLesson, onUpdateStudentSkills, onDeleteStudent, onCreateMaterial, onDeleteMaterial, onAssignMaterial, onCreateAssignment, onDeleteAssignment, onReviewAssignment, onCreatePayment, onUpdatePaymentStatus, onDeletePayment }: { onLogout?: () => void; onInviteStudent?: () => void; onInviteTeacher?: () => void; onCreateStudentAccount?: (data: { name: string; email: string; level: string; goal: string }) => Promise<StudentAccountResult>; onOpenCancellationRequests?: () => void; cancellationRequestCount?: number; initialSettings?: Partial<PlatformSettings>; onProfileSettingsChange?: (settings: PlatformSettings) => void | Promise<void>; authenticatedMode?: boolean; initialStudents?: Student[]; initialSchedule?: ScheduledLesson[]; onCreateScheduledLesson?: (lesson: Omit<ScheduledLesson, 'id' | 'status' | 'notes' | 'homework'>) => Promise<ScheduledLesson>; onUpdateScheduledLesson?: (id: Id, lesson: Omit<ScheduledLesson, 'id' | 'status' | 'notes' | 'homework'>) => Promise<ScheduledLesson>; onCancelScheduledLesson?: (id: Id) => Promise<void>; onCompleteScheduledLesson?: (id: Id, notes: string, homework: string, attendance: AttendanceStatus, skillScores: Record<Skill, number>) => Promise<void>; onUpdateStudentSkills?: (studentId: Id, skills: Record<Skill, number>) => Promise<void>; onDeleteStudent?: (studentId: Id) => Promise<void>; initialMaterials?: Material[]; onCreateMaterial?: (material: MaterialInput) => Promise<Material>; onDeleteMaterial?: (id: Id) => Promise<void>; onAssignMaterial?: (materialId: Id, studentIds: Id[]) => Promise<void>; initialAssignments?: Assignment[]; onCreateAssignment?: (assignment: AssignmentInput) => Promise<Assignment>; onDeleteAssignment?: (id: Id) => Promise<void>; onReviewAssignment?: (id: Id, feedback: string, grade?: number) => Promise<void>; initialPayments?: Payment[]; onCreatePayment?: (payment: PaymentInput) => Promise<Payment>; onUpdatePaymentStatus?: (id: Id, status: PaymentStatus) => Promise<void>; onDeletePayment?: (id: Id) => Promise<void> }) {
  const [active, setActive] = useState<View>('Visão geral');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonToEdit, setLessonToEdit] = useState<ScheduledLesson | null>(null);
  const [lessonToComplete, setLessonToComplete] = useState<ScheduledLesson | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  const [materialToAssign, setMaterialToAssign] = useState<Material | null>(null);
  const [temporaryAccess, setTemporaryAccess] = useState<{ name: string; email: string; password: string } | null>(null);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);
  const [assignmentToReview, setAssignmentToReview] = useState<Assignment | null>(null);
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
  useEffect(() => { if (authenticatedMode && initialPayments) setPayments(initialPayments); }, [authenticatedMode, initialPayments]);
  useEffect(() => localStorage.setItem('langspot.readNotifications', JSON.stringify(readNotificationIds)), [readNotificationIds]);
  useEffect(() => localStorage.setItem('linguaboard.settings', JSON.stringify(settings)), [settings]);
  useEffect(() => { if (initialSettings) setSettings((current) => ({ ...current, ...initialSettings })); }, [initialSettings]);
  useEffect(() => { document.body.classList.toggle('compact-mode', settings.compactMode); }, [settings.compactMode]);
  useEffect(() => { document.body.classList.toggle('dark-theme', settings.theme === 'dark'); }, [settings.theme]);

  const selected = students.find((student) => student.id === selectedId) ?? null;
  const filteredStudents = useMemo(() => students.filter((student) => `${student.name} ${student.level} ${student.goal}`.toLowerCase().includes(query.toLowerCase())), [students, query]);
  const averageProgress = students.length ? Math.round(students.reduce((sum, student) => sum + student.progress, 0) / students.length) : 0;
  const notifications = useMemo<AppNotification[]>(() => {
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
      if (assignment.status === 'Entregue') {
        items.push({ id: `assignment-review-${assignment.id}`, kind: 'assignment', title: 'Tarefa aguardando correção', description: `${studentName(assignment.studentId)} entregou “${assignment.title}”.`, date: assignment.submittedAt ?? assignment.createdAt, target: 'Tarefas', urgent: true });
      } else if (assignment.status === 'Pendente' && due < now) {
        items.push({ id: `assignment-overdue-${assignment.id}`, kind: 'assignment', title: 'Tarefa atrasada', description: `${studentName(assignment.studentId)} ainda não entregou “${assignment.title}”.`, date: due.toISOString(), target: 'Tarefas', urgent: true });
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
  const unreadNotificationCount = notifications.filter((item) => !readNotificationIds.includes(item.id)).length;

  const addStudent = async (data: Omit<Student, 'id' | 'progress' | 'skills' | 'lessons'>) => {
    const account = onCreateStudentAccount ? await onCreateStudentAccount({ name: data.name, email: data.email, level: data.level, goal: data.goal }) : null;
    const student: Student = { ...data, id: account?.studentId ?? crypto.randomUUID(), progress: 50, skills: defaultSkills(), lessons: [] };
    setStudents((current) => [student, ...current]);
    setShowStudentForm(false);
    setActive('Alunos');
    setSelectedId(student.id);
    if (account) setTemporaryAccess({ name: data.name, email: data.email, password: account.temporaryPassword });
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

  const saveScheduledLesson = async (data: Omit<ScheduledLesson, 'id' | 'status' | 'notes' | 'homework'>) => {
    const created = onCreateScheduledLesson ? await onCreateScheduledLesson(data) : { ...data, id: crypto.randomUUID(), status: 'Agendada' as const, notes: '', homework: '' };
    setSchedule((current) => [created, ...current]);
    setLessonToEdit(null);
  };

  const editScheduledLesson = async (data: Omit<ScheduledLesson, 'id' | 'status' | 'notes' | 'homework'>) => {
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

  const completeScheduledLesson = async (notes: string, homework: string, attendance: AttendanceStatus, skillScores: Record<Skill, number>) => {
    if (!lessonToComplete) return;
    await onCompleteScheduledLesson?.(lessonToComplete.id, notes, homework, attendance, skillScores);
    setSchedule((current) => current.map((lesson) => lesson.id === lessonToComplete.id ? { ...lesson, status: 'Concluída', notes, homework, attendance, skillScores } : lesson));
    setStudents((current) => current.map((student) => student.id === lessonToComplete.studentId ? { ...student, lessons: [{ id: crypto.randomUUID(), date: lessonToComplete.date, topic: lessonToComplete.topic, notes, homework, attendance, skillScores }, ...student.lessons] } : student));
    setStudents((current) => current.map((student) => student.id === lessonToComplete.studentId ? { ...student, skills: skillScores, progress: Math.round(Object.values(skillScores).reduce((sum, value) => sum + value, 0) / skills.length) } : student));
    setLessonToComplete(null);
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
      setAssignments((current) => [created, ...current]); setShowAssignmentForm(false);
    } catch (error) { window.alert(error instanceof Error ? error.message : 'Não foi possível criar a tarefa.'); }
  };
  const deleteAssignment = async () => { if (!assignmentToDelete) return; try { await onDeleteAssignment?.(assignmentToDelete.id); setAssignments((current) => current.filter((item) => item.id !== assignmentToDelete.id)); setAssignmentToDelete(null); } catch (error) { window.alert(error instanceof Error ? error.message : 'Não foi possível excluir a tarefa.'); } };
  const reviewAssignment = async (feedback: string, grade?: number) => { if (!assignmentToReview) return; try { await onReviewAssignment?.(assignmentToReview.id, feedback, grade); setAssignments((current) => current.map((item) => item.id === assignmentToReview.id ? { ...item, feedback, grade, status: 'Corrigida' } : item)); setAssignmentToReview(null); } catch (error) { window.alert(error instanceof Error ? error.message : 'Não foi possível salvar o feedback.'); } };

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

  const markNotificationRead = (id: string) => setReadNotificationIds((current) => current.includes(id) ? current : [...current, id]);
  const markAllNotificationsRead = () => setReadNotificationIds((current) => Array.from(new Set([...current, ...notifications.map((item) => item.id)])));
  const openNotification = (notification: AppNotification) => { markNotificationRead(notification.id); setActive(notification.target); setSelectedId(null); setMobileMenuOpen(false); };
  const navigateTo = (label: View) => { setActive(label); setSelectedId(null); setMobileMenuOpen(false); };

  const topbarPrimaryAction = !selected ? (
    active === 'Visão geral' || active === 'Aulas'
      ? { label: 'Nova aula', run: () => setLessonToEdit(newLessonDraft()) }
      : active === 'Alunos'
        ? { label: 'Novo aluno', run: () => setShowStudentForm(true) }
        : active === 'Materiais'
          ? { label: 'Novo material', run: () => setShowMaterialForm(true) }
          : active === 'Tarefas'
            ? { label: 'Nova tarefa', run: () => setShowAssignmentForm(true) }
            : active === 'Financeiro'
              ? { label: 'Nova cobrança', run: () => setShowPaymentForm(true) }
              : null
  ) : null;

  const pageTitle = selected ? selected.name : active;

  return (
    <div className="app-shell">
      {mobileMenuOpen && <button className="sidebar-backdrop" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)} />}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="brand"><div className="brand-mark"><GraduationCap size={24} /></div><div><strong>LangSpot</strong><span>Teacher Workspace</span></div><button className="mobile-menu-close" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)}><X size={20} /></button></div>
        <nav>{navigation.map(({ label, icon: Icon }) => <button key={label} className={active === label && !selected ? 'nav-item active' : 'nav-item'} onClick={() => navigateTo(label)}><Icon size={19} /><span>{label}</span>{label === 'Notificações' && unreadNotificationCount > 0 && <b className="nav-badge">{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</b>}</button>)}</nav>
        <div className="sidebar-footer"><button className={active === 'Configurações' ? 'nav-item active' : 'nav-item'} onClick={() => navigateTo('Configurações')}><Settings size={19} />Configurações</button><div className="profile-card">{settings.avatar ? <img className="teacher-avatar" src={settings.avatar} alt={`Avatar de ${settings.teacherName}`} /> : <CircleUserRound size={34} />}<div><strong>{settings.teacherName}</strong><span>Professor</span></div>{onLogout && <button onClick={onLogout} title="Sair da conta" aria-label="Sair da conta"><LogOut size={16} /></button>}</div></div>
      </aside>

      <main>
        <header className="topbar">
          <button className="mobile-menu-button" aria-label="Abrir menu" onClick={() => setMobileMenuOpen(true)}><Menu size={21} /></button>
          <div className="topbar-title">{selected && <button className="back-button" onClick={() => setSelectedId(null)}><ArrowLeft size={16} /> Voltar para alunos</button>}<p className="eyebrow">PAINEL DO PROFESSOR</p><h1>{pageTitle}</h1></div>
          {active !== 'Configurações' && <div className="topbar-actions"><button className="notification-button" aria-label="Abrir notificações" title="Notificações" onClick={() => navigateTo('Notificações')}><Bell size={19} />{unreadNotificationCount > 0 && <span>{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</span>}</button>{onOpenCancellationRequests && active === 'Aulas' && !selected && <button className="invite-button" onClick={onOpenCancellationRequests}><Bell size={17} />Solicitações{cancellationRequestCount > 0 ? ` (${cancellationRequestCount})` : ''}</button>}{active === 'Alunos' && !selected && <button className="invite-button" onClick={onInviteStudent ?? (() => setShowStudentForm(true))}><UsersRound size={17} />Convidar aluno</button>}{active !== 'Notificações' && topbarPrimaryAction && <button className="primary-button" onClick={topbarPrimaryAction.run}><Plus size={18} />{topbarPrimaryAction.label}</button>}</div>}
        </header>

        {!isOnline && <div className="offline-banner" role="status"><WifiOff size={17} /><span>Você está offline. Alterações que dependem do Supabase podem não ser salvas até a conexão voltar.</span></div>}

        {selected ? <StudentProfile student={selected} onNewLesson={() => setShowLessonForm(true)} onSkillChange={updateSkill} onDelete={() => setStudentToDelete(selected)} /> : active === 'Visão geral' ? <Dashboard teacherName={settings.teacherName} students={students} schedule={schedule} averageProgress={averageProgress} authenticatedMode={authenticatedMode} onOpenStudent={(id) => { setSelectedId(id); setActive('Alunos'); }} onOpenSchedule={() => setActive('Aulas')} /> : active === 'Notificações' ? <NotificationsPage notifications={notifications} readIds={readNotificationIds} onOpen={openNotification} onMarkAll={markAllNotificationsRead} /> : active === 'Alunos' ? <StudentsPage students={filteredStudents} schedule={schedule} query={query} setQuery={setQuery} onOpen={setSelectedId} /> : active === 'Aulas' ? <LessonsPage students={students} lessons={schedule} onNew={() => setLessonToEdit(newLessonDraft())} onEdit={setLessonToEdit} onComplete={setLessonToComplete} onCancel={cancelScheduledLesson} /> : active === 'Materiais' ? <MaterialsPage materials={materials} onNew={() => setShowMaterialForm(true)} onDelete={setMaterialToDelete} onAssign={setMaterialToAssign} /> : active === 'Tarefas' ? <AssignmentsPage assignments={assignments} students={students} onNew={() => setShowAssignmentForm(true)} onDelete={setAssignmentToDelete} onReview={setAssignmentToReview} /> : active === 'Financeiro' ? <FinancePage payments={payments} students={students} onNew={() => setShowPaymentForm(true)} onStatus={updatePaymentStatus} onDelete={deletePayment} /> : active === 'Progresso' ? <ProgressPage students={students} onOpenStudent={(id) => { setSelectedId(id); setActive('Alunos'); }} /> : active === 'Relatórios' ? <ReportsPage students={students} schedule={schedule} assignments={assignments} /> : active === 'Configurações' ? <SettingsPage settings={settings} authenticatedMode={authenticatedMode} onSave={saveSettings} counts={{ students: students.length, lessons: schedule.length, materials: materials.length }} onExport={exportData} onReset={resetData} onInviteTeacher={onInviteTeacher} /> : <PlaceholderPage title={active} />}
      </main>

      {showStudentForm && <StudentModal onClose={() => setShowStudentForm(false)} onSave={addStudent} />}
      {showLessonForm && selected && <LessonModal studentName={selected.name} onClose={() => setShowLessonForm(false)} onSave={addLesson} />}
      {lessonToEdit && <ScheduleLessonModal students={students} lesson={lessonToEdit.id ? lessonToEdit : undefined} onClose={() => setLessonToEdit(null)} onSave={lessonToEdit.id ? editScheduledLesson : saveScheduledLesson} />}
      {lessonToComplete && <CompleteLessonModal lesson={lessonToComplete} student={students.find((student) => student.id === lessonToComplete.studentId)} onClose={() => setLessonToComplete(null)} onSave={completeScheduledLesson} />}
      {studentToDelete && <DeleteStudentModal student={studentToDelete} scheduledLessons={schedule.filter((lesson) => lesson.studentId === studentToDelete.id).length} onClose={() => setStudentToDelete(null)} onConfirm={deleteStudent} />}
      {showMaterialForm && <MaterialModal onClose={() => setShowMaterialForm(false)} onSave={addMaterial} />}
      {materialToDelete && <DeleteMaterialModal material={materialToDelete} onClose={() => setMaterialToDelete(null)} onConfirm={deleteMaterial} />}
      {materialToAssign && <AssignMaterialModal material={materialToAssign} students={students} onClose={() => setMaterialToAssign(null)} onSave={assignMaterial} />}
      {temporaryAccess && <TemporaryAccessModal access={temporaryAccess} onClose={() => setTemporaryAccess(null)} />}
      {showAssignmentForm && <AssignmentModal students={students} materials={materials} onClose={() => setShowAssignmentForm(false)} onSave={addAssignment} />}
      {assignmentToDelete && <ConfirmAssignmentDelete assignment={assignmentToDelete} onClose={() => setAssignmentToDelete(null)} onConfirm={deleteAssignment} />}
      {showPaymentForm && <PaymentModal students={students} onClose={() => setShowPaymentForm(false)} onSave={createPayment} />}{assignmentToReview && <ReviewAssignmentModal assignment={assignmentToReview} onClose={() => setAssignmentToReview(null)} onSave={reviewAssignment} />}
    </div>
  );
}

function NotificationsPage({ notifications, readIds, onOpen, onMarkAll }: { notifications: AppNotification[]; readIds: string[]; onOpen: (notification: AppNotification) => void; onMarkAll: () => void }) {
  const unread = notifications.filter((item) => !readIds.includes(item.id)).length;
  const iconFor = (kind: NotificationKind) => kind === 'lesson' ? CalendarDays : kind === 'assignment' ? ClipboardList : kind === 'payment' ? CircleDollarSign : Ban;
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
    <section className="hero-card"><div><span className="pill">LANGSPOT MVP</span><h2>Olá, {teacherName}! 👋</h2><p>Seus alunos, aulas e progresso agora estão no mesmo lugar.</p></div><button className="ghost-button" onClick={onOpenSchedule}>Ver agenda <ChevronRight size={18} /></button></section>
    <section className="stats-grid"><StatCard label="Alunos ativos" value={String(students.filter((s) => s.status === 'Ativo').length)} note="dados salvos localmente" /><StatCard label="Aulas registradas" value={String(students.reduce((sum, s) => sum + s.lessons.length, 0))} note="histórico do MVP" /><StatCard label="Perfis cadastrados" value={String(students.length)} note="incluindo pausados" /><StatCard label="Média de progresso" value={`${averageProgress}%`} note="média das habilidades" /></section>
    <section className="content-grid"><StudentPanel students={students.slice(0, 4)} schedule={schedule} onOpen={onOpenStudent} /><aside className="panel schedule-panel"><div className="panel-heading"><div><p className="eyebrow">AGENDA</p><h3>Próximas aulas</h3></div></div>{upcomingLessons.length ? upcomingLessons.map((lesson) => <Timeline key={lesson.id} time={lesson.startTime} name={students.find((student) => student.id === lesson.studentId)?.name ?? 'Aluno'} topic={lesson.topic} />) : <div className="empty-state small"><CalendarDays size={34} /><h3>Nenhuma aula agendada</h3><p>Suas próximas aulas cadastradas aparecerão aqui.</p></div>}<button className="secondary-button" onClick={onOpenSchedule}>Abrir calendário</button></aside></section>
  </>;
}

function StudentsPage({ students, schedule, query, setQuery, onOpen }: { students: Student[]; schedule: ScheduledLesson[]; query: string; setQuery: (value: string) => void; onOpen: (id: Id) => void }) {
  return <section className="panel"><div className="panel-heading"><div><p className="eyebrow">GESTÃO</p><h3>Todos os alunos</h3></div><div className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome, nível ou objetivo" /></div></div>{students.length ? <StudentList students={students} schedule={schedule} onOpen={onOpen} /> : <div className="empty-state"><UsersRound size={38} /><h3>Nenhum aluno encontrado</h3><p>Tente outra busca ou cadastre um novo aluno.</p></div>}</section>;
}

function SettingsPage({ settings, authenticatedMode, onSave, counts, onExport, onReset, onInviteTeacher }: { settings: PlatformSettings; authenticatedMode: boolean; onSave: (settings: PlatformSettings) => void; counts: { students: number; lessons: number; materials: number }; onExport: () => void; onReset: () => void; onInviteTeacher?: () => void }) {
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
      <section className="panel settings-card"><div className="settings-card-heading"><div className="settings-card-icon"><CircleUserRound size={21} /></div><div><h3>Perfil do professor</h3><p>Informações usadas na interface e relatórios.</p></div></div><div className="avatar-setting wide-setting"><div className="avatar-preview">{draft.avatar ? <img src={draft.avatar} alt="Pré-visualização do avatar" /> : <CircleUserRound size={40} />}</div><div><strong>Foto de perfil</strong><span>JPG, PNG ou WebP de até 5 MB.</span><div className="avatar-actions"><label><ImagePlus size={15} />Escolher imagem<input type="file" accept="image/*" onChange={selectAvatar} /></label>{draft.avatar && <button type="button" onClick={() => { update('avatar', ''); setAvatarMessage('Foto removida. Salve as alterações para aplicar.'); }}><Trash2 size={14} />Remover</button>}</div>{avatarMessage && <small>{avatarMessage}</small>}</div></div><div className="settings-fields"><label>Nome<input value={draft.teacherName} onChange={(event) => update('teacherName', event.target.value)} required /></label><label>E-mail<input type="email" value={draft.email} onChange={(event) => update('email', event.target.value)} placeholder="professor@email.com" /></label><label className="wide-setting">Nome da escola ou marca<input value={draft.schoolName} onChange={(event) => update('schoolName', event.target.value)} /></label></div></section>
      <section className="panel settings-card"><div className="settings-card-heading"><div className="settings-card-icon"><CalendarDays size={21} /></div><div><h3>Padrões das aulas</h3><p>Valores preenchidos ao agendar uma nova aula.</p></div></div><div className="settings-fields"><label>Duração padrão<select value={draft.defaultDuration} onChange={(event) => update('defaultDuration', Number(event.target.value))}><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="50">50 minutos</option><option value="60">60 minutos</option><option value="90">90 minutos</option></select></label><label className="wide-setting">Link padrão da aula online<input type="url" value={draft.defaultOnlineUrl} onChange={(event) => update('defaultOnlineUrl', event.target.value)} placeholder="https://meet.google.com/..." /></label><ToggleSetting label="Confirmar cancelamentos" note="Evita cancelamentos acidentais na agenda." checked={draft.confirmCancellations} onChange={(value) => update('confirmCancellations', value)} /></div></section>
      <section className="panel settings-card"><div className="settings-card-heading"><div className="settings-card-icon"><Settings size={21} /></div><div><h3>Interface</h3><p>Ajuste o tema e a densidade visual da plataforma.</p></div></div><div className="settings-fields"><div className="theme-setting wide-setting"><strong>Tema</strong><span>A mudança é aplicada imediatamente.</span><div><button type="button" className={draft.theme === 'light' ? 'active' : ''} onClick={() => updateInterface('theme', 'light')}><Sun size={16} />Claro</button><button type="button" className={draft.theme === 'dark' ? 'active' : ''} onClick={() => updateInterface('theme', 'dark')}><Moon size={16} />Escuro</button></div></div><ToggleSetting label="Modo compacto" note="Reduz espaçamentos para mostrar mais conteúdo." checked={draft.compactMode} onChange={(value) => updateInterface('compactMode', value)} /></div></section>
      {onInviteTeacher && <section className="panel settings-card"><div className="settings-card-heading"><div className="settings-card-icon"><UserPlus size={21} /></div><div><h3>Administração</h3><p>Gerencie acessos e permissões da plataforma.</p></div></div><div className="settings-fields"><div className="admin-actions"><button type="button" className="primary-button" onClick={onInviteTeacher}><UserPlus size={16} />Convidar Professor</button></div><small>Crie e distribua links de convite para novos professores.</small></div></section>}
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
  const reportHistory = history.length ? history : completedLessons.map((lesson) => ({ id: lesson.id, date: lesson.date, topic: lesson.topic, notes: lesson.notes, homework: lesson.homework, attendance: lesson.attendance, skillScores: lesson.skillScores }));
  return <section className="report-sheet"><ReportHeader title={`Relatório individual · ${student.name}`} startDate={startDate} endDate={endDate} /><div className="individual-report-header"><div className="avatar large">{initials(student.name)}</div><div><span className="status-badge">{student.status}</span><h2>{student.name}</h2><p>{student.level} · {student.goal} · {student.email}</p></div><strong>{student.progress}%</strong></div><div className="report-metrics report-metrics-advanced"><ReportMetric label="Aulas concluídas" value={String(completedLessons.length || history.length)} /><ReportMetric label="Carga horária" value={formatStudyTime(studyMinutes)} /><ReportMetric label="Frequência" value={`${attendanceRate}%`} /><ReportMetric label="Tarefas entregues" value={`${delivered}/${assignments.length}`} /><ReportMetric label="Média das tarefas" value={averageGrade === undefined ? '—' : String(averageGrade)} /><ReportMetric label="Progresso geral" value={`${student.progress}%`} /></div><div className="report-dashboard-grid"><article className="report-block"><h3>Evolução nas avaliações</h3><p className="report-block-description">Média das habilidades registradas ao concluir cada aula.</p><EvolutionChart points={trend} fallback={student.progress} /></article><article className="report-block"><h3>Indicadores de acompanhamento</h3><div className="report-kpis"><ReportKpi label="Frequência" value={attendanceRate} /><ReportKpi label="Entrega de tarefas" value={taskRate} /><ReportKpi label="Progresso atual" value={student.progress} /></div></article></div><div className="report-columns"><article className="report-block"><h3>Progresso por habilidade</h3><div className="report-skills">{skills.map((skill) => <SkillBar skill={skill} value={student.skills[skill]} key={skill} />)}</div><div className="report-insight-pills"><span><Award size={14} />Destaque: <b>{strongest}</b></span><span><Target size={14} />Atenção: <b>{attention}</b></span></div></article><article className="report-block"><h3>Observações do professor</h3><p className="report-note">{student.notes || 'Nenhuma observação geral registrada.'}</p><h3>Tarefas no período</h3><div className="report-task-list">{assignments.length ? assignments.slice(0, 6).map((assignment) => <div key={assignment.id}><span className={`assignment-status ${assignment.status.toLowerCase()}`}>{assignment.status}</span><div><strong>{assignment.title}</strong><small>Prazo: {formatDate(assignment.dueDate)}{typeof assignment.grade === 'number' ? ` · Nota ${assignment.grade}` : ''}</small></div></div>) : <p className="report-note">Nenhuma tarefa no período.</p>}</div></article></div><article className="report-block"><h3>Histórico de aulas</h3><div className="report-history report-history-grid">{reportHistory.length ? reportHistory.map((lesson) => <div key={lesson.id}><time>{formatDate(lesson.date)}</time><strong>{lesson.topic}</strong><p>{lesson.notes || 'Sem observações.'}</p><div className="lesson-meta">{lesson.attendance && <span>Presença: {lesson.attendance}</span>}{lesson.homework && <small>Tarefa: {lesson.homework}</small>}</div></div>) : <p className="report-note">Nenhuma aula registrada neste período.</p>}</div></article></section>;
}

function ReportHeader({ title, startDate, endDate }: { title: string; startDate: string; endDate: string }) { return <header className="report-header"><div><span>LANGSPOT</span><h2>{title}</h2><p>{formatDate(startDate)} a {formatDate(endDate)}</p></div><GraduationCap size={34} /></header>; }
function ReportMetric({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function StatusBars({ data }: { data: { label: string; value: number }[] }) { const total = Math.max(data.reduce((sum, item) => sum + item.value, 0), 1); return <div className="status-bars">{data.map((item) => <div key={item.label}><div><span>{item.label}</span><b>{item.value}</b></div><span><i style={{ width: `${Math.round(item.value / total * 100)}%` }} /></span></div>)}</div>; }
function EvolutionChart({ points, fallback }: { points: { label: string; value: number }[]; fallback: number }) { const data = points.length ? points : [{ label: 'Atual', value: fallback }]; return <div className="evolution-chart" role="img" aria-label="Gráfico de evolução das avaliações">{data.map((point) => <div className="evolution-column" key={`${point.label}-${point.value}`}><div className="evolution-value">{point.value}%</div><div className="evolution-track"><i style={{ height: `${Math.max(point.value, 6)}%` }} /></div><span>{point.label}</span></div>)}</div>; }
function ReportKpi({ label, value }: { label: string; value: number }) { return <div className="report-kpi"><div style={{ background: `conic-gradient(#7655f3 ${Math.max(0, Math.min(100, value)) * 3.6}deg, #ece9fb 0deg)` }}><span>{value}%</span></div><strong>{label}</strong></div>; }

function LessonsPage({ students, lessons, onNew, onEdit, onComplete, onCancel }: { students: Student[]; lessons: ScheduledLesson[]; onNew: () => void; onEdit: (lesson: ScheduledLesson) => void; onComplete: (lesson: ScheduledLesson) => void; onCancel: (id: Id) => void }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [studentFilter, setStudentFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState<LessonStatus | 'Todos'>('Todos');
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const visible = lessons.filter((lesson) => {
    const inWeek = lesson.date >= toDateInput(weekStart) && lesson.date <= toDateInput(days[6]);
    return inWeek && (studentFilter === 'Todos' || lesson.studentId === studentFilter) && (statusFilter === 'Todos' || lesson.status === statusFilter);
  });

  return <div className="agenda-layout">
    <section className="agenda-toolbar panel">
      <div className="week-controls"><button className="icon-button" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft size={18} /></button><button className="today-button" onClick={() => setWeekStart(startOfWeek(new Date()))}>Hoje</button><button className="icon-button" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight size={18} /></button><div><p className="eyebrow">SEMANA</p><strong>{formatWeekRange(weekStart)}</strong></div></div>
      <div className="agenda-filters"><select value={studentFilter} onChange={(event) => setStudentFilter(event.target.value)}><option>Todos</option>{students.map((student) => <option value={student.id} key={student.id}>{student.name}</option>)}</select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as LessonStatus | 'Todos')}><option>Todos</option><option>Agendada</option><option>Concluída</option><option>Cancelada</option></select></div>
    </section>
    <section className="week-grid">
      {days.map((day) => {
        const dayLessons = visible.filter((lesson) => lesson.date === toDateInput(day)).sort((a, b) => a.startTime.localeCompare(b.startTime));
        const isToday = toDateInput(day) === toDateInput(new Date());
        return <article className={`day-column${isToday ? ' today' : ''}`} key={day.toISOString()}>
          <header><span>{new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(day).replace('.', '')}</span><strong>{day.getDate()}</strong></header>
          <div className="day-lessons">{dayLessons.map((lesson) => <AgendaLessonCard key={lesson.id} lesson={lesson} student={students.find((student) => student.id === lesson.studentId)} onEdit={onEdit} onComplete={onComplete} onCancel={onCancel} />)}{!dayLessons.length && <span className="free-day">Livre</span>}</div>
        </article>;
      })}
    </section>
    {!visible.length && <section className="panel empty-state small"><CalendarDays size={34} /><h3>Nenhuma aula nesta semana</h3><p>Ajuste os filtros ou agende uma nova aula.</p><button className="secondary-button compact" onClick={onNew}><Plus size={16} />Nova aula</button></section>}
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
function StudentList({ students, schedule = [], onOpen }: { students: Student[]; schedule?: ScheduledLesson[]; onOpen: (id: Id) => void }) { return <div className="student-list">{students.map((student) => { const nextLesson = nextScheduledLessonForStudent(student.id, schedule); return <article className="student-row" key={student.id}><div className="avatar">{initials(student.name)}</div><div className="student-main"><strong>{student.name}</strong><span>{student.level} · {student.goal}</span></div><Progress value={student.progress} /><div className="next-class"><span>Próxima aula</span><strong>{formatNextLesson(nextLesson)}</strong></div><button className="icon-button" onClick={() => onOpen(student.id)} aria-label={`Abrir perfil de ${student.name}`}><ChevronRight size={18} /></button></article>; })}</div>; }

function StudentProfile({ student, onNewLesson, onSkillChange, onDelete }: { student: Student; onNewLesson: () => void; onSkillChange: (skill: Skill, value: number) => void; onDelete: () => void }) {
  return <div className="profile-layout">
    <section className="panel student-summary"><div className="profile-identity"><div className="avatar large">{initials(student.name)}</div><div><span className="status-badge">{student.status}</span><h2>{student.name}</h2><p>{student.email}</p></div></div><div className="detail-grid"><Detail label="Nível" value={student.level} /><Detail label="Objetivo" value={student.goal} /><Detail label="Idade" value={student.age || '—'} /><Detail label="Próxima aula" value={student.nextClass || 'Não agendada'} /></div><div className="note-box"><strong>Observações</strong><p>{student.notes || 'Nenhuma observação adicionada.'}</p></div><button className="danger-button student-delete" onClick={onDelete}><Trash2 size={16} />Excluir aluno</button></section>
    <section className="panel"><div className="panel-heading"><div><p className="eyebrow">AVALIAÇÃO</p><h3>Progresso por habilidade</h3></div><strong className="overall-score">{student.progress}%</strong></div><div className="skill-list">{skills.map((skill) => <label className="skill-row" key={skill}><div><strong>{skill}</strong><span>{student.skills[skill]}%</span></div><input type="range" min="0" max="100" value={student.skills[skill]} onChange={(e) => onSkillChange(skill, Number(e.target.value))} /></label>)}</div></section>
    <section className="panel lessons-panel"><div className="panel-heading"><div><p className="eyebrow">HISTÓRICO</p><h3>Aulas registradas</h3></div><button className="secondary-button compact" onClick={onNewLesson}><Plus size={16} />Registrar aula</button></div>{student.lessons.length ? <div className="lesson-list">{student.lessons.map((lesson) => <article className="lesson-card" key={lesson.id}><time>{formatDate(lesson.date)}</time><div><strong>{lesson.topic}</strong><p>{lesson.notes || 'Sem observações.'}</p><div className="lesson-meta">{lesson.attendance && <span>Presença: {lesson.attendance}</span>}{lesson.homework && <small>Tarefa: {lesson.homework}</small>}</div></div></article>)}</div> : <div className="empty-state small"><CalendarDays size={32} /><h3>Nenhuma aula registrada</h3><p>Registre a primeira aula deste aluno.</p></div>}</section>
  </div>;
}

function StudentModal({ onClose, onSave }: { onClose: () => void; onSave: (data: Omit<Student, 'id' | 'progress' | 'skills' | 'lessons'>) => Promise<void> }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      await onSave({ name: String(form.get('name')), email: String(form.get('email')), age: String(form.get('age')), level: String(form.get('level')), goal: String(form.get('goal')), status: 'Ativo', nextClass: String(form.get('nextClass')), notes: String(form.get('notes')) });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível criar a conta do aluno.');
      setBusy(false);
    }
  };
  return <Modal title="Cadastrar novo aluno" onClose={onClose}><form className="form-grid" onSubmit={submit}><div className="auth-message full-field">O aluno receberá uma conta com senha temporária para acessar o portal.</div><Field name="name" label="Nome completo" required /><Field name="email" label="E-mail" type="email" required /><Field name="age" label="Idade" type="number" /><SelectField name="level" label="Nível" options={['A1', 'A2', 'B1', 'B2', 'C1', 'C2']} /><Field name="goal" label="Objetivo" placeholder="Conversação, viagem..." required /><Field name="nextClass" label="Próxima aula" placeholder="Ex.: Sexta, 15:00" /><label className="full-field">Observações<textarea name="notes" rows={4} placeholder="Necessidades, interesses e pontos importantes" /></label>{error && <div className="auth-message full-field">{error}</div>}<div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button" type="submit" disabled={busy}>{busy ? 'Criando conta...' : 'Salvar e criar acesso'}</button></div></form></Modal>;
}

function TemporaryAccessModal({ access, onClose }: { access: { name: string; email: string; password: string }; onClose: () => void }) {
  const copy = () => navigator.clipboard.writeText(`Acesso ao LangSpot\nE-mail: ${access.email}\nSenha temporária: ${access.password}`);
  return <Modal title="Acesso do aluno criado" onClose={onClose}><div className="temporary-access"><p>Envie estes dados para <strong>{access.name}</strong>. A senha será solicitada apenas no primeiro acesso e não ficará disponível novamente.</p><div><span>E-mail</span><strong>{access.email}</strong></div><div><span>Senha temporária</span><strong>{access.password}</strong></div><button className="primary-button" onClick={copy}><Copy size={16} />Copiar dados de acesso</button></div><div className="form-actions"><button className="cancel-button" onClick={onClose}>Concluir</button></div></Modal>;
}

function LessonModal({ studentName, onClose, onSave }: { studentName: string; onClose: () => void; onSave: (lesson: Omit<Lesson, 'id'>) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); onSave({ date: String(form.get('date')), topic: String(form.get('topic')), notes: String(form.get('notes')), homework: String(form.get('homework')) }); };
  return <Modal title={`Registrar aula · ${studentName}`} onClose={onClose}><form className="form-grid" onSubmit={submit}><Field name="date" label="Data" type="date" required /><Field name="topic" label="Tema da aula" required /><label className="full-field">Observações<textarea name="notes" rows={4} placeholder="Desempenho, dificuldades e conquistas" /></label><label className="full-field">Tarefa de casa<textarea name="homework" rows={3} placeholder="Atividade para a próxima aula" /></label><div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button" type="submit">Registrar aula</button></div></form></Modal>;
}

function ScheduleLessonModal({ students, lesson, onClose, onSave }: { students: Student[]; lesson?: ScheduledLesson; onClose: () => void; onSave: (lesson: Omit<ScheduledLesson, 'id' | 'status' | 'notes' | 'homework'>) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); onSave({ studentId: String(form.get('studentId')), date: String(form.get('date')), startTime: String(form.get('startTime')), duration: Number(form.get('duration')), topic: String(form.get('topic')), onlineUrl: String(form.get('onlineUrl')).trim() }); };
  return <Modal title={lesson ? 'Editar aula' : 'Agendar nova aula'} onClose={onClose}><form className="form-grid" onSubmit={submit}><label>Aluno<select name="studentId" defaultValue={lesson?.studentId ?? students[0]?.id} required>{students.map((student) => <option value={student.id} key={student.id}>{student.name} · {student.level}</option>)}</select></label><Field name="topic" label="Tema da aula" defaultValue={lesson?.topic} required /><Field name="date" label="Data" type="date" defaultValue={lesson?.date ?? toDateInput(new Date())} required /><Field name="startTime" label="Horário" type="time" defaultValue={lesson?.startTime ?? '14:00'} required /><label>Duração<select name="duration" defaultValue={lesson?.duration ?? 60}><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="50">50 minutos</option><option value="60">60 minutos</option><option value="90">90 minutos</option></select></label><Field name="onlineUrl" label="Link da aula online" type="url" defaultValue={lesson?.onlineUrl} placeholder="https://meet.google.com/..." /><div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button" type="submit">{lesson ? 'Salvar alterações' : 'Agendar aula'}</button></div></form></Modal>;
}

function CompleteLessonModal({ lesson, student, onClose, onSave }: { lesson: ScheduledLesson; student?: Student; onClose: () => void; onSave: (notes: string, homework: string, attendance: AttendanceStatus, skillScores: Record<Skill, number>) => void }) {
  const [attendance, setAttendance] = useState<AttendanceStatus>('Presente');
  const [skillScores, setSkillScores] = useState<Record<Skill, number>>(student?.skills ?? defaultSkills());
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); onSave(String(form.get('notes')), String(form.get('homework')), attendance, skillScores); };
  return <Modal title={`Concluir aula · ${student?.name ?? 'Aluno'}`} onClose={onClose}><div className="completion-summary"><CalendarDays size={18} /><div><strong>{lesson.topic}</strong><span>{formatDate(lesson.date)} às {lesson.startTime}</span></div></div><form className="form-grid" onSubmit={submit}><label>Presença<select value={attendance} onChange={(event) => setAttendance(event.target.value as AttendanceStatus)}><option>Presente</option><option>Ausente</option><option>Remarcada</option></select></label><label className="full-field">Observações<textarea name="notes" rows={4} placeholder="Desempenho, dificuldades e conquistas" required /></label><label className="full-field">Tarefa de casa<textarea name="homework" rows={3} placeholder="Atividade para a próxima aula" /></label><div className="full-field completion-skills"><div><strong>Avaliação rápida</strong><span>Atualize as habilidades observadas nesta aula.</span></div>{skills.map((skill) => <label className="skill-row" key={skill}><div><strong>{skill}</strong><span>{skillScores[skill]}%</span></div><input type="range" min="0" max="100" value={skillScores[skill]} onChange={(event) => setSkillScores((current) => ({ ...current, [skill]: Number(event.target.value) }))} /></label>)}</div><div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Voltar</button><button className="primary-button" type="submit"><Check size={17} />Concluir e registrar</button></div></form></Modal>;
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

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal" onMouseDown={(e) => e.stopPropagation()}><div className="modal-header"><h2>{title}</h2><button className="icon-button" onClick={onClose}><X size={18} /></button></div>{children}</section></div>; }
function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) { return <label>{label}<input {...props} /></label>; }
function SelectField({ name, label, options }: { name: string; label: string; options: string[] }) { return <label>{label}<select name={name}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }

function AssignmentsPage({ assignments, students, onNew, onDelete, onReview }: { assignments: Assignment[]; students: Student[]; onNew: () => void; onDelete: (assignment: Assignment) => void; onReview: (assignment: Assignment) => void }) {
  const ordered = [...assignments].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const studentName = (id: Id) => students.find((student) => student.id === id)?.name ?? 'Aluno';
  const statusCount = (status: AssignmentStatus) => assignments.filter((assignment) => assignment.status === status).length;
  return <>
    <div className="assignment-summary-grid">
      <article><ClipboardList size={18} /><span>Pendentes</span><strong>{statusCount('Pendente')}</strong></article>
      <article><Clock3 size={18} /><span>Entregues</span><strong>{statusCount('Entregue')}</strong></article>
      <article><Check size={18} /><span>Corrigidas</span><strong>{statusCount('Corrigida')}</strong></article>
    </div>
    <section className="panel assignments-panel">
      <div className="panel-heading assignments-heading"><div><p className="eyebrow">ATIVIDADES</p><h3>Tarefas e entregas</h3><p>Acompanhe prazos, respostas e correções dos alunos.</p></div><button className="secondary-button compact" onClick={onNew}><Plus size={16} />Nova tarefa</button></div>
      {ordered.length ? <div className="assignment-board">{ordered.map((assignment) => <article className="assignment-card" key={assignment.id}>
        <div className="assignment-card-top">
          <div className="assignment-card-title"><div className="assignment-status-line"><span className={`assignment-status ${assignment.status.toLowerCase()}`}>{assignment.status}</span><span className="assignment-student-name">{studentName(assignment.studentId)}</span></div><h3>{assignment.title}</h3></div>
          <div className="assignment-due"><span>Prazo</span><strong>{new Date(`${assignment.dueDate}T12:00:00`).toLocaleDateString('pt-BR')}</strong></div>
        </div>
        <div className="assignment-instructions"><span>Instruções</span><p>{assignment.instructions}</p></div>
        {assignment.submissionText && <div className="submission-preview"><strong>Resposta do aluno</strong><p>{assignment.submissionText}</p></div>}
        {assignment.feedback && <div className="feedback-preview"><strong>Feedback</strong><p>{assignment.feedback}</p>{assignment.grade !== undefined && <span className="assignment-grade">Nota: {assignment.grade}</span>}</div>}
        <div className="assignment-card-actions">{assignment.status === 'Entregue' && <button className="assignment-review-button" onClick={() => onReview(assignment)}><Check size={15} />Corrigir tarefa</button>}<button className="assignment-delete-button" onClick={() => onDelete(assignment)} aria-label={`Excluir ${assignment.title}`}><Trash2 size={15} />Excluir</button></div>
      </article>)}</div> : <div className="empty-state"><ClipboardList size={38} /><h3>Nenhuma tarefa criada</h3><p>Crie atividades com prazo e acompanhe as entregas dos alunos.</p><button className="primary-button" onClick={onNew}><Plus size={16} />Criar primeira tarefa</button></div>}
    </section>
  </>;
}

function AssignmentModal({ students, materials, onClose, onSave }: { students: Student[]; materials: Material[]; onClose: () => void; onSave: (input: AssignmentInput) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); onSave({ studentId: String(form.get('studentId')), materialId: String(form.get('materialId') || '') || undefined, title: String(form.get('title')), instructions: String(form.get('instructions')), dueDate: String(form.get('dueDate')) }); };
  return <Modal title="Nova tarefa" onClose={onClose}><form className="form-grid" onSubmit={submit}><label>Aluno<select name="studentId" required defaultValue=""><option value="" disabled>Selecione</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label><label>Prazo<input name="dueDate" type="date" required min={toDateInput(new Date())} /></label><label className="full-field">Título<input name="title" required placeholder="Ex.: Reading comprehension — Unit 3" /></label><label className="full-field">Material vinculado <span>(opcional)</span><select name="materialId"><option value="">Nenhum</option>{materials.map((material) => <option key={material.id} value={material.id}>{material.title}</option>)}</select></label><label className="full-field">Instruções<textarea name="instructions" rows={5} required placeholder="Explique o que o aluno deve fazer e como entregar." /></label><div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button"><ClipboardList size={16} />Criar tarefa</button></div></form></Modal>;
}

function ReviewAssignmentModal({ assignment, onClose, onSave }: { assignment: Assignment; onClose: () => void; onSave: (feedback: string, grade?: number) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); const raw = String(form.get('grade') || ''); onSave(String(form.get('feedback')), raw ? Number(raw) : undefined); };
  return <Modal title="Corrigir tarefa" onClose={onClose}><div className="submission-preview"><strong>Resposta do aluno</strong><p>{assignment.submissionText || 'Nenhuma resposta em texto.'}</p></div><form className="form-grid" onSubmit={submit}><label className="full-field">Feedback<textarea name="feedback" rows={5} required defaultValue={assignment.feedback ?? ''} /></label><label>Nota <span>(opcional)</span><input name="grade" type="number" min="0" max="100" defaultValue={assignment.grade ?? ''} /></label><div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button"><Check size={16} />Salvar correção</button></div></form></Modal>;
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
