import { Ban, Check, Eye, ImagePlus, LoaderCircle, LockKeyhole, Moon, Sun, UserRound } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Profile, StudentRecord, supabase } from '../../supabase';
import { PasswordField } from '../../auth/PasswordField';
import { resizeProfileImage } from '../../auth/TeacherOnboarding';
import { initials } from '../../lib/format';
import { updateProfileContact } from '../../lib/supabaseHelpers';

export function StudentProfilePage({ profile, record, email, theme, onThemeChange, onProfileChange, readOnly = false }: { profile: Profile; record: StudentRecord | null; email: string; theme: 'light' | 'dark'; onThemeChange: (theme: 'light' | 'dark') => void; onProfileChange: (profile: Profile) => void; readOnly?: boolean }) {
  const [message, setMessage] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const [avatar, setAvatar] = useState(profile.avatar_url || '');
  const [savingAvatar, setSavingAvatar] = useState(false);
  const selectAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) { setAvatarMessage('Escolha uma imagem JPG, PNG ou WebP de até 5 MB.'); return; }
    try { setAvatar(await resizeProfileImage(file)); setAvatarMessage('Pré-visualização pronta. Clique em salvar foto.'); }
    catch { setAvatarMessage('Não foi possível processar esta imagem.'); }
    event.target.value = '';
  };
  const saveAvatar = async () => {
    if (readOnly) { setAvatarMessage('Modo de visualização: alterações estão desativadas.'); return; }
    setSavingAvatar(true); setAvatarMessage('');
    const { data, error } = await supabase!.from('profiles').update({ avatar_url: avatar }).eq('id', profile.id).select('*').single();
    if (error) setAvatarMessage(error.message); else { const updated = data as Profile; onProfileChange(updated); setAvatarMessage('Foto de perfil atualizada.'); }
    setSavingAvatar(false);
  };
  const saveStudentDetails = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (readOnly) { setProfileMessage('Modo de visualização: alterações estão desativadas.'); return; }
    if (!supabase || !record) return;
    setSavingProfile(true); setProfileMessage('');
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get('fullName') || '').trim();
    const age = String(form.get('age') || '').trim();
    const goal = String(form.get('goal') || '').trim();
    const whatsappPhone = String(form.get('whatsappPhone') || '').trim();
    const [{ data: updatedProfile, error: profileError, whatsappSkipped }, { error: recordError }] = await Promise.all([
      updateProfileContact(profile.id, { full_name: fullName, whatsapp_phone: whatsappPhone }),
      supabase.from('student_records').update({ age: age ? Number(age) : null, goal }).eq('student_id', profile.id),
    ]);
    if (profileError || recordError) setProfileMessage(profileError?.message ?? recordError?.message ?? 'Não foi possível salvar o perfil.');
    else { onProfileChange(updatedProfile as Profile); record.age = age ? Number(age) : null; record.goal = goal; setProfileMessage(whatsappSkipped && whatsappPhone ? 'Perfil salvo. O WhatsApp será salvo assim que a atualização do banco for aplicada.' : 'Perfil atualizado com sucesso.'); }
    setSavingProfile(false);
  };
  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (readOnly) { setMessage('Modo de visualização: alterações estão desativadas.'); return; }
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') ?? '');
    const confirmation = String(form.get('confirmation') ?? '');
    if (password !== confirmation) { setMessage('As senhas não coincidem.'); return; }
    const { error } = await supabase!.auth.updateUser({ password });
    setMessage(error ? error.message : 'Senha atualizada com sucesso.');
    if (!error) event.currentTarget.reset();
  };
  return <div className="student-page student-profile-page">
    {readOnly && <div className="student-readonly-note"><Eye size={16} /><span>Visualização somente leitura. Os dados abaixo são os dados reais do aluno.</span></div>}
    <section className="student-profile-hero"><div className="student-avatar large editable-avatar">{avatar ? <img src={avatar} alt={`Avatar de ${profile.full_name}`} /> : initials(profile.full_name)}</div><div><p className="eyebrow">MEU PERFIL</p><h2>{profile.full_name}</h2><p>{email}</p><span>{record?.level ?? 'Nível não informado'} · {record?.goal || 'Objetivo ainda não definido'}</span></div><UserRound size={66} /></section>
    <div className="student-profile-layout">
      <section className="student-panel student-profile-information"><div className="student-section-heading"><div><p className="eyebrow">INFORMAÇÕES PESSOAIS</p><h2>Seus dados de aprendizagem</h2></div><UserRound size={19} /></div><p className="profile-section-description">Mantenha seus dados atualizados para que o professor acompanhe melhor seus objetivos.</p><form className="student-profile-form" onSubmit={saveStudentDetails}><label>Nome completo<input name="fullName" defaultValue={profile.full_name} required /></label><label>Idade<input name="age" type="number" min="1" max="120" defaultValue={record?.age ?? ''} /></label><label>Nível atual<input value={record?.level ?? 'Não informado'} disabled /></label><label>Objetivo de aprendizagem<input name="goal" defaultValue={record?.goal ?? ''} placeholder="Ex.: conversação, viagem..." /></label><label>WhatsApp<input name="whatsappPhone" defaultValue={profile.whatsapp_phone ?? ''} placeholder="+55 85 99999-9999" /></label>{profileMessage && <div className="auth-message full-field">{profileMessage}</div>}<div className="profile-form-actions full-field"><button className="student-primary" disabled={savingProfile}>{savingProfile ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />}{savingProfile ? 'Salvando...' : 'Salvar perfil'}</button></div></form></section>
      <aside className="student-profile-side">
        <section className="student-panel profile-photo-card"><div className="student-section-heading"><div><p className="eyebrow">APARÊNCIA</p><h2>Foto de perfil</h2></div><ImagePlus size={19} /></div><div className="profile-photo-preview"><div className="student-avatar large editable-avatar">{avatar ? <img src={avatar} alt={`Pré-visualização de ${profile.full_name}`} /> : initials(profile.full_name)}</div><p>JPG, PNG ou WebP de até 5 MB.</p></div><div className="student-avatar-controls"><label><ImagePlus size={15} />Escolher foto<input type="file" accept="image/*" onChange={selectAvatar} /></label>{avatar && <button type="button" onClick={() => { setAvatar(''); setAvatarMessage('Foto removida da pré-visualização. Clique em salvar foto.'); }}><Ban size={14} />Remover</button>}<button type="button" className="student-primary" disabled={savingAvatar || avatar === profile.avatar_url} onClick={saveAvatar}>{savingAvatar ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />}{savingAvatar ? 'Salvando...' : 'Salvar foto'}</button></div>{avatarMessage && <div className="auth-message avatar-message">{avatarMessage}</div>}</section>
        <section className="student-panel student-interface-card"><div className="student-section-heading"><div><p className="eyebrow">INTERFACE</p><h2>Tema do portal</h2></div><Moon size={19} /></div><div className="theme-setting"><strong>Tema</strong><span>A mudança é aplicada imediatamente neste dispositivo.</span><div><button type="button" className={theme === 'light' ? 'active' : ''} onClick={() => onThemeChange('light')}><Sun size={16} />Claro</button><button type="button" className={theme === 'dark' ? 'active' : ''} onClick={() => onThemeChange('dark')}><Moon size={16} />Escuro</button></div></div></section>
        <section className="student-panel password-panel"><div className="student-section-heading"><div><p className="eyebrow">SEGURANÇA</p><h2>Alterar senha</h2></div><LockKeyhole size={19} /></div><p>Use pelo menos 6 caracteres para manter sua conta protegida.</p><form onSubmit={updatePassword}><PasswordField label="Nova senha" name="password" minLength={6} autoComplete="new-password" required /><PasswordField label="Confirmar nova senha" name="confirmation" minLength={6} autoComplete="new-password" required />{message && <div className="auth-message">{message}</div>}<button className="student-primary"><LockKeyhole size={15} />Atualizar senha</button></form></section>
      </aside>
    </div>
  </div>;
}
