/**
 * Mock/Seed data for development mode only
 * This file contains all the fake students, lessons, materials, and settings
 * used when running the app in development mode with feature.allowMockData = true
 * 
 * ⚠️ WARNING: This data is only loaded in development mode.
 * In beta/production, users must use the real authentication flow.
 */

// Type definitions
type Skill = 'Speaking' | 'Listening' | 'Reading' | 'Writing' | 'Grammar' | 'Vocabulary' | 'Pronunciation';
type Lesson = { id: string; date: string; topic: string; notes: string; homework: string };
type LessonStatus = 'Agendada' | 'Concluída' | 'Cancelada';
type ScheduledLesson = { id: string; studentId: string; date: string; startTime: string; duration: number; topic: string; onlineUrl?: string; status: LessonStatus; notes: string; homework: string };
type MaterialType = 'PDF' | 'Documento' | 'Apresentação' | 'Imagem' | 'Vídeo' | 'Áudio' | 'Link' | 'Atividade';
type Material = { id: string; title: string; type: MaterialType; level: string; skill: Skill; url: string; description: string; createdAt: string };
type PlatformSettings = { teacherName: string; email: string; whatsappPhone: string; schoolName: string; avatar: string; defaultDuration: number; defaultOnlineUrl: string; compactMode: boolean; theme: 'light' | 'dark'; confirmCancellations: boolean };
type Student = {
  id: string;
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

/**
 * Utility functions for date handling
 */
export function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  result.setHours(12, 0, 0, 0);
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  return result;
}

export function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

export function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Mock settings with hardcoded teacher name and school
 * In production, these would come from user profile in Supabase
 */
export const mockSettings: PlatformSettings = {
  teacherName: 'Maylton',
  email: '',
  whatsappPhone: '',
  schoolName: 'LangSpot',
  avatar: '',
  defaultDuration: 60,
  defaultOnlineUrl: '',
  compactMode: false,
  theme: 'light',
  confirmCancellations: true,
};

/**
 * Mock student data - 4 students with different levels and progress
 * This simulates a real teacher's student portfolio
 */
export const mockStudents: Student[] = [
  {
    id: 'student-1',
    name: 'Ana Beatriz',
    email: 'ana@example.com',
    age: '15',
    level: 'A2',
    goal: 'Conversação',
    status: 'Ativo',
    progress: 72,
    nextClass: 'Hoje, 16:00',
    notes: 'Quer ganhar confiança ao falar.',
    skills: {
      Speaking: 68,
      Listening: 74,
      Reading: 78,
      Writing: 61,
      Grammar: 70,
      Vocabulary: 75,
      Pronunciation: 66,
    },
    lessons: [
      {
        id: 'student-1',
        date: '2026-06-10',
        topic: 'Speaking Practice',
        notes: 'Boa participação e uso de perguntas.',
        homework: 'Gravar áudio de 2 minutos.',
      },
    ],
  },
  {
    id: 'student-2',
    name: 'Lucas Gabriel',
    email: 'lucas@example.com',
    age: '22',
    level: 'B1',
    goal: 'Intercâmbio',
    status: 'Ativo',
    progress: 58,
    nextClass: 'Amanhã, 14:30',
    notes: 'Foco em listening e situações de viagem.',
    skills: {
      Speaking: 56,
      Listening: 49,
      Reading: 69,
      Writing: 54,
      Grammar: 61,
      Vocabulary: 60,
      Pronunciation: 57,
    },
    lessons: [],
  },
  {
    id: 'student-3',
    name: 'Marina Alves',
    email: 'marina@example.com',
    age: '13',
    level: 'A1',
    goal: 'Inglês escolar',
    status: 'Ativo',
    progress: 41,
    nextClass: 'Segunda, 18:00',
    notes: 'Precisa revisar estruturas básicas.',
    skills: {
      Speaking: 36,
      Listening: 42,
      Reading: 49,
      Writing: 37,
      Grammar: 44,
      Vocabulary: 45,
      Pronunciation: 39,
    },
    lessons: [],
  },
  {
    id: 'student-4',
    name: 'Rafael Lima',
    email: 'rafael@example.com',
    age: '31',
    level: 'B2',
    goal: 'Business English',
    status: 'Ativo',
    progress: 84,
    nextClass: 'Terça, 19:00',
    notes: 'Preparação para apresentações.',
    skills: {
      Speaking: 86,
      Listening: 80,
      Reading: 88,
      Writing: 78,
      Grammar: 82,
      Vocabulary: 87,
      Pronunciation: 85,
    },
    lessons: [],
  },
];

/**
 * Mock scheduled lessons for the current week
 * Automatically generates dates relative to Monday of current week
 */
export function mockSchedule(): ScheduledLesson[] {
  // Keep demonstration lessons in the future regardless of the weekday on
  // which the app is opened. This prevents the dashboard from becoming empty
  // at the end of the current week.
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return [
    {
      id: 'lesson-101',
      studentId: 'student-1',
      date: toDateInput(addDays(today, 1)),
      startTime: '16:00',
      duration: 60,
      topic: 'Speaking Practice',
      status: 'Agendada',
      notes: '',
      homework: '',
    },
    {
      id: 'lesson-102',
      studentId: 'student-2',
      date: toDateInput(addDays(today, 2)),
      startTime: '14:30',
      duration: 60,
      topic: 'Travel Situations',
      status: 'Agendada',
      notes: '',
      homework: '',
    },
    {
      id: 'lesson-103',
      studentId: 'student-3',
      date: toDateInput(addDays(today, 3)),
      startTime: '18:00',
      duration: 50,
      topic: 'Present Simple',
      status: 'Agendada',
      notes: '',
      homework: '',
    },
    {
      id: 'lesson-104',
      studentId: 'student-4',
      date: toDateInput(addDays(today, 4)),
      startTime: '19:00',
      duration: 60,
      topic: 'Business Presentations',
      status: 'Agendada',
      notes: '',
      homework: '',
    },
  ];
}

/**
 * Mock materials library - 4 materials across different types and levels
 * References external educational resources (BBC Learning English, Cambridge, British Council)
 */
export const mockMaterials: Material[] = [
  {
    id: 'material-201',
    title: 'Conversation Starters',
    type: 'PDF',
    level: 'A2',
    skill: 'Speaking',
    url: 'https://learnenglish.britishcouncil.org/',
    description: 'Perguntas e situações para aulas de conversação.',
    createdAt: '2026-06-12',
  },
  {
    id: 'material-202',
    title: 'Travel Vocabulary Practice',
    type: 'Atividade',
    level: 'B1',
    skill: 'Vocabulary',
    url: 'https://www.cambridgeenglish.org/learning-english/',
    description: 'Vocabulário essencial para viagens e intercâmbio.',
    createdAt: '2026-06-10',
  },
  {
    id: 'material-203',
    title: 'Listening Practice Library',
    type: 'Áudio',
    level: 'Todos',
    skill: 'Listening',
    url: 'https://www.bbc.co.uk/learningenglish/',
    description: 'Coleção de áudios e atividades de compreensão.',
    createdAt: '2026-06-08',
  },
  {
    id: 'material-204',
    title: 'Business Presentation Tips',
    type: 'Vídeo',
    level: 'B2',
    skill: 'Speaking',
    url: 'https://www.youtube.com/',
    description: 'Referência para apresentações profissionais em inglês.',
    createdAt: '2026-06-05',
  },
];

/**
 * Helper function to reset all data to mock defaults
 * Called from Settings page "Restaurar exemplos" button (dev mode only)
 */
export function resetToMockData() {
  return {
    students: [...mockStudents],
    schedule: mockSchedule(),
    materials: [...mockMaterials],
    settings: { ...mockSettings },
  };
}
