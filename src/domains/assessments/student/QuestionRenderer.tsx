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
  if (question.type === 'mediation') return <><p className="assessment-source-material">{question.sourceMaterial}</p><label className="assessment-writing-answer">Sua mediação<textarea value={value} onChange={(event) => onChange(event.target.value)} rows={12} maxLength={50000} spellCheck autoComplete="off" /><span>{value.length.toLocaleString('pt-BR')} / 50.000 caracteres</span></label></>;
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
  if (question.type === 'multiple_response') {
    const selected = splitOrderingAnswer(value);
    return <div className="assessment-options">{question.options.map((option) => <label key={option} className={selected.includes(option) ? 'selected' : ''}><input type="checkbox" checked={selected.includes(option)} onChange={(event) => onChange(joinOrderingAnswer(event.target.checked ? [...selected, option] : selected.filter((item) => item !== option)))} />{option}</label>)}</div>;
  }
  if (question.type === 'matching') {
    const pairs = question.options.map((option) => option.split('=>').map((item) => item.trim()) as [string, string]);
    const selected = Object.fromEntries(splitOrderingAnswer(value).map((pair) => pair.split('=>').map((item) => item.trim())));
    return <div className="assessment-matching">{pairs.map(([left]) => <label key={left}><span>{left}</span><select value={selected[left] ?? ''} onChange={(event) => onChange(joinOrderingAnswer(pairs.map(([key]) => `${key} => ${key === left ? event.target.value : selected[key] ?? ''}`).filter((pair) => !pair.endsWith('=> '))))}><option value="">Selecione</option>{pairs.map(([, right]) => <option key={right}>{right}</option>)}</select></label>)}</div>;
  }
  return <div className="assessment-options">{question.options.map((option) => <label key={option} className={value === option ? 'selected' : ''}><input type="radio" name={question.id} checked={value === option} onChange={() => onChange(option)} />{option}</label>)}</div>;
}
