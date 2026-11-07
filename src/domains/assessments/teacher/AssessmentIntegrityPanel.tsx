import { Activity, ClipboardCopy, ClipboardPaste, Gauge, MonitorX, TextCursorInput, TimerOff, Users } from 'lucide-react';
import type { AssessmentIntegrityReport, AssessmentIntegritySignals } from '../types';

const eventLabels: Record<string, string> = {
  assessment_started: 'Avaliação iniciada', question_opened: 'Questão aberta', question_closed: 'Questão encerrada',
  tab_blur: 'Saiu da janela', tab_focus: 'Retornou à janela', fullscreen_exit: 'Saiu da tela cheia',
  paste_detected: 'Texto colado', network_disconnect: 'Ficou offline', network_reconnect: 'Reconectou',
  resumed: 'Tentativa retomada', submitted: 'Avaliação enviada', session_conflict: 'Outra sessão bloqueada',
  copy_detected: 'Texto copiado', drop_detected: 'Texto arrastado para a resposta', bulk_insert_detected: 'Texto inserido sem digitação',
  live_session_opened: 'Sessão ao vivo aberta', live_response_scored: 'Tarefa pontuada ao vivo', audio_play_started: 'Áudio reproduzido',
};

export function AssessmentIntegrityPanel({ report, signals }: { report: AssessmentIntegrityReport; signals?: AssessmentIntegritySignals | null }) {
  const count = (type: string) => report.events.filter((event) => event.type === type).length;
  const inserted = count('bulk_insert_detected') + count('drop_detected');
  return <section className="assessment-integrity-panel"><header><div><p className="eyebrow">INTEGRIDADE</p><h3>Eventos observados</h3></div><span className={`assessment-integrity-status ${report.status}`}>{report.status.replace(/_/g, ' ')}</span></header>
    <p className="assessment-integrity-note">Estes registros são evidências factuais para revisão humana. Eles não determinam fraude automaticamente.</p>
    <div className="assessment-integrity-metrics">
      <article><MonitorX size={18} /><strong>{report.windowExits}</strong><span>saídas da janela</span></article>
      <article><TimerOff size={18} /><strong>{Math.round(report.timeOutsideMs / 1000)}s</strong><span>fora da avaliação</span></article>
      <article><ClipboardPaste size={18} /><strong>{report.pasteEvents}</strong><span>colagens</span></article>
      <article><ClipboardCopy size={18} /><strong>{count('copy_detected')}</strong><span>cópias de texto</span></article>
      <article><TextCursorInput size={18} /><strong>{inserted}</strong><span>inserções sem digitar</span></article>
      <article><Activity size={18} /><strong>{report.sessionConflicts}</strong><span>conflitos de sessão</span></article>
    </div>
    {signals && <div className="assessment-server-signals">
      <h4>Sinais calculados no servidor</h4>
      <p className="assessment-integrity-note">Baseados nos horários e respostas registrados pelo servidor; o aluno não consegue bloqueá-los.</p>
      <ul>
        <li className={signals.rapidParts.length ? 'flagged' : ''}><Gauge size={16} />{signals.rapidParts.length
          ? <span>Leitura rápida demais: {signals.rapidParts.map((part) => `${part.title} (${part.words} palavras em ${part.seconds}s, ≈${part.wordsPerMinute} palavras/min${part.source === 'client' ? ', tempo informado pelo navegador' : ''})`).join('; ')}. Acima de {signals.maxReadingWordsPerMinute} palavras/min a compreensão é improvável.</span>
          : <span>Nenhuma parte de leitura concluída em tempo incompatível com o texto.</span>}</li>
        <li className={signals.fastObjectiveAnswers.count >= 5 ? 'flagged' : ''}><TimerOff size={16} /><span>{signals.fastObjectiveAnswers.count} de {signals.fastObjectiveAnswers.total} questões objetivas respondidas em menos de 2 segundos.</span></li>
        <li className={signals.sharedWrongAnswers.length ? 'flagged' : ''}><Users size={16} />{signals.sharedWrongAnswers.length
          ? <span>Erros idênticos aos de colegas: {signals.sharedWrongAnswers.map((match) => `${match.studentName ?? 'Aluno'} (${match.sharedWrong} de ${match.ownWrong} erros iguais)`).join('; ')}.</span>
          : <span>Nenhum padrão de erros idênticos com colegas nesta avaliação.</span>}</li>
      </ul>
    </div>}
    {report.events.length ? <details><summary>Ver linha do tempo ({report.events.length})</summary><ol>{report.events.map((event) => <li key={event.id}><time>{new Date(event.occurredAt).toLocaleString('pt-BR')}</time><strong>{eventLabels[event.type] ?? event.type}</strong>{Object.keys(event.metadata).length ? <code>{JSON.stringify(event.metadata)}</code> : null}</li>)}</ol></details> : <p>Nenhum evento adicional registrado.</p>}
  </section>;
}
