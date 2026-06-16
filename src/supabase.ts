import { createClient } from '@supabase/supabase-js';
import { SUPABASE } from './config/env';

export type UserRole = 'teacher' | 'student';

export type TeacherSubscription = {
  teacher_id: string;
  plan: 'trial' | 'professional' | 'owner';
  status: 'pending_confirmation' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
  trial_started_at: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
};

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string;
  teacher_id: string | null;
  must_change_password: boolean;
  email: string;
  avatar_url: string;
  school_name: string;
  onboarding_completed: boolean;
};

export type StudentRecord = {
  id: string;
  teacher_id: string;
  student_id: string;
  level: string;
  age: number | null;
  goal: string;
  notes: string;
  skills: Record<string, number>;
};

export type DbLesson = {
  id: string;
  teacher_id: string;
  student_id: string;
  starts_at: string;
  duration_minutes: number;
  topic: string;
  online_url: string | null;
  status: string;
  notes: string;
  strengths: string | null;
  improvements: string | null;
  homework: string;
  attendance: string | null;
  skill_scores: Record<string, number> | null;
};

export type DbMaterial = {
  id: string;
  title: string;
  type: string;
  level: string;
  skill: string;
  url: string;
  description: string;
  storage_path?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  material_source?: 'link' | 'upload';
};

export type DbAssignment = {
  id: string;
  teacher_id: string;
  student_id: string;
  material_id: string | null;
  title: string;
  instructions: string;
  due_date: string;
  status: 'pending' | 'submitted' | 'reviewed';
  submission_text: string;
  submitted_at: string | null;
  submission_file_path?: string | null;
  submission_file_name?: string | null;
  submission_file_size?: number | null;
  submission_file_mime_type?: string | null;
  submission_file_url?: string | null;
  feedback: string;
  grade: number | null;
  created_at: string;
};


export type FlashcardDeck = {
  id: string;
  user_id: string;
  teacher_id: string | null;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type Flashcard = {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  example: string;
  created_at: string;
};

export type FlashcardReview = {
  id: string;
  card_id: string;
  user_id: string;
  due_at: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  last_reviewed_at: string | null;
};


export type LearningGoal = {
  id: string;
  student_id: string;
  teacher_id: string;
  title: string;
  description: string;
  category: string;
  target_date: string | null;
  progress: number;
  status: 'active' | 'completed';
  created_at: string;
  updated_at: string;
};

export type LearningJournalEntry = {
  id: string;
  student_id: string;
  teacher_id: string;
  lesson_id: string | null;
  title: string;
  content: string;
  mood: 'great' | 'good' | 'neutral' | 'hard';
  study_minutes: number;
  new_words: string[];
  created_at: string;
};

export type StudyActivity = {
  id: string;
  student_id: string;
  teacher_id: string | null;
  activity_date: string;
  activity_type: 'lesson' | 'assignment' | 'journal' | 'goal' | 'flashcard';
  source_id: string;
  created_at: string;
};

export type StreakFreeze = {
  id: string;
  student_id: string;
  teacher_id: string | null;
  protected_date: string;
  created_at: string;
};

export type CancellationStatus = 'pending' | 'approved' | 'rejected';

export type CancellationRequest = {
  id: string;
  lesson_id: string;
  student_id: string;
  teacher_id: string;
  reason: string;
  status: CancellationStatus;
  teacher_response: string;
  created_at: string;
  resolved_at: string | null;
  lessons?: DbLesson;
  student?: { full_name: string };
};

const supabaseUrl = SUPABASE.url;
const supabaseAnonKey = SUPABASE.anonKey;

export const isSupabaseConfigured = SUPABASE.isConfigured;
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;
