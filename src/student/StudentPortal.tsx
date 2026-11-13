import { ArrowLeft, Award, Bell, BookOpen, Brain, CalendarDays, ClipboardList, Eye, FileQuestion, Flag, GraduationCap, LayoutDashboard, LoaderCircle, LogOut, MoreHorizontal, NotebookPen, UserRound } from 'lucide-react';
import { type ComponentProps, Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { ClassPlayLink } from '../components/ClassPlayLink';
import { NotificationBell } from '../components/NotificationBell';
import { can } from '../config/env';
import { CancellationRequest, DbAssignment, DbLesson, DbMaterial, DbNotification, LearningGoal, LearningJournalEntry, Profile, StreakFreeze, StudentRecord, StudyActivity, supabase } from '../supabase';
import { formatNotificationDate, initials } from '../lib/format';
import { type StudentNotification, mapDbNotificationToStudent } from '../lib/notifications';
import { isSchemaCacheMiss } from '../lib/supabaseHelpers';
import { CancellationModal } from './components/CancellationModal';
import { StudentAchievements } from './pages/StudentAchievements';
import { StudentAssignments } from './pages/StudentAssignments';
import { StudentFlashcards } from './pages/StudentFlashcards';
import { StudentGoals } from './pages/StudentGoals';
import { StudentJournal } from './pages/StudentJournal';
import { StudentLessons } from './pages/StudentLessons';
import { StudentMaterials } from './pages/StudentMaterials';
import { StudentNotificationsPage } from './pages/StudentNotificationsPage';
import { StudentOverview } from './pages/StudentOverview';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { StudentProgress } from './pages/StudentProgress';
import { toDateInput } from '../lib/dates';
import { type StudentTab } from './types';

const LazyAssessmentHub = lazy(() => import('../domains/assessments/student/AssessmentHub').then((module) => ({ default: module.AssessmentHub })));

const AssessmentHub = (props: ComponentProps<typeof LazyAssessmentHub>) => <Suspense fallback={<div className="assessment-loading"><LoaderCircle className="spin" size={24} />Carregando avaliações…</div>}><LazyAssessmentHub {...props} /></Suspense>;

export function StudentPortal({ profile, onLogout, previewMode = false, previewTeacherName = '' }: { profile: Profile; onLogout: () => void; previewMode?: boolean; previewTeacherName?: string }) {
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
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [lessonToCancel, setLessonToCancel] = useState<DbLesson | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => localStorage.getItem(`langspot.studentTheme.${profile.id}`) === 'dark' ? 'dark' : 'light');

  const loadPortal = async () => {
    if (!supabase) return;
    setLoading(true);
    setLoadError('');
    const [profileResult, recordResult, lessonResult, assignmentResult, taskResult, goalResult, journalResult, activityResult, freezeResult, requestResult, notificationResult, userResult] = await Promise.all([
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
      supabase.from('notifications').select('*').lte('scheduled_for', new Date().toISOString()).order('scheduled_for', { ascending: false }).limit(50),
      previewMode ? Promise.resolve({ data: { user: null }, error: null }) : supabase.auth.getUser(),
    ]);
    const errors = [profileResult.error, recordResult.error, lessonResult.error, assignmentResult.error, taskResult.error, goalResult.error, journalResult.error, activityResult.error, requestResult.error, freezeResult.error && !isSchemaCacheMiss(freezeResult.error) ? freezeResult.error : null, notificationResult.error && !isSchemaCacheMiss(notificationResult.error) ? notificationResult.error : null].filter(Boolean);
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
    setNotifications(((notificationResult.data ?? []) as DbNotification[]).map(mapDbNotificationToStudent));
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
  const todayKey = toDateInput(new Date());
  const hasStudyToday = studyActivities.some((activity) => activity.activity_date === todayKey) || streakFreezes.some((freeze) => freeze.protected_date === todayKey);
  const missionNotification = !hasStudyToday ? [{
    id: `mission-${profile.id}-${todayKey}`,
    kind: 'mission' as const,
    title: 'Missão diária disponível',
    description: 'Complete uma ação de estudo hoje para ativar seu streak.',
    date: new Date().toISOString(),
    target: 'Visão geral' as StudentTab,
    urgent: true,
    readAt: null,
  }] : [];
  const studentNotifications = useMemo(() => [...missionNotification, ...notifications].sort((a, b) => Number(Boolean(b.urgent)) - Number(Boolean(a.urgent)) || new Date(b.date).getTime() - new Date(a.date).getTime()), [missionNotification, notifications]);
  const unreadStudentNotifications = studentNotifications.filter((item) => !item.readAt).length;
  const requestByLesson = (lessonId: string) => requests.find((request) => request.lesson_id === lessonId);
  const navigateStudent = (nextTab: StudentTab) => {
    setTab(nextTab);
    setAccountMenuOpen(false);
    setMobileMoreOpen(false);
  };
  const markStudentNotificationRead = async (id: string) => {
    if (id.startsWith('mission-')) return;
    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, readAt } : item));
    const { error } = await supabase!.from('notifications').update({ read_at: readAt }).eq('id', id);
    if (error) await loadPortal();
  };
  const markAllStudentNotificationsRead = async () => {
    const ids = studentNotifications.filter((item) => !item.id.startsWith('mission-')).map((item) => item.id);
    if (!ids.length) return;
    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((item) => ids.includes(item.id) ? { ...item, readAt } : item));
    const { error } = await supabase!.from('notifications').update({ read_at: readAt }).in('id', ids);
    if (error) await loadPortal();
  };
  const openStudentNotification = (notification: StudentNotification) => {
    void markStudentNotificationRead(notification.id);
    navigateStudent(notification.target);
  };
  const nav: { label: StudentTab; icon: typeof LayoutDashboard }[] = [
    { label: 'Visão geral', icon: LayoutDashboard },
    { label: 'Notificações', icon: Bell },
    { label: 'Aulas', icon: CalendarDays },
    { label: 'Tarefas', icon: ClipboardList },
    { label: 'Quiz', icon: FileQuestion },
    ...(can.useAssessments() && supabase ? [{ label: 'Avaliações' as StudentTab, icon: ClipboardList }] : []),
    { label: 'Materiais', icon: BookOpen },
    { label: 'Flashcards', icon: Brain },
    { label: 'Metas', icon: Flag },
    { label: 'Conquistas', icon: Award },
    { label: 'Diário', icon: NotebookPen },
    { label: 'Progresso', icon: GraduationCap },
    { label: 'Perfil', icon: UserRound },
  ];
  const primaryNav = nav.filter((item) => ['Visão geral', 'Aulas', 'Quiz', 'Flashcards'].includes(item.label));
  const moreNav = nav.filter((item) => !primaryNav.some((primary) => primary.label === item.label));
  const moreActive = moreNav.some((item) => item.label === tab);

  if (loading) return <div className="auth-loading"><LoaderCircle className="spin" size={30} />Carregando seu portal...</div>;
  return <div className={`student-app ${previewMode ? 'student-preview-mode' : ''}`}>{previewMode && <div className="student-preview-banner"><Eye size={18} /><div><strong>Visualização do aluno: {portalProfile.full_name}</strong><span>Você está vendo o portal em modo somente leitura{previewTeacherName ? ` como ${previewTeacherName}` : ''}.</span></div><button type="button" onClick={onLogout}><ArrowLeft size={16} />Sair da visualização</button></div>}<aside className="student-sidebar"><div className="auth-brand"><GraduationCap size={25} /><strong>LangSpot</strong></div><nav className="desktop-nav">{nav.map(({ label, icon: Icon }) => <button key={label} className={tab === label ? 'active' : ''} onClick={() => navigateStudent(label)}><Icon size={18} />{label}{label === 'Notificações' && unreadStudentNotifications > 0 && <b className="nav-badge">{unreadStudentNotifications > 9 ? '9+' : unreadStudentNotifications}</b>}</button>)}</nav><nav className="mobile-bottom-nav">{primaryNav.map(({ label, icon: Icon }) => <button key={label} className={tab === label ? 'active' : ''} onClick={() => navigateStudent(label)}><Icon size={18} />{label}</button>)}<button type="button" className={moreActive || mobileMoreOpen ? 'active mobile-more-button' : 'mobile-more-button'} onClick={() => setMobileMoreOpen((open) => !open)}><MoreHorizontal size={18} />Mais{unreadStudentNotifications > 0 && <b className="nav-badge">{unreadStudentNotifications > 9 ? '9+' : unreadStudentNotifications}</b>}</button>{mobileMoreOpen && <div className="mobile-more-menu">{moreNav.map(({ label, icon: Icon }) => <button key={label} type="button" className={tab === label ? 'active' : ''} onClick={() => navigateStudent(label)}><Icon size={17} /><span>{label}</span>{label === 'Notificações' && unreadStudentNotifications > 0 && <b className="nav-badge">{unreadStudentNotifications > 9 ? '9+' : unreadStudentNotifications}</b>}</button>)}</div>}</nav><ClassPlayLink area="student" variant="footer" /><button className="student-logout" onClick={onLogout}>{previewMode ? <ArrowLeft size={16} /> : <LogOut size={16} />}{previewMode ? 'Voltar ao painel' : 'Sair'}</button></aside><main className="student-main-content"><header className="student-topbar"><div><p className="eyebrow">PORTAL DO ALUNO</p><h1>{tab}</h1></div><div className="student-topbar-actions"><ClassPlayLink area="student" variant="topbar" /><NotificationBell className="student-notification-button" unreadCount={unreadStudentNotifications} items={studentNotifications.map((item) => ({ id: item.id, kind: item.kind, title: item.title, description: item.description, dateLabel: formatNotificationDate(item.date), unread: !item.readAt, urgent: item.urgent }))} onOpen={(id) => { const item = studentNotifications.find((entry) => entry.id === id); if (item) openStudentNotification(item); }} onMarkAll={() => void markAllStudentNotificationsRead()} onViewAll={() => navigateStudent('Notificações')} /><div className="student-account-menu"><button type="button" className="student-avatar student-avatar-button" aria-label="Abrir menu do perfil" aria-expanded={accountMenuOpen} onClick={() => setAccountMenuOpen((open) => !open)}>{portalProfile.avatar_url ? <img src={portalProfile.avatar_url} alt={`Avatar de ${portalProfile.full_name}`} /> : initials(portalProfile.full_name)}</button>{accountMenuOpen && <div className="student-account-popover"><div><strong>{portalProfile.full_name}</strong><span>{email || portalProfile.email || 'Aluno'}</span></div><button type="button" onClick={() => navigateStudent('Perfil')}><UserRound size={16} />Meu perfil</button><button type="button" className="student-account-logout" onClick={onLogout}>{previewMode ? <ArrowLeft size={16} /> : <LogOut size={16} />}{previewMode ? 'Voltar ao painel' : 'Sair'}</button></div>}</div></div></header>{loadError && <div className="student-data-warning"><strong>Algumas informações não puderam ser carregadas.</strong><span>{loadError}</span></div>}{tab === 'Visão geral' ? <StudentOverview profile={portalProfile} record={record} nextLesson={nextLesson} materialCount={materials.length} assignments={assignments} history={history} goals={goals} journal={journal} studyActivities={studyActivities} streakFreezes={streakFreezes} onChanged={loadPortal} onNavigate={navigateStudent} readOnly={previewMode} /> : tab === 'Notificações' ? <StudentNotificationsPage notifications={studentNotifications} onOpen={openStudentNotification} onMarkAll={markAllStudentNotificationsRead} /> : tab === 'Aulas' ? <StudentLessons upcoming={upcoming} history={history} requestByLesson={requestByLesson} onCancel={previewMode ? () => undefined : setLessonToCancel} /> : tab === 'Progresso' ? <StudentProgress record={record} /> : tab === 'Materiais' ? <StudentMaterials materials={materials} /> : tab === 'Tarefas' ? <StudentAssignments assignments={assignments.filter((assignment) => assignment.assignment_type !== 'interactive')} materials={materials} mode="tasks" onAssignmentsChange={setAssignments} readOnly={previewMode} /> : tab === 'Quiz' ? <StudentAssignments assignments={assignments.filter((assignment) => assignment.assignment_type === 'interactive')} materials={materials} mode="quiz" onAssignmentsChange={setAssignments} readOnly={previewMode} /> : tab === 'Avaliações' && supabase ? <AssessmentHub client={supabase} readOnly={previewMode} /> : tab === 'Flashcards' ? <StudentFlashcards profile={portalProfile} onActivity={loadPortal} readOnly={previewMode} /> : tab === 'Metas' ? <StudentGoals profile={portalProfile} goals={goals} onGoalsChange={setGoals} onChanged={loadPortal} readOnly={previewMode} /> : tab === 'Conquistas' ? <StudentAchievements studyActivities={studyActivities} streakFreezes={streakFreezes} /> : tab === 'Diário' ? <StudentJournal profile={portalProfile} entries={journal} lessons={lessons} onEntriesChange={setJournal} onChanged={loadPortal} readOnly={previewMode} /> : <StudentProfilePage profile={portalProfile} record={record} email={email} theme={theme} onThemeChange={setTheme} onProfileChange={setPortalProfile} readOnly={previewMode} />}</main>{!previewMode && lessonToCancel && <CancellationModal lesson={lessonToCancel} profile={portalProfile} onClose={() => setLessonToCancel(null)} onSent={async () => { setLessonToCancel(null); await loadPortal(); }} />}</div>;
}
