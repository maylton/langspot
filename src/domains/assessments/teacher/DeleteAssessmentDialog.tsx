import { LoaderCircle, Trash2 } from 'lucide-react';
import type { AssessmentDeletionImpact } from '../assessmentService';
import { deletionWarnings } from './deletion';

export function DeleteAssessmentDialog({ title, impact, loadingImpact, busy, onConfirm, onCancel }: {
  title: string;
  impact: AssessmentDeletionImpact | null;
  loadingImpact: boolean;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const warnings = deletionWarnings(impact);
  return <div className="modal-backdrop" onMouseDown={() => { if (!busy) onCancel(); }}>
    <section className="modal assessment-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-assessment-title" aria-describedby="delete-assessment-description" onMouseDown={(event) => event.stopPropagation()}>
      <p className="eyebrow">EXCLUIR AVALIAÇÃO</p>
      <h2 id="delete-assessment-title">Deseja realmente excluir “{title}”?</h2>
      <div id="delete-assessment-description">
        {loadingImpact ? <p><LoaderCircle className="spin" size={15} /> Verificando atribuições e resultados…</p> : <>
          {warnings.length ? <ul className="assessment-delete-warnings">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}
          <p>Esta ação não pode ser desfeita.</p>
        </>}
      </div>
      <div className="form-actions">
        <button type="button" className="cancel-button" disabled={busy} autoFocus onClick={onCancel}>Não</button>
        <button type="button" className="assessment-delete-confirm" disabled={busy || loadingImpact} onClick={onConfirm}>{busy ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} />}{busy ? 'Excluindo…' : 'Sim, excluir'}</button>
      </div>
    </section>
  </div>;
}
