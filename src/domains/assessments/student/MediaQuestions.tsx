import { useCallback, useEffect, useRef, useState } from 'react';
import { acquireMicrophone } from './microphone';
import { setPendingRecording } from './pendingRecordings';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Mic, Pause, Play, Square, UploadCloud } from 'lucide-react';
import { beginListeningPlay, createAssessmentAudioUrl, getSpeakingUploadTarget, registerSpeakingRecording, uploadSpeakingRecording } from '../mediaService';
import type { AssessmentPresentedQuestion } from '../types';

export function ListeningQuestion({ client, attemptId, question }: { client: SupabaseClient; attemptId: string; question: AssessmentPresentedQuestion }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [plays, setPlays] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState('');
  const play = useCallback(async () => {
    setMessage('');
    try {
      const allowance = await beginListeningPlay(client, attemptId, question.id);
      setPlays(allowance.playCount);
      if (!allowance.allowed) { setMessage('O limite de reproduções foi atingido.'); return; }
      const url = await createAssessmentAudioUrl(client, allowance.audioPath);
      if (!audio.current) return;
      audio.current.src = url;
      await audio.current.play();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível reproduzir o áudio.'); }
  }, [attemptId, client, question.id]);
  useEffect(() => { if (question.autoplay && plays === 0) void play(); }, [play, plays, question.autoplay]);
  return <div className="assessment-media-question"><audio ref={audio} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
    <button type="button" className="secondary-button" onClick={() => playing ? audio.current?.pause() : void play()} disabled={plays >= (question.maxPlays ?? 1) && !playing}>{playing ? <Pause size={17} /> : <Play size={17} />}{playing ? 'Pausar' : 'Ouvir áudio'}</button>
    <span>{plays}/{question.maxPlays ?? 1} reproduções usadas</span>{question.transcript && <p className="assessment-transcript"><b>Transcrição</b>{question.transcript}</p>}{message && <small role="alert">{message}</small>}</div>;
}

function supportedRecordingType(): { mime: string; extension: string } {
  const choices = [{ mime: 'audio/webm;codecs=opus', extension: 'webm' }, { mime: 'audio/webm', extension: 'webm' }, { mime: 'audio/mp4', extension: 'm4a' }];
  return choices.find((choice) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(choice.mime)) ?? { mime: '', extension: 'webm' };
}

export function SpeakingQuestion({ client, attemptId, question, value, onChange }: { client: SupabaseClient; attemptId: string; question: AssessmentPresentedQuestion; value: string; onChange: (value: string) => void }) {
  const [phase, setPhase] = useState<'idle' | 'preparing' | 'ready' | 'recording' | 'review' | 'uploading' | 'done'>(value ? 'done' : 'idle');
  const [remaining, setRemaining] = useState(0);
  const [previewUrl, setPreviewUrl] = useState('');
  const [message, setMessage] = useState('');
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const blob = useRef<Blob | null>(null);
  const startedAt = useRef(0);
  const recordedDuration = useRef(0);
  // Resolves when the recorder has stopped and the blob is ready.
  const stopped = useRef<(() => void) | null>(null);

  // The stream is shared for the whole attempt (see microphone.ts); only drop our reference.
  const releaseMicrophone = useCallback(() => { stream.current = null; }, []);
  const stop = useCallback(() => { if (recorder.current?.state === 'recording') recorder.current.stop(); }, []);
  useEffect(() => () => { stop(); releaseMicrophone(); if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl, releaseMicrophone, stop]);
  useEffect(() => {
    if (!['preparing', 'recording'].includes(phase) || remaining <= 0) return;
    const timer = window.setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, remaining]);
  useEffect(() => { if (phase === 'preparing' && remaining === 0) setPhase('ready'); if (phase === 'recording' && remaining === 0) stop(); }, [phase, remaining, stop]);

  const prepare = () => { setMessage(''); setRemaining(question.preparationSeconds ?? 30); setPhase('preparing'); };
  const start = async () => {
    setMessage('');
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('A gravação de áudio não é suportada neste dispositivo.');
      stream.current = await acquireMicrophone();
      const format = supportedRecordingType(); chunks.current = [];
      recorder.current = new MediaRecorder(stream.current, format.mime ? { mimeType: format.mime } : undefined);
      recorder.current.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      recorder.current.onstop = () => {
        recordedDuration.current = Date.now() - startedAt.current;
        const recording = new Blob(chunks.current, { type: recorder.current?.mimeType || format.mime || 'audio/webm' });
        blob.current = recording; releaseMicrophone();
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(recording)); setPhase('review');
        stopped.current?.(); stopped.current = null;
        if (!mounted.current) void sendRef.current().catch(() => undefined);
      };
      startedAt.current = Date.now(); setRemaining(question.recordingSeconds ?? 120); recorder.current.start(250); setPhase('recording');
    } catch (error) { releaseMicrophone(); setMessage(error instanceof Error ? error.message : 'Não foi possível acessar o microfone.'); setPhase('idle'); }
  };
  const sending = useRef<Promise<void> | null>(null);
  /** Sends the recorded blob once; throws if it cannot be sent. */
  const send = useCallback(() => {
    if (sending.current) return sending.current;
    const recording = blob.current;
    if (!recording) return Promise.resolve();
    setPhase('uploading'); setMessage('');
    sending.current = (async () => {
      try {
        const format = supportedRecordingType();
        const path = await getSpeakingUploadTarget(client, attemptId, question.id, format.extension);
        await uploadSpeakingRecording(client, path, recording);
        await registerSpeakingRecording(client, attemptId, question.id, path, recordedDuration.current);
        blob.current = null; onChange(path); setPhase('done');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Não foi possível enviar a gravação.'); setPhase('review');
        throw error;
      } finally { sending.current = null; }
    })();
    return sending.current;
  }, [attemptId, client, onChange, question.id]);
  const upload = () => { void send().catch(() => undefined); };

  // Leaving the question (unmount) with a recording that was not sent: send it in the background.
  const mounted = useRef(true);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const sendRef = useRef(send);
  sendRef.current = send;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (phaseRef.current === 'review') void sendRef.current().catch(() => undefined);
    };
  }, []);

  // While a recording exists only in this browser, the runner sends it before closing the part.
  useEffect(() => {
    if (phase !== 'recording' && phase !== 'review') return;
    setPendingRecording(question.id, async () => {
      if (recorder.current?.state === 'recording') {
        await new Promise<void>((resolve) => { stopped.current = resolve; recorder.current?.stop(); });
      }
      await send();
    });
    return () => setPendingRecording(question.id, null);
  }, [phase, question.id, send]);
  return <div className="assessment-media-question assessment-speaking">
    {phase === 'idle' && <><button type="button" className="secondary-button" onClick={prepare}><Mic size={17} />Iniciar preparação</button><span>O microfone liberado na verificação de equipamento será usado na gravação.</span></>}
    {phase === 'preparing' && <><strong>Preparação: {remaining}s</strong><button type="button" className="primary-button" onClick={() => void start()}><Mic size={17} />Gravar agora</button></>}
    {phase === 'ready' && <><strong>Preparação concluída.</strong><button type="button" className="primary-button" onClick={() => void start()}><Mic size={17} />Começar gravação</button></>}
    {phase === 'recording' && <><strong>Gravando · {remaining}s</strong><button type="button" className="danger-button" onClick={stop}><Square size={16} />Parar</button></>}
    {phase === 'review' && <><audio aria-label="Prévia da sua gravação" src={previewUrl} controls preload="metadata" />{question.allowReview !== false && <button type="button" className="secondary-button" onClick={() => { blob.current = null; setPhase('idle'); }}><Mic size={16} />Gravar novamente</button>}<button type="button" className="primary-button" onClick={upload}><UploadCloud size={16} />Enviar gravação</button><span>Se você concluir a etapa sem clicar em enviar, a gravação é enviada automaticamente.</span></>}
    {phase === 'uploading' && <strong>Enviando gravação…</strong>}{phase === 'done' && <strong>Gravação enviada com segurança.</strong>}{message && <small role="alert">{message}</small>}
  </div>;
}
