import { ArrowRight, ImagePlus, LoaderCircle, UserRound } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Profile, supabase } from '../supabase';

export function TeacherOnboarding({ profile, authEmail, onComplete, onLogout }: { profile: Profile; authEmail: string; onComplete: (profile: Profile) => void; onLogout: () => void }) {
  const [name, setName] = useState(profile.full_name || '');
  const [email, setEmail] = useState(profile.email || authEmail);
  const [schoolName, setSchoolName] = useState(profile.school_name || '');
  const [avatar, setAvatar] = useState(profile.avatar_url || '');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const selectAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setMessage('Escolha uma imagem JPG, PNG ou WebP de até 5 MB.');
      return;
    }
    try { setAvatar(await resizeProfileImage(file)); setMessage(''); }
    catch { setMessage('Não foi possível processar a imagem.'); }
    event.target.value = '';
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setMessage('');
    const updates = { full_name: name.trim(), email: email.trim(), school_name: schoolName.trim(), avatar_url: avatar, onboarding_completed: true };
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', profile.id).select('*').single();
    if (error) { setMessage(error.message); setBusy(false); return; }
    onComplete(data as Profile);
  };

  return <main className="teacher-onboarding-page"><section className="teacher-onboarding-card"><div className="onboarding-copy"><p className="eyebrow">PRIMEIRO ACESSO</p><h1>Vamos preparar seu espaço de trabalho</h1><p>Confirme seus dados profissionais. Eles aparecerão no dashboard, nos relatórios e na área de configurações.</p></div><form onSubmit={submit}><div className="onboarding-avatar"><div>{avatar ? <img src={avatar} alt="Avatar do professor" /> : <UserRound size={48} />}</div><label><ImagePlus size={16} />Escolher foto<input type="file" accept="image/*" onChange={selectAvatar} /></label></div><div className="onboarding-fields"><label>Nome completo<input value={name} onChange={(event) => setName(event.target.value)} required autoFocus /></label><label>E-mail profissional<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label className="full-field">Escola, curso ou marca <span>(opcional)</span><input value={schoolName} onChange={(event) => setSchoolName(event.target.value)} placeholder="Ex.: Maylton English Classes" /></label></div>{message && <div className="auth-message">{message}</div>}<button className="student-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <ArrowRight size={17} />}{busy ? 'Salvando...' : 'Entrar no meu dashboard'}</button></form><button className="auth-switch" onClick={onLogout}>Sair da conta</button></section></main>;
}

export function resizeProfileImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const crop = Math.min(image.width, image.height);
      const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 320;
      const context = canvas.getContext('2d');
      if (!context) { URL.revokeObjectURL(url); reject(); return; }
      context.drawImage(image, (image.width - crop) / 2, (image.height - crop) / 2, crop, crop, 0, 0, 320, 320);
      URL.revokeObjectURL(url); resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(); };
    image.src = url;
  });
}
