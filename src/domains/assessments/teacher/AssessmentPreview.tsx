import { useState } from 'react';
import { Check, Mic, Radio, Shuffle } from 'lucide-react';
import type { AssessmentDraft, AssessmentDraftQuestion } from '../types';
import { studentSectionTitle } from '../student/pacing';
import { isLiveQuestion } from '../validator';
import { splitOrderingAnswer } from '../../questions';

const LETTERS = 'ABCDEFGH';

/** One question as the student sees it; the key is marked only when the teacher asks for it. */
function PreviewQuestion({ question, number, showKey }: { question: AssessmentDraftQuestion; number: number; showKey: boolean }) {
  const snapshot = question.snapshot;
  const target = snapshot.responseConstraints?.label;
  const live = isLiveQuestion(snapshot);
  return <div className="assessment-preview-question">
    <small>Questão {number}{live ? ' · aplicada ao vivo pelo professor' : ''}</small>
    <h4>{snapshot.prompt}</h4>
    {snapshot.type === 'mediation' && snapshot.sourceMaterial && <p className="assessment-source-material">{snapshot.sourceMaterial}</p>}
    {target && <p className="assessment-response-target">{snapshot.type === 'speaking' ? 'Duração esperada' : 'Extensão esperada'}: {target}</p>}
    {['writing', 'mediation'].includes(snapshot.type) && !live && <div className="assessment-preview-answer-box">O aluno escreve a resposta aqui.</div>}
    {snapshot.type === 'speaking' && !live && <div className="assessment-preview-answer-box"><Mic size={15} />O aluno grava a resposta em áudio{snapshot.preparationSeconds ? ` (${snapshot.preparationSeconds}s de preparação` : ''}{snapshot.preparationSeconds && snapshot.recordingSeconds ? `, ${snapshot.recordingSeconds}s de gravação)` : snapshot.preparationSeconds ? ')' : ''}.</div>}
    {live && <div className="assessment-preview-answer-box"><Radio size={15} />Você conduz e pontua esta tarefa na sessão ao vivo.</div>}
    {snapshot.type === 'fill_blank' || snapshot.type === 'short_answer' ? <div className="assessment-preview-answer-box">Resposta curta digitada pelo aluno.{showKey && snapshot.answer ? <strong> Gabarito: {snapshot.answer}</strong> : null}</div> : null}
    {snapshot.options.length > 0 && !['writing', 'speaking', 'mediation'].includes(snapshot.type) && <ol className="assessment-preview-options">
      {snapshot.options.map((option, index) => {
        const correct = showKey && (snapshot.answer === option || (snapshot.type === 'multiple_response' && splitOrderingAnswer(snapshot.answer).includes(option)));
        return <li key={`${option}-${index}`} className={correct ? 'correct' : ''}><b>{LETTERS[index] ?? index + 1}</b><span>{option}</span>{correct && <Check size={15} aria-label="Resposta correta" />}</li>;
      })}
    </ol>}
  </div>;
}

export function AssessmentPreview({ draft }: { draft: AssessmentDraft }) {
  const [showKey, setShowKey] = useState(false);
  return <section className="assessment-preview" aria-label="Pré-visualização da avaliação">
    <header>
      <span>PRÉ-VISUALIZAÇÃO · COMO O ALUNO VÊ</span><h2>{draft.title || 'Avaliação sem título'}</h2><p>{draft.description || 'Sem instruções gerais.'}</p>
      <label className="assessment-preview-key-toggle"><input type="checkbox" checked={showKey} onChange={(event) => setShowKey(event.target.checked)} />Mostrar gabarito</label>
      <small>As linhas em cinza, como nível e código das questões, aparecem só para você. O aluno vê apenas o nome da parte, os textos e as questões.</small>
    </header>
    {draft.sections.map((section, sectionIndex) => {
      const studentTitle = studentSectionTitle(section.title);
      const pooled = section.drawCount && section.drawCount < section.questions.length;
      let lastText = '';
      return <article key={section.id}>
        <h3>{studentTitle}</h3>
        {studentTitle !== section.title && <p className="assessment-preview-teacher-only">Só o professor vê: {section.title}</p>}
        {draft.sectionPacing === 'sections' && <p className="assessment-preview-teacher-only">Etapa {sectionIndex + 1}{section.timeLimitMinutes ? ` · ${section.timeLimitMinutes} min` : ' · sem limite de tempo'}</p>}
        {pooled && <p className="assessment-preview-teacher-only"><Shuffle size={13} />Cada aluno recebe {section.drawCount} destas {section.questions.length} questões, sorteadas.</p>}
        {section.instructions && <p>{section.instructions}</p>}
        <ol className="assessment-preview-questions">{section.questions.map((question, index) => {
          const text = question.snapshot.type !== 'mediation' ? question.snapshot.sourceMaterial ?? '' : '';
          const showText = Boolean(text) && text !== lastText;
          lastText = text || lastText;
          return <li key={question.id} className="assessment-preview-group">
            {showText && <div className="assessment-preview-text"><p className="assessment-source-material">{text}</p>{question.snapshot.sourceCredit && <small className="assessment-source-credit">{question.snapshot.sourceCredit}</small>}</div>}
            <PreviewQuestion question={question} number={index + 1} showKey={showKey} />
          </li>;
        })}</ol>
        {!section.questions.length && <p className="assessment-preview-teacher-only">Esta parte ainda não tem questões.</p>}
      </article>;
    })}
  </section>;
}
