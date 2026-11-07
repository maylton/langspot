import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Info } from 'lucide-react';

/*
 * In-app replacements for window.confirm / window.alert / window.prompt.
 * The desktop app's webview may not display the native dialogs (confirm then returns false and the
 * action silently does nothing), and they look foreign on every platform. <DialogHost /> is mounted
 * once at the root; any code can await confirmAction(), showAlert() or confirmByTyping().
 */

type Request =
  | { kind: 'confirm'; title: string; message?: string; confirmLabel: string; cancelLabel: string; danger: boolean; resolve: (value: boolean) => void }
  | { kind: 'alert'; title: string; message?: string; resolve: () => void }
  | { kind: 'type'; title: string; message?: string; expected: string; confirmLabel: string; resolve: (value: boolean) => void };

let enqueue: ((request: Request) => void) | null = null;

/** Asks Sim/Não. Destructive actions (danger) get a red confirm button; "Não" has the focus. */
export function confirmAction(options: { title: string; message?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean }): Promise<boolean> {
  return new Promise((resolve) => {
    if (!enqueue) { resolve(window.confirm([options.title, options.message].filter(Boolean).join('\n\n'))); return; }
    enqueue({ kind: 'confirm', title: options.title, message: options.message, confirmLabel: options.confirmLabel ?? 'Sim', cancelLabel: options.cancelLabel ?? 'Não', danger: options.danger ?? false, resolve });
  });
}

/** Shows a message with a single OK button (errors and notices). */
export function showAlert(title: string, message?: string): Promise<void> {
  return new Promise((resolve) => {
    if (!enqueue) { window.alert([title, message].filter(Boolean).join('\n\n')); resolve(); return; }
    enqueue({ kind: 'alert', title, message, resolve });
  });
}

/** For irreversible actions: the user must type `expected` (e.g. EXCLUIR) to confirm. */
export function confirmByTyping(options: { title: string; message?: string; expected: string; confirmLabel?: string }): Promise<boolean> {
  return new Promise((resolve) => {
    if (!enqueue) { resolve(window.prompt([options.title, options.message, `Digite ${options.expected} para confirmar.`].filter(Boolean).join('\n\n')) === options.expected); return; }
    enqueue({ kind: 'type', title: options.title, message: options.message, expected: options.expected, confirmLabel: options.confirmLabel ?? 'Excluir', resolve });
  });
}

export function DialogHost() {
  const [queue, setQueue] = useState<Request[]>([]);
  const [typed, setTyped] = useState('');
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    enqueue = (request) => setQueue((current) => [...current, request]);
    return () => { enqueue = null; };
  }, []);
  const current = queue[0];
  useEffect(() => { setTyped(''); if (current?.kind === 'alert') confirmRef.current?.focus(); }, [current]);
  if (!current) return null;

  const close = (value: boolean) => {
    if (current.kind === 'alert') current.resolve(); else current.resolve(value);
    setQueue((items) => items.slice(1));
  };
  const typedOk = current.kind !== 'type' || typed.trim() === current.expected;
  const danger = current.kind === 'type' || (current.kind === 'confirm' && current.danger);
  const Icon = current.kind === 'alert' ? Info : danger ? AlertTriangle : Check;

  return <div className="modal-backdrop app-dialog-backdrop" onMouseDown={() => close(false)} onKeyDown={(event) => { if (event.key === 'Escape') close(false); }}>
    <section className={`modal app-dialog ${danger ? 'danger' : ''}`} role={current.kind === 'alert' ? 'dialog' : 'alertdialog'} aria-modal="true" aria-labelledby="app-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
      <div className="app-dialog-icon"><Icon size={20} /></div>
      <h2 id="app-dialog-title">{current.title}</h2>
      {current.message && <p className="app-dialog-message">{current.message}</p>}
      {current.kind === 'type' && <label className="app-dialog-type"><span>Digite <strong>{current.expected}</strong> para confirmar</span>
        <input value={typed} autoFocus autoComplete="off" onChange={(event) => setTyped(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && typedOk) close(true); }} />
      </label>}
      <div className="app-dialog-actions">
        {current.kind !== 'alert' && <button type="button" className="cancel-button" autoFocus={current.kind === 'confirm'} onClick={() => close(false)}>{current.kind === 'confirm' ? current.cancelLabel : 'Cancelar'}</button>}
        <button ref={confirmRef} type="button" className={danger ? 'app-dialog-danger' : 'primary-button'} disabled={!typedOk} onClick={() => close(true)}>
          {current.kind === 'alert' ? 'OK' : current.confirmLabel}
        </button>
      </div>
    </section>
  </div>;
}
