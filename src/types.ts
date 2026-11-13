import { type QuestionAttempt, type QuestionDefinition, type QuestionSetResult, type QuestionType } from './domains/questions';

export type Id = string;

export type Skill = 'Speaking' | 'Listening' | 'Reading' | 'Writing' | 'Grammar' | 'Vocabulary' | 'Pronunciation';

export type AttendanceStatus = 'Presente' | 'Ausente' | 'Remarcada';

export type Lesson = { id: Id; date: string; startTime?: string; duration?: number; topic: string; onlineUrl?: string; notes: string; strengths?: string; improvements?: string; homework: string; attendance?: AttendanceStatus; skillScores?: Partial<Record<Skill, number>> };

export type LessonStatus = 'Agendada' | 'Concluída' | 'Cancelada';

export type ScheduledLesson = { id: Id; studentId: Id; date: string; startTime: string; duration: number; topic: string; onlineUrl?: string; status: LessonStatus; notes: string; strengths?: string; improvements?: string; homework: string; attendance?: AttendanceStatus; skillScores?: Partial<Record<Skill, number>> };

export type ScheduledLessonInput = Pick<ScheduledLesson, 'studentId' | 'date' | 'startTime' | 'duration' | 'topic' | 'onlineUrl'>;

export type LessonRecordInput = { date: string; startTime: string; duration: number; topic: string; onlineUrl?: string; notes: string; strengths: string; improvements: string; homework: string; attendance: AttendanceStatus; skillScores: Record<Skill, number> };

export type MaterialType = 'PDF' | 'Documento' | 'Apresentação' | 'Imagem' | 'Vídeo' | 'Áudio' | 'Link' | 'Atividade';

export type Material = { id: Id; title: string; type: MaterialType; level: string; skill: Skill; url: string; description: string; createdAt: string; assignedStudentIds?: Id[]; storagePath?: string; fileName?: string; fileSize?: number; source?: 'link' | 'upload' };

export type MaterialInput = Omit<Material, 'id' | 'createdAt' | 'assignedStudentIds'> & { file?: File };

export type AssignmentStatus = 'Pendente' | 'Entregue' | 'Corrigida';

export type InteractiveQuestionType = QuestionType;

export type InteractiveQuestion = QuestionDefinition;

export type InteractiveAssignmentSettings = { maxAttempts: number; revealAnswers: 'after_each' | 'after_last' };

export type InteractiveAssignmentContent = { questions: InteractiveQuestion[]; settings?: InteractiveAssignmentSettings };

export type InteractiveAttempt = QuestionAttempt;

export type InteractiveAssignmentResult = QuestionSetResult;

export type TextComment = { id: Id; start: number; end: number; text: string; comment: string; createdAt: string };

export type Assignment = { id: Id; teacherId?: Id; studentId: Id; materialId?: Id; title: string; instructions: string; dueDate: string; status: AssignmentStatus; submissionText?: string; submittedAt?: string; submissionFileName?: string; submissionFileUrl?: string; feedback?: string; grade?: number; textComments?: TextComment[]; createdAt: string; assignmentType?: 'regular' | 'interactive'; interactiveContent?: InteractiveAssignmentContent | null; interactiveResult?: InteractiveAssignmentResult | null };

export type AssignmentInput = Pick<Assignment, 'studentId' | 'materialId' | 'title' | 'instructions' | 'dueDate' | 'assignmentType' | 'interactiveContent'>;

export type QuestionBankLevel = 'A1' | 'A1+' | 'A2' | 'A2+' | 'B1' | 'B1+' | 'B2' | 'B2+' | 'C1' | 'C1+' | 'C2';

export type QuestionBankCategory = 'Grammar' | 'Vocabulary' | 'Reading' | 'Listening' | 'Writing' | 'Speaking' | 'Mediation' | 'Language Use';

export type QuestionBankRubricCriterion = { key: string; label: string; maxScore: number; scale?: 'numeric' | 'cefr' };

export type QuestionBankItem = { id: Id; teacherId?: Id; externalId?: string; bankVersion?: string; sourceOrigin?: 'teacher' | 'cefr_pilot'; level: QuestionBankLevel; category: QuestionBankCategory; type: InteractiveQuestionType; prompt: string; options: string[]; answer: string; answerKey?: 'A' | 'B' | 'C' | 'D'; explanation?: string; skill?: 'reading' | 'listening' | 'writing' | 'spoken_production' | 'spoken_interaction' | 'mediation' | 'language_use'; subskill?: string; difficulty?: number; taskType?: string; topic?: string; genre?: string; audience?: 'child' | 'teen' | 'adult' | 'general' | 'teen_adult'; operationalDescriptor?: string; primaryEvidence?: string; responseConstraints?: { min: number; max: number; unit: 'words' | 'seconds' | 'minutes'; label: string }; rubric?: QuestionBankRubricCriterion[]; sourceMaterial?: string; taskletId?: string; taskletExternalId?: string; taskletInput?: string; taskletInputKind?: 'text' | 'audio_script'; sourceCredit?: string; sourceReference?: string; qualityStatus?: 'draft' | 'reviewed' | 'approved_for_pilot' | 'pilot_data_collected' | 'item_analysis' | 'approved' | 'pilot' | 'needs_revision' | 'retired'; psychometricStatus?: 'uncalibrated' | 'pilot_data_collected' | 'under_analysis' | 'calibrated'; restricted?: boolean; usageCount?: number; lastUsedAt?: string; createdAt: string };

export type QuestionBankInput = Omit<QuestionBankItem, 'id' | 'teacherId' | 'createdAt'>;

export type PaymentStatus = 'Pendente' | 'Pago' | 'Atrasado';

export type Payment = { id: Id; studentId: Id; description: string; amount: number; dueDate: string; status: PaymentStatus; paidAt?: string; createdAt: string };

export type PaymentInput = Pick<Payment, 'studentId' | 'description' | 'amount' | 'dueDate'>;

export type PlatformSettings = { teacherName: string; email: string; whatsappPhone: string; schoolName: string; avatar: string; defaultDuration: number; defaultOnlineUrl: string; compactMode: boolean; theme: 'light' | 'dark'; confirmCancellations: boolean };

export type AccountAccessInfo = { label: string; description: string; status: 'permanent' | 'active' | 'inactive' };

export type Student = {
  id: Id;
  name: string;
  email: string;
  whatsappPhone?: string;
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

export type StudentCreateInput = { name: string; email: string; whatsappPhone?: string; age?: string; level: string; goal: string; notes: string; status: 'Ativo' | 'Pausado'; firstLessonDate?: string; firstLessonTime?: string; firstLessonDuration?: number; firstLessonTopic?: string; firstLessonOnlineUrl?: string };

export type StudentAccountResult = { temporaryPassword: string; studentId?: Id };

export type NotificationKind = 'lesson' | 'assignment' | 'quiz' | 'assessment' | 'payment' | 'cancellation' | 'mission' | 'system';

export type AppNotification = { id: string; kind: NotificationKind; title: string; description: string; date: string; target: View; urgent?: boolean; readAt?: string | null };

export type View = 'Visão geral' | 'Notificações' | 'Alunos' | 'Aulas' | 'Materiais' | 'Tarefas' | 'Quiz' | 'Avaliações' | 'Financeiro' | 'Progresso' | 'Relatórios' | 'Configurações';

export type AssignmentFormMode = 'regular' | 'interactive';
