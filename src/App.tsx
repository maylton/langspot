import { buildTeacherNotifications } from './lib/teacherNotifications';
import { ArrowLeft, Bell, BookOpen, CalendarDays, ChartNoAxesCombined, CircleUserRound, ClipboardList, FileQuestion, FileText, GraduationCap, LayoutDashboard, LogOut, Menu, MoreHorizontal, Plus, Settings, UsersRound, WalletCards, WifiOff, X } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { ClassPlayLink } from './components/ClassPlayLink';
import { NotificationBell } from './components/NotificationBell';
import { confirmAction, showAlert } from './components/dialogs';
import { can } from './config/env';
import { mockMaterials, mockSchedule, mockSettings, mockStudents, resetToMockData } from './config/mockData';
import { toDateInput } from './lib/dates';
import { PlaceholderPage } from './components/ui';
import { formatNotificationDate } from './lib/format';
import { formatNextLesson, scheduledToHistory } from './lib/lessons';
import { averageSkillScore, defaultSkills, skills } from './lib/skills';
import { AssignmentModal, ConfirmAssignmentDelete, ReviewAssignmentModal } from './teacher/modals/AssignmentModals';
import { CompleteLessonModal, ConfirmLessonDelete, LessonModal, LessonRecordModal, ScheduleLessonModal } from './teacher/modals/LessonModals';
import { AssignMaterialModal, DeleteMaterialModal, MaterialModal } from './teacher/modals/MaterialModals';
import { QuestionBankModal } from './teacher/modals/QuizModals';
import { DeleteStudentModal, StudentEditModal, StudentModal, TemporaryAccessModal } from './teacher/modals/StudentModals';
import { AssignmentsPage } from './teacher/pages/AssignmentsPage';
import { Dashboard } from './teacher/pages/Dashboard';
import { FinancePage, PaymentModal } from './teacher/pages/FinancePage';
import { LessonsPage } from './teacher/pages/LessonsPage';
import { MaterialsPage } from './teacher/pages/MaterialsPage';
import { NotificationsPage } from './teacher/pages/NotificationsPage';
import { ProgressPage } from './teacher/pages/ProgressPage';
import { ReportsPage } from './teacher/pages/ReportsPage';
import { SettingsPage } from './teacher/pages/SettingsPage';
import { StudentProfile } from './teacher/pages/StudentProfile';
import { StudentsPage } from './teacher/pages/StudentsPage';
import { type AccountAccessInfo, type AppNotification, type Assignment, type AssignmentFormMode, type AssignmentInput, type AssignmentStatus, type Id, type Lesson, type LessonRecordInput, type Material, type MaterialInput, type Payment, type PaymentInput, type PaymentStatus, type PlatformSettings, type QuestionBankInput, type QuestionBankItem, type ScheduledLesson, type ScheduledLessonInput, type Skill, type Student, type StudentAccountResult, type StudentCreateInput, type TextComment, type View } from './types';

// Use mock settings if mock data is enabled, otherwise use empty defaults
const defaultSettings: PlatformSettings = can.useMockData() ? mockSettings : { teacherName: '', email: '', whatsappPhone: '', schoolName: '', avatar: '', defaultDuration: 60, defaultOnlineUrl: '', compactMode: false, theme: 'light', confirmCancellations: true };

export const navigation: { label: View; icon: typeof LayoutDashboard }[] = [
  { label: 'Visão geral', icon: LayoutDashboard },
  { label: 'Notificações', icon: Bell },
  { label: 'Alunos', icon: UsersRound },
  { label: 'Aulas', icon: CalendarDays },
  { label: 'Materiais', icon: BookOpen },
  { label: 'Tarefas', icon: ClipboardList },
  { label: 'Quiz', icon: FileQuestion },
  ...(can.useAssessments() ? [{ label: 'Avaliações' as View, icon: ClipboardList }] : []),
  { label: 'Financeiro', icon: WalletCards },
  { label: 'Progresso', icon: ChartNoAxesCombined },
  { label: 'Relatórios', icon: FileText },
  { label: 'Configurações', icon: Settings },
];

export function App({ onLogout, onInviteStudent, onInviteTeacher, onManageTeachers, onCreateStudentAccount, onOpenCancellationRequests, cancellationRequestCount = 0, initialSettings, onProfileSettingsChange, authenticatedMode = false, accountAccess, assessmentContent, initialStudents, initialSchedule, initialMaterials, initialAssignments, initialQuestionBank, initialPayments, initialNotifications, onMarkNotificationRead, onMarkAllNotificationsRead, onCreateScheduledLesson, onUpdateScheduledLesson, onCancelScheduledLesson, onCompleteScheduledLesson, onCreateLessonRecord, onUpdateLessonRecord, onDeleteLessonRecord, onUpdateStudentSkills, onUpdateStudentProfile, onDeleteStudent, onPreviewStudent, onCreateMaterial, onDeleteMaterial, onAssignMaterial, onCreateAssignment, onDeleteAssignment, onReviewAssignment, onCreateQuestionBankItem, onDeleteQuestionBankItem, onCreatePayment, onUpdatePaymentStatus, onDeletePayment }: { onLogout?: () => void; onInviteStudent?: () => void; onInviteTeacher?: () => void; onManageTeachers?: () => void; onCreateStudentAccount?: (data: StudentCreateInput) => Promise<StudentAccountResult>; onOpenCancellationRequests?: () => void; cancellationRequestCount?: number; initialSettings?: Partial<PlatformSettings>; onProfileSettingsChange?: (settings: PlatformSettings) => void | Promise<void>; authenticatedMode?: boolean; accountAccess?: AccountAccessInfo; assessmentContent?: ReactNode; initialStudents?: Student[]; initialSchedule?: ScheduledLesson[]; onCreateScheduledLesson?: (lesson: ScheduledLessonInput) => Promise<ScheduledLesson>; onUpdateScheduledLesson?: (id: Id, lesson: ScheduledLessonInput) => Promise<ScheduledLesson>; onCancelScheduledLesson?: (id: Id) => Promise<void>; onCompleteScheduledLesson?: (id: Id, record: LessonRecordInput) => Promise<void>; onCreateLessonRecord?: (studentId: Id, record: LessonRecordInput) => Promise<ScheduledLesson>; onUpdateLessonRecord?: (id: Id, record: LessonRecordInput) => Promise<ScheduledLesson>; onDeleteLessonRecord?: (id: Id) => Promise<void>; onUpdateStudentSkills?: (studentId: Id, skills: Record<Skill, number>) => Promise<void>; onUpdateStudentProfile?: (student: Student) => Promise<void>; onDeleteStudent?: (studentId: Id) => Promise<void>; onPreviewStudent?: (student: Student) => void; initialMaterials?: Material[]; onCreateMaterial?: (material: MaterialInput) => Promise<Material>; onDeleteMaterial?: (id: Id) => Promise<void>; onAssignMaterial?: (materialId: Id, studentIds: Id[]) => Promise<void>; initialAssignments?: Assignment[]; initialQuestionBank?: QuestionBankItem[]; onCreateAssignment?: (assignment: AssignmentInput) => Promise<Assignment>; onDeleteAssignment?: (id: Id) => Promise<void>; onReviewAssignment?: (id: Id, feedback: string, grade?: number, textComments?: TextComment[]) => Promise<void>; onCreateQuestionBankItem?: (question: QuestionBankInput) => Promise<QuestionBankItem>; onDeleteQuestionBankItem?: (id: Id) => Promise<void>; initialPayments?: Payment[]; initialNotifications?: AppNotification[]; onMarkNotificationRead?: (id: Id) => Promise<void>; onMarkAllNotificationsRead?: (ids: Id[]) => Promise<void>; onCreatePayment?: (payment: PaymentInput) => Promise<Payment>; onUpdatePaymentStatus?: (id: Id, status: PaymentStatus) => Promise<void>; onDeletePayment?: (id: Id) => Promise<void> }) {
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
  const automaticNotifications = useMemo(() => buildTeacherNotifications({ students, schedule, assignments, payments, cancellationRequestCount }),
    [students, schedule, assignments, payments, cancellationRequestCount]);
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
    const student: Student = { id: studentId, name: data.name, email: data.email, whatsappPhone: data.whatsappPhone, age: data.age, level: data.level, goal: data.goal, status: data.status, nextClass: createdLesson ? formatNextLesson(createdLesson) : '', notes: data.notes, progress: 50, skills: defaultSkills(), lessons: [] };
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
    if (settings.confirmCancellations && !(await confirmAction({ title: 'Cancelar esta aula?', confirmLabel: 'Sim, cancelar', danger: true }))) return;
    try {
      await onCancelScheduledLesson?.(id);
      setSchedule((current) => current.map((lesson) => lesson.id === id ? { ...lesson, status: 'Cancelada' } : lesson));
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Erro desconhecido.';
      void showAlert(`Não foi possível cancelar a aula. ${detail}`);
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
    if (!(await confirmAction({ title: 'Excluir este registro de aula?', message: 'Esta ação não pode ser desfeita.', confirmLabel: 'Sim, excluir', danger: true }))) return;
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
    } catch (error) { void showAlert(`Não foi possível salvar o material. ${error instanceof Error ? error.message : ''}`); }
  };

  const deleteMaterial = async () => {
    if (!materialToDelete) return;
    try { await onDeleteMaterial?.(materialToDelete.id); setMaterials((current) => current.filter((material) => material.id !== materialToDelete.id)); setMaterialToDelete(null); }
    catch (error) { void showAlert(`Não foi possível excluir o material. ${error instanceof Error ? error.message : ''}`); }
  };

  const assignMaterial = async (studentIds: Id[]) => {
    if (!materialToAssign) return;
    try { await onAssignMaterial?.(materialToAssign.id, studentIds); setMaterials((current) => current.map((m) => m.id === materialToAssign.id ? { ...m, assignedStudentIds: studentIds } : m)); setMaterialToAssign(null); }
    catch (error) { void showAlert(`Não foi possível compartilhar o material. ${error instanceof Error ? error.message : ''}`); }
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
    } catch (error) { void showAlert(error instanceof Error ? error.message : 'Não foi possível criar a tarefa.'); }
  };
  const deleteAssignment = async () => { if (!assignmentToDelete) return; try { await onDeleteAssignment?.(assignmentToDelete.id); setAssignments((current) => current.filter((item) => item.id !== assignmentToDelete.id)); setAssignmentToDelete(null); } catch (error) { void showAlert(error instanceof Error ? error.message : 'Não foi possível excluir a tarefa.'); } };
  const reviewAssignment = async (feedback: string, grade?: number, textComments: TextComment[] = []) => { if (!assignmentToReview) return; try { await onReviewAssignment?.(assignmentToReview.id, feedback, grade, textComments); setAssignments((current) => current.map((item) => item.id === assignmentToReview.id ? { ...item, feedback, grade, textComments, status: 'Corrigida' } : item)); setAssignmentToReview(null); } catch (error) { void showAlert(error instanceof Error ? error.message : 'Não foi possível salvar o feedback.'); } };
  const addQuestionBankItem = async (input: QuestionBankInput) => { try { const created = onCreateQuestionBankItem ? await onCreateQuestionBankItem(input) : { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() }; setQuestionBank((current) => [created, ...current]); } catch (error) { void showAlert(error instanceof Error ? error.message : 'Não foi possível salvar a questão.'); } };
  const deleteQuestionBankItem = async (id: Id) => { if (!(await confirmAction({ title: 'Excluir esta questão do banco?', confirmLabel: 'Sim, excluir', danger: true }))) return; try { await onDeleteQuestionBankItem?.(id); setQuestionBank((current) => current.filter((item) => item.id !== id)); } catch (error) { void showAlert(error instanceof Error ? error.message : 'Não foi possível excluir a questão.'); } };

  const createPayment = async (input: PaymentInput) => { try { const payment = onCreatePayment ? await onCreatePayment(input) : { ...input, id: crypto.randomUUID(), status: 'Pendente' as const, createdAt: new Date().toISOString() }; setPayments((current) => [payment, ...current]); setShowPaymentForm(false); } catch (error) { void showAlert(error instanceof Error ? error.message : 'Não foi possível criar a cobrança.'); } };
  const updatePaymentStatus = async (id: Id, status: PaymentStatus) => { try { await onUpdatePaymentStatus?.(id, status); setPayments((current) => current.map((item) => item.id === id ? { ...item, status, paidAt: status === 'Pago' ? new Date().toISOString() : undefined } : item)); } catch (error) { void showAlert(error instanceof Error ? error.message : 'Não foi possível atualizar o pagamento.'); } };
  const deletePayment = async (id: Id) => { if (!(await confirmAction({ title: 'Excluir esta cobrança?', confirmLabel: 'Sim, excluir', danger: true }))) return; try { await onDeletePayment?.(id); setPayments((current) => current.filter((item) => item.id !== id)); } catch (error) { void showAlert(error instanceof Error ? error.message : 'Não foi possível excluir a cobrança.'); } };

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
  const visibleNavigation = navigation.filter((item) => item.label !== 'Avaliações' || assessmentContent);
  const teacherPrimaryNavigation = visibleNavigation.filter((item) => ['Visão geral', 'Alunos', 'Aulas', 'Quiz'].includes(item.label));
  const teacherMoreNavigation = visibleNavigation.filter((item) => !teacherPrimaryNavigation.some((primary) => primary.label === item.label));
  const teacherMoreActive = !selected && teacherMoreNavigation.some((item) => item.label === active);

  return (
    <div className="app-shell">
      {mobileMenuOpen && <button className="sidebar-backdrop" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)} />}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="brand"><div className="brand-mark"><GraduationCap size={24} /></div><div><strong>LangSpot</strong><span>Teacher Workspace</span></div><button className="mobile-menu-close" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)}><X size={20} /></button></div>
        <nav className="desktop-nav">{visibleNavigation.map(({ label, icon: Icon }) => <button key={label} className={active === label && !selected ? 'nav-item active' : 'nav-item'} onClick={() => navigateTo(label)}><Icon size={19} /><span>{label}</span>{label === 'Notificações' && unreadNotificationCount > 0 && <b className="nav-badge">{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</b>}</button>)}</nav>
        <nav className="mobile-bottom-nav">{teacherPrimaryNavigation.map(({ label, icon: Icon }) => <button key={label} className={active === label && !selected ? 'nav-item active' : 'nav-item'} onClick={() => navigateTo(label)}><Icon size={19} /><span>{label}</span></button>)}<button type="button" className={teacherMoreActive || mobileMoreOpen ? 'nav-item active mobile-more-button' : 'nav-item mobile-more-button'} onClick={() => setMobileMoreOpen((open) => !open)}><MoreHorizontal size={19} /><span>Mais</span>{teacherMoreNavigation.some((item) => item.label === 'Notificações') && unreadNotificationCount > 0 && <b className="nav-badge">{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</b>}</button>{mobileMoreOpen && <div className="mobile-more-menu">{teacherMoreNavigation.map(({ label, icon: Icon }) => <button key={label} type="button" className={active === label && !selected ? 'active' : ''} onClick={() => navigateTo(label)}><Icon size={17} /><span>{label}</span>{label === 'Notificações' && unreadNotificationCount > 0 && <b className="nav-badge">{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</b>}</button>)}</div>}</nav>
        <div className="sidebar-footer"><ClassPlayLink area="teacher" variant="footer" /><button className={active === 'Configurações' ? 'nav-item active' : 'nav-item'} onClick={() => navigateTo('Configurações')}><Settings size={19} /><span>Configurações</span></button>{onLogout && <button className="compact-logout-button" onClick={onLogout} title="Sair da conta" aria-label="Sair da conta"><LogOut size={19} /><span>Sair</span></button>}<div className="profile-card">{settings.avatar ? <img className="teacher-avatar" src={settings.avatar} alt={`Avatar de ${settings.teacherName}`} /> : <CircleUserRound size={34} />}<div><strong>{settings.teacherName}</strong><span>Professor</span></div>{onLogout && <button onClick={onLogout} title="Sair da conta" aria-label="Sair da conta"><LogOut size={16} /></button>}</div></div>
      </aside>

      <main>
        <header className="topbar">
          <button className="mobile-menu-button" aria-label="Abrir menu" onClick={() => setMobileMenuOpen(true)}><Menu size={21} /></button>
          <div className="topbar-title">{selected && <button className="back-button" onClick={() => setSelectedId(null)}><ArrowLeft size={16} /> Voltar para alunos</button>}<p className="eyebrow">PAINEL DO PROFESSOR</p><h1>{pageTitle}</h1></div>
          {active !== 'Configurações' && <div className="topbar-actions"><ClassPlayLink area="teacher" variant="topbar" /><NotificationBell unreadCount={unreadNotificationCount} items={notifications.map((item) => ({ id: item.id, kind: item.kind, title: item.title, description: item.description, dateLabel: formatNotificationDate(item.date), unread: !notificationReadIds.includes(item.id), urgent: item.urgent }))} onOpen={(id) => { const item = notifications.find((entry) => entry.id === id); if (item) openNotification(item); }} onMarkAll={markAllNotificationsRead} onViewAll={() => navigateTo('Notificações')} />{onOpenCancellationRequests && active === 'Aulas' && !selected && <button className="invite-button" onClick={onOpenCancellationRequests}><Bell size={17} />Solicitações{cancellationRequestCount > 0 ? ` (${cancellationRequestCount})` : ''}</button>}{active === 'Alunos' && !selected && <button className="invite-button" onClick={onInviteStudent ?? (() => setShowStudentForm(true))}><UsersRound size={17} />Convidar aluno</button>}{active !== 'Notificações' && topbarPrimaryAction && <button className="primary-button" onClick={topbarPrimaryAction.run}><Plus size={18} />{topbarPrimaryAction.label}</button>}</div>}
          <div className="teacher-account-menu"><button type="button" className="teacher-account-avatar" aria-label="Abrir menu do perfil" aria-expanded={accountMenuOpen} onClick={() => setAccountMenuOpen((open) => !open)}>{settings.avatar ? <img src={settings.avatar} alt={`Avatar de ${settings.teacherName}`} /> : <CircleUserRound size={22} />}</button>{accountMenuOpen && <div className="student-account-popover teacher-account-popover"><div><strong>{settings.teacherName || 'Professor'}</strong><span>{settings.email || settings.schoolName || 'Teacher Workspace'}</span></div><button type="button" onClick={() => navigateTo('Configurações')}><Settings size={16} />Perfil e configurações</button>{onLogout && <button type="button" className="student-account-logout" onClick={onLogout}><LogOut size={16} />Sair</button>}</div>}</div>
        </header>

        {!isOnline && <div className="offline-banner" role="status"><WifiOff size={17} /><span>Você está offline. Alterações que dependem do Supabase podem não ser salvas até a conexão voltar.</span></div>}

        {selected ? <StudentProfile student={selected} onNewLesson={() => setCreatingLessonRecord(true)} onSkillChange={updateSkill} onEdit={() => setStudentToEdit(selected)} onDelete={() => setStudentToDelete(selected)} onPreview={() => onPreviewStudent?.(selected)} onEditLesson={setLessonRecordToEdit} onDeleteLesson={setLessonRecordToDelete} /> : active === 'Visão geral' ? <Dashboard teacherName={settings.teacherName} students={students} schedule={schedule} averageProgress={averageProgress} authenticatedMode={authenticatedMode} onOpenStudent={(id) => { setSelectedId(id); setActive('Alunos'); }} onOpenSchedule={() => setActive('Aulas')} /> : active === 'Notificações' ? <NotificationsPage notifications={notifications} readIds={notificationReadIds} onOpen={openNotification} onMarkAll={markAllNotificationsRead} /> : active === 'Alunos' ? <StudentsPage students={filteredStudents} schedule={schedule} query={query} setQuery={setQuery} onOpen={setSelectedId} /> : active === 'Aulas' ? <LessonsPage students={students} lessons={schedule} onNew={(date) => setLessonToEdit({ ...newLessonDraft(), date: date ?? toDateInput(new Date()) })} onEdit={setLessonToEdit} onComplete={setLessonToComplete} onCancel={cancelScheduledLesson} /> : active === 'Materiais' ? <MaterialsPage materials={materials} onNew={() => setShowMaterialForm(true)} onDelete={setMaterialToDelete} onAssign={setMaterialToAssign} /> : active === 'Tarefas' ? <AssignmentsPage assignments={assignments.filter((assignment) => assignment.assignmentType !== 'interactive')} students={students} mode="tasks" onNew={() => setAssignmentFormMode('regular')} onDelete={setAssignmentToDelete} onReview={setAssignmentToReview} /> : active === 'Quiz' ? <AssignmentsPage assignments={assignments.filter((assignment) => assignment.assignmentType === 'interactive')} students={students} mode="quiz" onNew={() => setAssignmentFormMode('interactive')} onManageBank={() => setShowQuestionBank(true)} onDelete={setAssignmentToDelete} onReview={setAssignmentToReview} /> : active === 'Avaliações' ? assessmentContent ?? <PlaceholderPage title={active} /> : active === 'Financeiro' ? <FinancePage payments={payments} students={students} onNew={() => setShowPaymentForm(true)} onStatus={updatePaymentStatus} onDelete={deletePayment} /> : active === 'Progresso' ? <ProgressPage students={students} onOpenStudent={(id) => { setSelectedId(id); setActive('Alunos'); }} /> : active === 'Relatórios' ? <ReportsPage students={students} schedule={schedule} assignments={assignments} /> : active === 'Configurações' ? <SettingsPage settings={settings} authenticatedMode={authenticatedMode} accountAccess={accountAccess} onSave={saveSettings} counts={{ students: students.length, lessons: schedule.length, materials: materials.length }} onExport={exportData} onReset={resetData} onInviteTeacher={onInviteTeacher} onManageTeachers={onManageTeachers} /> : <PlaceholderPage title={active} />}
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

export default App;
