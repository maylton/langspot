import { NotebookPen } from 'lucide-react';
import { StudyActivity } from '../supabase';

export type StudentTab = 'Visão geral' | 'Aulas' | 'Progresso' | 'Materiais' | 'Tarefas' | 'Quiz' | 'Avaliações' | 'Flashcards' | 'Metas' | 'Conquistas' | 'Diário' | 'Perfil' | 'Notificações';

export type DailyMission = {
  type: StudyActivity['activity_type'];
  title: string;
  text: string;
  action: StudentTab;
  icon: typeof NotebookPen;
  completed: boolean;
};

export type FlashcardRating = 'again' | 'hard' | 'good' | 'easy';
