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
  feedback: string;
  grade: number | null;
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
