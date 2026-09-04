import { useCallback, useEffect, useRef, useState } from 'react';
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

  const releaseMicrophone = useCallback(() => { stream.current?.getTracks().forEach((track) => track.stop()); stream.current = null; }, []);
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
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const format = supportedRecordingType(); chunks.current = [];
      recorder.current = new MediaRecorder(stream.current, format.mime ? { mimeType: format.mime } : undefined);
      recorder.current.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      recorder.current.onstop = () => {
        recordedDuration.current = Date.now() - startedAt.current;
        const recording = new Blob(chunks.current, { type: recorder.current?.mimeType || format.mime || 'audio/webm' });
        blob.current = recording; releaseMicrophone();
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(recording)); setPhase('review');
      };
      startedAt.current = Date.now(); setRemaining(question.recordingSeconds ?? 120); recorder.current.start(250); setPhase('recording');
    } catch (error) { releaseMicrophone(); setMessage(error instanceof Error ? error.message : 'Não foi possível acessar o microfone.'); setPhase('idle'); }
  };
  const upload = async () => {
    if (!blob.current) return;
    setPhase('uploading'); setMessage('');
    try {
      const format = supportedRecordingType();
      const path = await getSpeakingUploadTarget(client, attemptId, question.id, format.extension);
      await uploadSpeakingRecording(client, path, blob.current);
      await registerSpeakingRecording(client, attemptId, question.id, path, recordedDuration.current);
      onChange(path); setPhase('done');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível enviar a gravação.'); setPhase('review'); }
  };
  return <div className="assessment-media-question assessment-speaking">
    {phase === 'idle' && <><button type="button" className="secondary-button" onClick={prepare}><Mic size={17} />Iniciar preparação</button><span>O microfone só será solicitado ao começar a gravação.</span></>}
    {phase === 'preparing' && <><strong>Preparação: {remaining}s</strong><button type="button" className="primary-button" onClick={() => void start()}><Mic size={17} />Gravar agora</button></>}
    {phase === 'ready' && <><strong>Preparação concluída.</strong><button type="button" className="primary-button" onClick={() => void start()}><Mic size={17} />Começar gravação</button></>}
    {phase === 'recording' && <><strong>Gravando · {remaining}s</strong><button type="button" className="danger-button" onClick={stop}><Square size={16} />Parar</button></>}
    {phase === 'review' && <><audio aria-label="Prévia da sua gravação" src={previewUrl} controls preload="metadata" />{question.allowReview !== false && <button type="button" className="secondary-button" onClick={() => { blob.current = null; setPhase('idle'); }}><Mic size={16} />Gravar novamente</button>}<button type="button" className="primary-button" onClick={() => void upload()}><UploadCloud size={16} />Enviar gravação</button></>}
    {phase === 'uploading' && <strong>Enviando gravação…</strong>}{phase === 'done' && <strong>Gravação enviada com segurança.</strong>}{message && <small role="alert">{message}</small>}
  </div>;
}
