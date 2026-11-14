import { ArrowLeft, ArrowRight, Award, Ban, Brain, CalendarDays, Check, ClipboardList, ExternalLink, FileQuestion, Flame, GraduationCap, ImagePlus, LayoutDashboard, LoaderCircle, LockKeyhole, NotebookPen, Plus, Sparkles, Target, UserRound } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Profile, supabase } from '../supabase';
import { initials } from '../lib/format';
import { updateProfileContact } from '../lib/supabaseHelpers';
import { PasswordField } from './PasswordField';
import { resizeProfileImage } from './TeacherOnboarding';

function isPasswordAlreadyActive(error: { message?: string } | null) {
  return Boolean(error?.message?.toLowerCase().includes('new password should be different'));
}

export function FirstAccessPassword({ profile, onComplete, onLogout }: { profile: Profile; onComplete: () => void; onLogout: () => void }) {
  const [message, setMessage] = useState('');
  const [avatarMessage, setAvatarMessage] = useState('');
  const [avatar, setAvatar] = useState(profile.avatar_url || '');
  const [step, setStep] = useState(0);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState(profile.whatsapp_phone ?? '');
  const [busy, setBusy] = useState(false);
  const steps = [
    { title: 'Boas-vindas', icon: Sparkles },
    { title: 'Seu perfil', icon: UserRound },
    { title: 'Aulas', icon: CalendarDays },
    { title: 'Ferramentas', icon: LayoutDashboard },
    { title: 'Começar', icon: Check },
  ];
  const tourCards = [
    { icon: ClipboardList, title: 'Tarefas', text: 'Envie respostas, anexos e acompanhe correções do professor.' },
    { icon: FileQuestion, title: 'Quiz', text: 'Responda atividades interativas direto na plataforma.' },
    { icon: Brain, title: 'Flashcards', text: 'Revise vocabulário e estruturas com cartões de estudo.' },
    { icon: Target, title: 'Metas', text: 'Acompanhe objetivos pequenos e veja seu progresso crescer.' },
    { icon: NotebookPen, title: 'Diário', text: 'Registre percepções, dúvidas e avanços depois dos estudos.' },
    { icon: Award, title: 'Conquistas', text: 'Ganhe conquistas e mantenha sua sequência de estudos ativa.' },
  ];
  const goNext = () => {
    setMessage('');
    if (step === 1) {
      if (password.length < 8) { setMessage('A nova senha precisa ter pelo menos 8 caracteres.'); return; }
      if (password !== confirmation) { setMessage('As senhas não coincidem.'); return; }
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };
  const goBack = () => {
    setMessage('');
    setStep((current) => Math.max(current - 1, 0));
  };
  const selectAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setAvatar(await resizeProfileImage(file));
      setAvatarMessage('Foto pronta para salvar junto com seu primeiro acesso.');
    } catch (error) {
      setAvatarMessage(error instanceof Error ? error.message : 'Não foi possível carregar a imagem.');
    } finally {
      event.target.value = '';
    }
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    if (password.length < 8) { setMessage('A nova senha precisa ter pelo menos 8 caracteres.'); setStep(1); return; }
    if (password !== confirmation) { setMessage('As senhas não coincidem.'); setStep(1); return; }
    setMessage('');
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    const passwordAlreadyActive = isPasswordAlreadyActive(error);
    if (error && !isPasswordAlreadyActive(error)) { setMessage(error.message); setBusy(false); return; }
    const { error: profileError, whatsappSkipped } = await updateProfileContact(profile.id, { avatar_url: avatar, whatsapp_phone: whatsappPhone.trim() });
    if (profileError) { setMessage(profileError.message); setBusy(false); return; }
    if ((whatsappSkipped && whatsappPhone.trim()) || passwordAlreadyActive) setMessage(whatsappSkipped && whatsappPhone.trim() ? 'Seu WhatsApp será salvo assim que a atualização do banco for aplicada.' : 'Senha já atualizada. Finalizando seu primeiro acesso...');
    const { error: completionError } = await supabase.rpc('complete_initial_password_change');
    if (completionError) { setMessage(completionError.message); setBusy(false); return; }
    onComplete();
  };
  const StepIcon = steps[step].icon;
  return <main className="first-access-page"><section className="first-access-card first-access-card-wide first-access-wizard"><div className="first-access-wizard-top"><div className="first-access-icon"><StepIcon size={27} /></div><div><p className="eyebrow">PRIMEIRO ACESSO</p><h1>{step === 0 ? `Olá, ${profile.full_name}!` : steps[step].title}</h1><p>{step === 0 ? 'Antes de entrar, vamos te mostrar rapidamente como usar seu portal de estudos.' : step === 1 ? 'Configure seus dados principais. A foto é opcional e pode ser alterada depois.' : step === 2 ? 'Aqui você acompanha suas aulas e encontra tudo para entrar no encontro certo.' : step === 3 ? 'Seu portal reúne as ferramentas que vão apoiar sua rotina de estudo.' : 'Tudo pronto. Agora é só começar sua jornada no LangSpot.'}</p></div></div><div className="first-access-steps">{steps.map(({ title, icon: Icon }, index) => <button key={title} type="button" className={index === step ? 'active' : index < step ? 'done' : ''} onClick={() => index < step && setStep(index)} aria-label={title}><Icon size={14} /><span>{title}</span></button>)}</div><form onSubmit={submit}>
    <div key={step} className="first-access-step-content">
    {step === 0 && <div className="first-access-hero-step"><div className="first-access-hero-badge"><GraduationCap size={32} /></div><h2>Seu espaço de aprendizagem</h2><p>No LangSpot você vê próximas aulas, recebe tarefas, responde quizzes, revisa com flashcards, acompanha metas e registra seu progresso em um só lugar.</p><div className="first-access-highlight-grid"><span><CalendarDays size={16} />Aulas organizadas</span><span><Target size={16} />Metas claras</span><span><Flame size={16} />Streaks de estudo</span></div></div>}
    {step === 1 && <><div className="first-access-profile-setup"><div className="profile-photo-preview"><div className="student-avatar large editable-avatar">{avatar ? <img src={avatar} alt={`Pré-visualização de ${profile.full_name}`} /> : initials(profile.full_name)}</div><p>Foto de perfil opcional · JPG, PNG ou WebP de até 5 MB.</p></div><div className="student-avatar-controls"><label><ImagePlus size={15} />Escolher foto<input type="file" accept="image/*" onChange={selectAvatar} /></label>{avatar && <button type="button" onClick={() => { setAvatar(''); setAvatarMessage('Foto removida. Você pode entrar sem imagem.'); }}><Ban size={14} />Remover</button>}</div>{avatarMessage && <div className="auth-message avatar-message">{avatarMessage}</div>}</div><label>WhatsApp<input value={whatsappPhone} onChange={(event) => setWhatsappPhone(event.target.value)} placeholder="+55 85 99999-9999" autoComplete="tel" /></label><PasswordField label="Nova senha" name="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} autoComplete="new-password" required /><PasswordField label="Confirmar nova senha" name="confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} autoComplete="new-password" required /></>}
    {step === 2 && <div className="first-access-feature-list"><article><CalendarDays size={22} /><div><strong>Veja suas próximas aulas</strong><p>A área de aulas mostra data, horário, tema e status dos encontros agendados.</p></div></article><article><ExternalLink size={22} /><div><strong>Acesse o link da aula</strong><p>Quando o professor adiciona um link online, ele aparece ali para você entrar no encontro com facilidade.</p></div></article><article><Plus size={22} /><div><strong>Adicione ao Google Calendar</strong><p>Use a opção de calendário para colocar a aula na sua agenda e evitar esquecer o horário.</p></div></article></div>}
    {step === 3 && <div className="first-access-tour-grid">{tourCards.map(({ icon: Icon, title, text }) => <article key={title}><Icon size={20} /><strong>{title}</strong><p>{text}</p></article>)}</div>}
    {step === 4 && <div className="first-access-hero-step"><div className="first-access-hero-badge success"><Check size={32} /></div><h2>Pronto para começar</h2><p>Ao entrar, explore primeiro a visão geral e confira se há aula, tarefa ou missão diária esperando por você.</p><div className="first-access-final-note"><Sparkles size={17} /><span>Seu progresso começa pequeno, mas fica visível a cada estudo.</span></div></div>}
    </div>
    {message && <div className="auth-message">{message}</div>}<div className="first-access-actions">{step > 0 && <button type="button" className="cancel-button" onClick={goBack} disabled={busy}><ArrowLeft size={16} />Voltar</button>}{step < steps.length - 1 ? <button type="button" className="student-primary" onClick={goNext}><ArrowRight size={16} />Continuar</button> : <button className="student-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <LockKeyhole size={16} />}{busy ? 'Atualizando...' : 'Começar meus estudos'}</button>}</div></form><button className="auth-switch" onClick={onLogout}>Sair da conta</button></section></main>;
}
