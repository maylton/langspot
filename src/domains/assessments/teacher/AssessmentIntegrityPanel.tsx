import { Activity, ClipboardPaste, MonitorX, TimerOff } from 'lucide-react';
import type { AssessmentIntegrityReport } from '../types';

const eventLabels: Record<string, string> = {
  assessment_started: 'Avaliação iniciada', question_opened: 'Questão aberta', question_closed: 'Questão encerrada',
  tab_blur: 'Saiu da janela', tab_focus: 'Retornou à janela', fullscreen_exit: 'Saiu da tela cheia',
  paste_detected: 'Texto colado', network_disconnect: 'Ficou offline', network_reconnect: 'Reconectou',
  resumed: 'Tentativa retomada', submitted: 'Avaliação enviada', session_conflict: 'Outra sessão bloqueada',
};

export function AssessmentIntegrityPanel({ report }: { report: AssessmentIntegrityReport }) {
  return <section className="assessment-integrity-panel"><header><div><p className="eyebrow">INTEGRIDADE</p><h3>Eventos observados</h3></div><span className={`assessment-integrity-status ${report.status}`}>{report.status.replace(/_/g, ' ')}</span></header>
    <p className="assessment-integrity-note">Estes registros são evidências factuais para revisão humana. Eles não determinam fraude automaticamente.</p>
    <div className="assessment-integrity-metrics"><article><MonitorX size={18} /><strong>{report.windowExits}</strong><span>saídas da janela</span></article><article><TimerOff size={18} /><strong>{Math.round(report.timeOutsideMs / 1000)}s</strong><span>fora da avaliação</span></article><article><ClipboardPaste size={18} /><strong>{report.pasteEvents}</strong><span>eventos de colagem</span></article><article><Activity size={18} /><strong>{report.sessionConflicts}</strong><span>conflitos de sessão</span></article></div>
    {report.events.length ? <details><summary>Ver linha do tempo ({report.events.length})</summary><ol>{report.events.map((event) => <li key={event.id}><time>{new Date(event.occurredAt).toLocaleString('pt-BR')}</time><strong>{eventLabels[event.type] ?? event.type}</strong>{Object.keys(event.metadata).length ? <code>{JSON.stringify(event.metadata)}</code> : null}</li>)}</ol></details> : <p>Nenhum evento adicional registrado.</p>}
  </section>;
}
