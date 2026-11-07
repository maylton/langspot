import { useMemo, useState } from 'react';
import { Check, LoaderCircle } from 'lucide-react';
import { generateConfirmationCode } from './pacing';

/** Final submission: the student types the code shown on screen, so a misclick never sends the assessment. */
export function SubmitConfirmation({ unanswered, busy, onConfirm, onCancel }: {
  unanswered: number;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const code = useMemo(() => generateConfirmationCode(), []);
  const [typed, setTyped] = useState('');
  const matches = typed.trim() === code;
  return <div className="modal-backdrop" onMouseDown={() => { if (!busy) onCancel(); }}>
    <section className="modal assessment-submit-confirmation" role="dialog" aria-modal="true" aria-labelledby="submit-confirmation-title" onMouseDown={(event) => event.stopPropagation()}>
      <p className="eyebrow">ENVIAR AVALIAÇÃO</p>
      <h2 id="submit-confirmation-title">Confirme o envio da prova completa</h2>
      <p>Depois do envio, nenhuma resposta poderá ser alterada.{unanswered ? ` Há ${unanswered} questão(ões) sem resposta.` : ' Todas as questões foram respondidas.'}</p>
      <div className="assessment-confirmation-code" aria-label={`Código de confirmação ${code.split('').join(' ')}`}>{code}</div>
      <label>Digite o código acima para confirmar
        <input inputMode="numeric" autoComplete="off" maxLength={4} value={typed} autoFocus onChange={(event) => setTyped(event.target.value.replace(/\D/g, ''))} onKeyDown={(event) => { if (event.key === 'Enter' && matches && !busy) onConfirm(); }} />
      </label>
      <div className="form-actions">
        <button type="button" className="cancel-button" disabled={busy} onClick={onCancel}>Voltar à prova</button>
        <button type="button" className="student-primary" disabled={!matches || busy} onClick={onConfirm}>{busy ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}{busy ? 'Enviando…' : 'Enviar avaliação'}</button>
      </div>
    </section>
  </div>;
}
