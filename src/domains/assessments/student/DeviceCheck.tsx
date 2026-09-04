import { useEffect, useRef, useState } from 'react';
import { Check, Headphones, Mic, ShieldAlert } from 'lucide-react';

type CheckState = 'pending' | 'ok' | 'failed';

export function DeviceCheck({ needsAudio, needsMicrophone, onReady, onCancel }: { needsAudio: boolean; needsMicrophone: boolean; onReady: () => void; onCancel: () => void }) {
  const supported = typeof MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
  const [audio, setAudio] = useState<CheckState>(needsAudio ? 'pending' : 'ok');
  const [microphone, setMicrophone] = useState<CheckState>(needsMicrophone ? 'pending' : 'ok');
  const [recording, setRecording] = useState(false);
  const stream = useRef<MediaStream | null>(null);
  useEffect(() => () => stream.current?.getTracks().forEach((track) => track.stop()), []);

  const testAudio = () => {
    try {
      const context = new AudioContext(); const oscillator = context.createOscillator(); const gain = context.createGain();
      gain.gain.value = 0.08; oscillator.frequency.value = 440; oscillator.connect(gain).connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.35);
      setAudio('ok'); void context.close();
    } catch { setAudio('failed'); }
  };
  const testMicrophone = async () => {
    if (!supported) { setMicrophone('failed'); return; }
    try {
      stream.current?.getTracks().forEach((track) => track.stop());
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream.current); setRecording(true); recorder.start();
      window.setTimeout(() => { recorder.stop(); stream.current?.getTracks().forEach((track) => track.stop()); stream.current = null; setRecording(false); setMicrophone('ok'); }, 1500);
    } catch { setRecording(false); setMicrophone('failed'); }
  };
  const ready = audio === 'ok' && microphone === 'ok' && (!needsMicrophone || supported);
  return <section className="device-check">
    <p className="eyebrow">DEVICE CHECK</p><h3>Verifique seu equipamento</h3><p>Faça os testes antes de iniciar. Uma falha técnica pode exigir revisão manual do resultado.</p>
    {needsAudio && <button type="button" className={audio === 'ok' ? 'ok' : ''} onClick={testAudio}><Headphones size={18} /><span><strong>Saída de áudio</strong><small>{audio === 'ok' ? 'Som reproduzido' : audio === 'failed' ? 'Não foi possível reproduzir' : 'Clique para ouvir o som de teste'}</small></span>{audio === 'ok' && <Check size={18} />}</button>}
    {needsMicrophone && <button type="button" className={microphone === 'ok' ? 'ok' : ''} disabled={recording} onClick={() => void testMicrophone()}><Mic size={18} /><span><strong>Microfone e gravação</strong><small>{recording ? 'Gravando teste…' : microphone === 'ok' ? 'Permissão e gravação confirmadas' : microphone === 'failed' ? 'Verifique a permissão do navegador' : 'Clique para gravar por 1,5 segundo'}</small></span>{microphone === 'ok' && <Check size={18} />}</button>}
    {needsMicrophone && !supported && <p role="alert"><ShieldAlert size={16} />Este navegador não oferece suporte à gravação exigida por esta avaliação.</p>}
    <div className="form-actions"><button className="cancel-button" onClick={onCancel}>Agora não</button><button className="student-primary" disabled={!ready} onClick={onReady}>Continuar</button></div>
  </section>;
}
