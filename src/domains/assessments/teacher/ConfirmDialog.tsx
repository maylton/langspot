import { Check, LoaderCircle } from 'lucide-react';

/**
 * In-app Sim/Não confirmation. Used instead of window.confirm, which the desktop app's webview
 * may not display (the call then returns false and the action silently does nothing).
 */
export function ConfirmDialog({ eyebrow, title, items, note, confirmLabel, cancelLabel = 'Não', busy = false, onConfirm, onCancel }: {
  eyebrow: string;
  title: string;
  items?: string[];
  note?: string;
  confirmLabel: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return <div className="modal-backdrop" onMouseDown={() => { if (!busy) onCancel(); }}>
    <section className="modal assessment-delete-dialog assessment-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="assessment-confirm-title" onMouseDown={(event) => event.stopPropagation()}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id="assessment-confirm-title">{title}</h2>
      {items?.length ? <ul className="assessment-confirm-items">{items.map((item) => <li key={item}>{item}</li>)}</ul> : null}
      {note && <p>{note}</p>}
      <div className="form-actions">
        <button type="button" className="cancel-button" disabled={busy} autoFocus onClick={onCancel}>{cancelLabel}</button>
        <button type="button" className="primary-button" disabled={busy} onClick={onConfirm}>{busy ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}{confirmLabel}</button>
      </div>
    </section>
  </div>;
}
