import { ArrowDown, ArrowUp } from 'lucide-react';
import { useEffect } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { joinOrderingAnswer, splitOrderingAnswer } from '../../questions';
import type { AssessmentPresentedQuestion } from '../types';
import { ListeningQuestion, SpeakingQuestion } from './MediaQuestions';

export function QuestionRenderer({ client, attemptId, question, value, onChange }: { client: SupabaseClient; attemptId: string; question: AssessmentPresentedQuestion; value: string; onChange: (value: string) => void }) {
  useEffect(() => {
    if (question.type === 'ordering' && !value && question.options.length) onChange(joinOrderingAnswer(question.options));
  }, [question.id, question.type, question.options, value, onChange]);
  if (question.type === 'listening') return <><ListeningQuestion client={client} attemptId={attemptId} question={question} /><div className="assessment-options">{question.options.map((option) => <label key={option} className={value === option ? 'selected' : ''}><input type="radio" name={question.id} checked={value === option} onChange={() => onChange(option)} />{option}</label>)}</div></>;
  if (question.type === 'writing') return <label className="assessment-writing-answer">Sua resposta<textarea value={value} onChange={(event) => onChange(event.target.value)} rows={12} maxLength={50000} spellCheck autoComplete="off" /><span>{value.length.toLocaleString('pt-BR')} / 50.000 caracteres</span></label>;
  if (question.type === 'speaking') return <SpeakingQuestion client={client} attemptId={attemptId} question={question} value={value} onChange={onChange} />;
  if (question.type === 'fill_blank') return <label className="assessment-fill-answer">Sua resposta<input value={value} onChange={(event) => onChange(event.target.value)} autoComplete="off" /></label>;
  if (question.type === 'ordering') {
    const items = value ? splitOrderingAnswer(value) : question.options;
    const move = (index: number, direction: -1 | 1) => {
      const target = index + direction;
      if (target < 0 || target >= items.length) return;
      const next = [...items]; [next[index], next[target]] = [next[target], next[index]]; onChange(joinOrderingAnswer(next));
    };
    return <ol className="assessment-ordering">{items.map((item, index) => <li key={`${item}-${index}`}><span>{item}</span><button type="button" aria-label={`Mover ${item} para cima`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={15} /></button><button type="button" aria-label={`Mover ${item} para baixo`} disabled={index === items.length - 1} onClick={() => move(index, 1)}><ArrowDown size={15} /></button></li>)}</ol>;
  }
  return <div className="assessment-options">{question.options.map((option) => <label key={option} className={value === option ? 'selected' : ''}><input type="radio" name={question.id} checked={value === option} onChange={() => onChange(option)} />{option}</label>)}</div>;
}
