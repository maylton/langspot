import type { AssessmentDraft } from '../types';

export function AssessmentPreview({ draft }: { draft: AssessmentDraft }) {
  return <section className="assessment-preview" aria-label="Pré-visualização da avaliação">
    <header><span>PRÉ-VISUALIZAÇÃO</span><h2>{draft.title || 'Avaliação sem título'}</h2><p>{draft.description || 'Sem instruções gerais.'}</p></header>
    {draft.sections.map((section, sectionIndex) => <article key={section.id}>
      <h3>{sectionIndex + 1}. {section.title}</h3>
      {section.instructions && <p>{section.instructions}</p>}
      <ol>{section.questions.map((question) => <li key={question.id}><strong>{question.snapshot.prompt}</strong><small>{question.snapshot.type.replace(/_/g, ' ')}</small></li>)}</ol>
    </article>)}
  </section>;
}
